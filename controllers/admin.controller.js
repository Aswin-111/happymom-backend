import fs from "fs";
import path from "path";
import xlsx from "xlsx";

import moment from "moment";
import ExcelJS from "exceljs"; // if you're using ESM (`type: "module"`)

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

import Wallet from "../models/wallet.model.js";
import Admin from "../models/admin.model.js";
import { get } from "http";
import { create } from "domain";
const generateMonthlyReferralData = async (userId, year) => {
  const monthlyData = {};
  for (let month = 0; month < 12; month++) {
    const start = moment.utc({ year, month, day: 1 }).startOf("month").toDate();
    const end = moment.utc({ year, month, day: 1 }).endOf("month").toDate();

    const count = await User.countDocuments({
      referred_by: userId,
      reg_date: { $gte: start, $lte: end },
    });

    const monthName = moment().month(month).format("MMMM");
    monthlyData[monthName] = count;
  }
  return { year, ...monthlyData };
};

const AdminController = {
  login: async (req, res) => {
    try {
      const { phone, password } = req.body;
      const user = await Admin.findOne({ phone });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = user.generateToken(); // ✅ This should now work
      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },



  getAdmins: async (req, res) => {
    try {
      const admins = await Admin.find({});
      res.json({ admins });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    }
  },


  createAdmin: async (req, res) => {
    try {
      const { name, phone, password } = req.body;
      const findUser = await Admin.findOne({ phone });
      if (findUser) {
        return res.status(400).json({ message: "Admin already exists" });
      }
      const admin = new Admin({ name, phone, password });
      await admin.save();
      res.json({ message: "Admin created successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getDashUsers: async (req, res) => {
    try {
      const filter = req.query.filter || "";
      const users = await User.find({}).select("full_name role phone");
      const totalusers = await User.countDocuments({});
      res.json({ users, totalusers });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { id, password } = req.body;
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.password = password;
      await user.save();
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getDashboardaData: async (req, res) => {
    try {
      const { id, nodes, referral_query } = req.query;

      if (!id) {
        return res.status(400).json({ message: "Missing user ID" });
      }

      let users = [];
      let referralQueryData = null;

      // ✅ Process referral_query (specific month)
      if (referral_query && /^\d{1,2}\/\d{4}$/.test(referral_query)) {
        const date = moment(referral_query, "M/YYYY");
        if (!date.isValid()) {
          return res
            .status(400)
            .json({ message: "Invalid referral_query format" });
        }

        const startDate = date.startOf("month").toDate();
        const endDate = date.endOf("month").toDate();

        referralQueryData = await User.find({
          referred_by: id,
          reg_date: { $gte: startDate, $lte: endDate },
        })
          .select("full_name phone email reg_date referred_by")
          .populate("referred_by", "full_name phone email")
          .sort({ reg_date: -1 });
      }

      // ✅ Process referral_query (entire year)
      else if (referral_query && /^\d{4}$/.test(referral_query)) {
        const year = parseInt(referral_query);
        referralQueryData = await generateMonthlyReferralData(id, year);
      }

      // ✅ Process nodes = top → users referred by this user
      if (nodes === "top") {
        users = await User.find({ referred_by: id })
          .select(
            "full_name phone email reg_date referred_by profile_status status"
          )
          .populate("referred_by", "full_name phone email")
          .sort({ reg_date: -1 });
      }

      // ✅ Process nodes = under → this user's referrer
      else if (nodes === "under") {
        const currentUser = await User.findById(id).populate(
          "referred_by",
          "full_name phone email reg_date"
        );
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }
        users = currentUser.referred_by
          ? [
            {
              _id: currentUser.referred_by._id,
              full_name: currentUser.referred_by.full_name,
              phone: currentUser.referred_by.phone,
              email: currentUser.referred_by.email,
              reg_date: currentUser.referred_by.reg_date,
            },
          ]
          : [];
      }

      return res.status(200).json({
        success: true,
        type: nodes || "referral_query",
        count: users.length,
        users,
        referral_query_data: referralQueryData || [],
      });
    } catch (error) {
      console.error("Error in getDashboardaData:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  },

  getEditUser: async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await User.findById(id).select("phone");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Error in getUserData:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  },

  editUserData: async (req, res) => {
    try {
      const { id, phone, password } = req.body;

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (phone) user.phone = phone;
      if (password) user.password = password; // pre-save hook will hash this

      await user.save();

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Error in editUserData:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  },
  getUserWallet: async (req, res) => {
    try {
      const { id } = req.query; // The user's ID will be passed as a query parameter

      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Find the user by their ID and return only the wallet balance
      const user = await User.findById(id).select(
        "wallet_balance incentive_desc"
      );
      console.log(user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        wallet_balance: user.wallet_balance,
        incentive_desc: user.incentive_desc,
      });
    } catch (error) {
      console.error("Error in getUserWallet:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  },

  addIncentives: async (req, res) => {
    try {
      const { userId, incentiveAmount } = req.body; // Incentive amount and user ID should be sent in the request body

      // Check if the required data is provided
      if (!userId || !incentiveAmount) {
        return res
          .status(400)
          .json({ message: "Missing userId or incentiveAmount" });
      }

      if (incentiveAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Incentive amount must be greater than 0" });
      }

      // Find the admin's data (assuming admin has role 'admin' and is logged in)
      const admin = await User.findOne({ role: "admin" }); // Change this logic if admin is logged in and has session/token

      if (!admin || admin.wallet_balance < incentiveAmount) {
        return res
          .status(400)
          .json({ message: "Admin does not have enough balance" });
      }

      // Find the user to whom the incentive will be added
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Add incentive to the user's wallet
      user.wallet_balance =
        Number(user.wallet_balance) + Number(incentiveAmount); // Convert to number before adding incentiveAmount;

      // Record the incentive in user's incentive history (optional but recommended)
      user.incentive_desc.push({
        amount: incentiveAmount,
        desc: "Admin Incentive",
        user: userId,
      });

      // Deduct the incentive amount from admin's wallet
      admin.wallet_balance -= incentiveAmount;

      // Save both the user and admin data
      await user.save();
      await admin.save();

      return res.status(200).json({
        success: true,
        message: `Incentive of ${incentiveAmount} added to user ${user.full_name}`,
        user_wallet_balance: user.wallet_balance,
        admin_wallet_balance: admin.wallet_balance,
      });
    } catch (error) {
      console.error("Error in addIncentives:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  },
  addCreditPoints: async (req, res) => {
    try {
      const { userId, creditAmount, description } = req.body;

      // Basic validation
      if (!userId || !creditAmount || creditAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Missing or invalid userId or creditAmount" });
      }

      // Fetch user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Push credit entry
      user.credit_points.push({
        amount: creditAmount,
        desc: description || "Credited by Admin",
        date: new Date(),
      });

      await user.save();

      res.status(200).json({
        success: true,
        message: `Credited ${creditAmount} points to user ${user.full_name}`,
        credit_points: user.credit_points,
      });
    } catch (error) {
      console.error("Error adding credit points:", error);
      res.status(500).json({ message: "Server Error" });
    }
  },

  updateCreditPoints: async (req, res) => {
    try {
      const { userId, creditPointId, amount, desc } = req.body;

      // Validate input
      if (!userId || !creditPointId || !amount) {
        return res
          .status(400)
          .json({ message: "Missing userId, creditPointId, or amount" });
      }

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find and update the specific credit point entry
      const credit = user.credit_points.id(creditPointId);
      if (!credit) {
        return res
          .status(404)
          .json({ message: "Credit point entry not found" });
      }

      credit.amount = amount;
      if (desc) credit.desc = desc;
      credit.date = new Date();

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Credit point updated successfully",
        updated_credit: credit,
      });
    } catch (error) {
      console.error("Error updating credit points:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  sendNotifications: async (req, res) => {
    try {
      const { event_name, event_date, event_description } = req.body;
      const event_image = req.file?.filename;

      // Check required fields
      if (!event_name || !event_date || !event_description || !event_image) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Convert "DD-MM-YYYY" to valid Date object
      const parsedDate = moment(event_date, "DD-MM-YYYY", true);

      if (!parsedDate.isValid()) {
        return res
          .status(400)
          .json({ message: "Invalid event_date format. Use DD-MM-YYYY" });
      }

      const newNotification = new Notification({
        event_name,
        event_date: parsedDate.toDate(),
        event_description,
        event_image,
      });

      await newNotification.save();

      return res.status(201).json({
        success: true,
        message: "Notification sent successfully",
      });
    } catch (error) {
      console.error("Notification error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while sending notification",
      });
    }
  },
  getNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find().sort({ event_date: -1 });
      return res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
  deleteNotification: async (req, res) => {
    try {
      const __dirname = path.resolve();
      const { notification_id } = req.body;

      if (!notification_id) {
        return res
          .status(400)
          .json({ success: false, message: "Notification ID required" });
      }

      const notification = await Notification.findById(notification_id);
      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }

      // Delete the image if exists
      const imagePath = path.join(
        __dirname,
        "uploads/notifications",
        notification.event_image
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Delete the document
      await Notification.findByIdAndDelete(notification_id);

      return res
        .status(200)
        .json({ success: true, message: "Notification deleted" });
    } catch (error) {
      console.error("Delete Notification Error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
  authorizeUsers: async (req, res) => {
    try {
      console.log("inside authorizeUsers");
      if (!req.file) {
        return res.status(400).json({ message: "Excel file is required" });
      }

      const filePath = path.resolve(req.file.path);
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      let updatedUsers = [];

      for (const row of data) {
        const mobileField = Object.keys(row).find((key) =>
          key.toLowerCase().includes("mobile number")
        );
        if (!mobileField) continue;

        const cleanedPhone = String(row[mobileField])
          .replace(/\D/g, "")
          .slice(-10);

        const user = await User.findOne({ phone: cleanedPhone });

        if (user && user.status !== "active") {
          user.status = "active";
          await user.save();
          updatedUsers.push(cleanedPhone);
        }
      }

      // Cleanup uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        message: `${updatedUsers.length} users authorized.`,
        updatedPhones: updatedUsers,
      });
    } catch (err) {
      console.error("Error in authorizeUsers:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
  exportPendingWallets: async (req, res) => {
    try {
      // Fetch all pending wallets and populate user data
      const pendingWallets = await Wallet.find({ status: "pending" }).populate({
        path: "user_id",
        select:
          "full_name phone email profile.pan_num profile.bank_name profile.bank_account_num profile.bank_ifsc_code",
      });

      if (pendingWallets.length === 0) {
        return res.status(404).json({ message: "No pending wallets found" });
      }

      // Create a new Excel workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Pending Wallets");

      // Define columns
      worksheet.columns = [
        { header: "Full Name", key: "full_name", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Email", key: "email", width: 25 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Bank Name", key: "bank_name", width: 20 },
        { header: "Account Number", key: "bank_account_num", width: 20 },
        { header: "IFSC Code", key: "bank_ifsc_code", width: 15 },
        { header: "PAN Number", key: "pan_num", width: 20 },
      ];

      // Fill rows with data from the populated user and wallet
      for (const wallet of pendingWallets) {
        const user = wallet.user_id;

        if (!user || !user.profile) continue;

        worksheet.addRow({
          full_name: user.full_name || "",
          phone: user.phone || "",
          email: user.email || "",
          amount: wallet.amount || 0,
          bank_name: user.profile.bank_name || "",
          bank_account_num: user.profile.bank_account_num || "",
          bank_ifsc_code: user.profile.bank_ifsc_code || "",
          pan_num: user.profile.pan_num || "",
        });

        // Update wallet status to 'processing'
        wallet.status = "processing";
        await wallet.save();
      }

      // Set headers for file download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=wallets_pending.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("❌ Error exporting wallet records:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getProcessingWallets: async (req, res) => {
    try {
      const { page = 1, limit = 10, startDate, endDate } = req.query;

      const filter = { status: "processing" };

      if (startDate || endDate) {
        filter.admin_redeem_date = {};
        if (startDate) filter.admin_redeem_date.$gte = new Date(startDate);
        if (endDate) filter.admin_redeem_date.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [wallets, total] = await Promise.all([
        Wallet.find(filter)
          .populate({
            path: "user_id",
            select:
              "full_name phone email profile.pan_num profile.bank_name profile.bank_account_num profile.bank_ifsc_code",
          })
          .sort({ admin_redeem_date: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Wallet.countDocuments(filter),
      ]);

      const formatted = wallets.map((wallet) => {
        const user = wallet.user_id;
        return {
          id: wallet._id,
          full_name: user.full_name || "",
          phone: user.phone || "",
          status: wallet.status,

          amount: wallet.amount || 0,
          bank_name: user.profile?.bank_name || "",
          bank_account_num: user.profile?.bank_account_num || "",
          bank_ifsc_code: user.profile?.bank_ifsc_code || "",
          pan_num: user.profile?.pan_num || "",
          redeem_date: wallet.admin_redeem_date,
        };
      });

      res.json({
        data: formatted,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      });
    } catch (err) {
      console.error("❌ Error fetching processing wallets:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  exportProcessingWallets: async (req, res) => {
    try {
      const processingWallets = await Wallet.find({
        status: "processing",
      }).populate({
        path: "user_id",
        select:
          "full_name phone email profile.pan_num profile.bank_name profile.bank_account_num profile.bank_ifsc_code",
      });

      if (!processingWallets || processingWallets.length === 0) {
        return res.status(404).json({ message: "No processing wallets found" });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Processing Wallets");

      worksheet.columns = [
        { header: "Full Name", key: "full_name", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Email", key: "email", width: 25 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Bank Name", key: "bank_name", width: 20 },
        { header: "Account Number", key: "bank_account_num", width: 20 },
        { header: "IFSC Code", key: "bank_ifsc_code", width: 15 },
        { header: "PAN Number", key: "pan_num", width: 20 },
      ];

      for (const wallet of processingWallets) {
        const user = wallet.user_id;
        if (!user || !user.profile) continue;
        worksheet.addRow({
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          amount: wallet.amount,
          bank_name: user.profile.bank_name,
          bank_account_num: user.profile.bank_account_num,
          bank_ifsc_code: user.profile.bank_ifsc_code,
          pan_num: user.profile.pan_num,
        });
      }

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=wallets_processing.xlsx"
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("❌ Error exporting processing wallets:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  approveAllProcessingWallets: async (req, res) => {
    try {
      const result = await Wallet.updateMany(
        { status: "processing" },
        { status: "paid", admin_redeem_date: new Date() }
      );

      res.json({ message: `${result.modifiedCount} wallets marked as paid.` });
    } catch (err) {
      console.error("❌ Error approving wallets:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
export default AdminController;
