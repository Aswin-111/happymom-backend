import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import moment from "moment";
const WalletController = {
  // getWallet: async (req, res) => {
  //   try {
  //     const user_id = req.user.id;
  //     const wallet = await User.findById(user_id);

  //     const wallet_balance = wallet.wallet_balance;
  //     res.json({ wallet_balance });
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // },
  getWallet: async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get user with populated incentive_desc.user
    const user = await User.findById(user_id).populate("incentive_desc.user");
   
    if (!user) return res.status(404).json({ message: "User not found" });

    // Sum only incentives linked to active users
    const totalIncentives = user.incentive_desc
      .filter((incentive) => incentive.user?.status === "active")
      .reduce((acc, curr) => acc + curr.amount, 0);

    return res.json({
      wallet_balance: user.wallet_balance,
      withdrawable_amount: totalIncentives,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
  },

withdrawAmount: async (req, res) => {
  try {
    const user_id = req.user.id;
    const { amount } = req.body;
    const today = moment().format('dddd'); // returns "Monday", "Tuesday", etc.

if (today !== 'Thursday') {
  return res.status(400).json({ message: "Withdrawals only allowed on Thursday" });
}
    const user = await User.findById(user_id).populate("incentive_desc.user");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status !== "active") return res.status(400).json({ message: "Please purchase the course" });

    // ✅ Check for complete profile
    const requiredFields = [
      "full_name", "phone", "email", "bank_name", "bank_account_num",
      "bank_ifsc_code", "dob", "address", "pin_code", "district",
      "area", "state", "country", "aadhar_num", "pan_num"
    ];
    for (const field of requiredFields) {
      const value = field in user.profile ? user.profile[field] : user[field];
      if (!value) {
        return res.status(400).json({ message: "Please complete your profile" });
      }
    }

    // ✅ Get eligible incentives
    const availableIncentives = user.incentive_desc.filter(
      (incentive) => incentive.user?.status === "active" && !incentive.used
    );

    const totalAvailable = availableIncentives.reduce((sum, i) => sum + i.amount, 0);
    if (amount > totalAvailable) {
      return res.status(400).json({ message: "Insufficient incentive balance" });
    }

    // ✅ Deduct amount from incentives
    let remaining = amount;
    for (let incentive of availableIncentives) {
      if (remaining <= 0) break;

      if (incentive.amount <= remaining) {
        remaining -= incentive.amount;
        incentive.used = true;
      } else {
        // Partially consume incentive
        user.incentive_desc.push({
          amount: incentive.amount - remaining,
          desc: incentive.desc,
          user: incentive.user._id,
          date: new Date(),
          used: false,
        });

        incentive.amount = remaining;
        incentive.used = true;
        remaining = 0;
      }
    }

    // ✅ Store in Wallet collection
    const existingWallet = await Wallet.findOne({ user_id });
    if (existingWallet) {
      existingWallet.amount += amount;
      await existingWallet.save();
    } else {
      await Wallet.create({ user_id, amount });
    }

    await user.save();

    return res.status(200).json({ message: "Amount withdrawn successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
,

  // controllers/wallet.controller.js

  getIncentives: async (req, res) => {
    try {
      const user_id = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const user = await User.findById(user_id)
        .select("incentive_desc")
        .populate("incentive_desc.user", "full_name status");
        // console.log(user, 'user')
        
        
       user.incentive_desc.forEach((i)=>{
        console.log(i, 'incentive_desc')
       })
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
