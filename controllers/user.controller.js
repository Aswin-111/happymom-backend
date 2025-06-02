import User from "../models/user.model.js";

const UserController = {
  fetchReferralLink: async (req, res) => {
    try {
      const user_id = req.user.id;
      const generated_referral_link = `https://localhost:5000/?referral_id=${user_id}`;
      res.json({ referral_link: generated_referral_link });
    } catch (error) {
      console.error("Error fetching referral ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getReferralLink: async (req, res) => {
    try {
      const user_id = req.user.id;
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const referral_link = `${process.env.REFERRAL_URL}/signup/?referral_id=${user_id}`;
      res.json({ referral_link });
    } catch (error) {
      console.error("Error fetching referral link:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  fetchReferralData: async (req, res) => {
    try {
      const refer_id = req.params.id;
      const user = await User.findById(refer_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ referral_data: user });
    } catch (error) {
      console.error("Error fetching referral data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  dashboardData: async (req, res) => {
    try {
      const user_id = req.user.id;
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const dashboardData = {
        phone: user.phone,
        name: user.full_name,
        designation: user.designation,
      };
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getReferrals: async (req, res) => {
    try {
      const user_id = req.user.id;

      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 🧮 Get pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // 🎯 Get total count for frontend
      const total = await User.countDocuments({ referred_by: user_id });

      // 📦 Get paginated referrals
      const referrals = await User.find({ referred_by: user_id })
        .skip(skip)
        .limit(limit)
        .select("full_name email phone createdAt"); // select only what’s needed

      res.json({
        referrals,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + referrals.length < total,
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { password } = req.body;
      const user = await User.findById(user_id);
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
};

export default UserController;
