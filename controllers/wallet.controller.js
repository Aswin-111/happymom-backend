import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";

const WalletController = {
  getWallet: async (req, res) => {
    try {
      const user_id = req.user.id;
      const wallet = await User.findById(user_id);

      const wallet_balance = wallet.wallet_balance;
      res.json({ wallet_balance });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  widthdrawAmount: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { amount } = req.body;

      console.log(amount, user_id);
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.status !== "active") {
        return res.status(400).json({ message: "Please purchase the course" });
      }
      const { full_name, phone, email } = user;
      const {
        bank_name,
        bank_account_num,
        bank_ifsc_code,
        dob,
        address,
        pin_code,
        district,
        area,
        state,
        country,
        aadhar_num,
        pan_num,
      } = user.profile;

      if (
        !full_name ||
        !phone ||
        !email ||
        !bank_name ||
        !bank_account_num ||
        !bank_ifsc_code ||
        !dob ||
        !address ||
        !pin_code ||
        !district ||
        !area ||
        !state ||
        !country ||
        !aadhar_num ||
        !pan_num
      ) {
        return res
          .status(400)
          .json({ message: "Please complete your profile" });
      }
      const find_wallet = await Wallet.findById(user_id);
      if (amount > user.wallet_balance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      user.wallet_balance -= amount;

      if (find_wallet) {
        find_wallet.amount += amount;
        await find_wallet.save();
      } else {
        await Wallet.create({
          amount,
          user_id,
        });
      }
      await user.save();

      res.status(200).json({ message: "Amount withdrawed successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // controllers/wallet.controller.js

  getIncentives: async (req, res) => {
    try {
      const user_id = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const user = await User.findById(user_id)
        .select("incentive_desc")
        .populate("incentive_desc.user", "full_name");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const incentives = user.incentive_desc
        .sort((a, b) => b.date - a.date) // Sort latest first
        .slice(skip, skip + limit);

      res.json({
        incentives,
        page,
        totalPages: Math.ceil(user.incentive_desc.length / limit),
        hasMore: skip + incentives.length < user.incentive_desc.length,
      });
    } catch (error) {
      console.error("Error fetching incentives:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default WalletController;
