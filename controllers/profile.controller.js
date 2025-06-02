import User from "../models/user.model.js";
import profileSchema from "../validators/profile.validator.js";
const ProfileController = {
  getProfile: async (req, res) => {
    try {
      const user_id = req.user.id;
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { full_name, phone, email } = req.body;

      const {
        bank_name,
        bank_account_num,
        bank_ifsc_code,
        dob,
        address,
        pin_code,
        country,
        district,
        state,
        area,
        aadhar_num,
        pan_num,
      } = req.body.profile;
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.full_name = full_name || user.full_name;
      user.phone = phone || user.phone;
      user.email = email || user.email;
      user.profile.bank_name = bank_name || user.bank_name;
      user.profile.bank_account_num = bank_account_num || user.bank_account_num;
      user.profile.bank_ifsc_code = bank_ifsc_code || user.bank_ifsc_code;
      user.profile.dob = dob || user.dob;
      user.profile.address = address || user.address;
      user.profile.pin_code = pin_code || user.pin_code;
      user.profile.country = country || user.country;
      user.profile.district = district || user.district;
      user.profile.state = state || user.state;
      user.profile.area = area || user.area;
      user.profile.aadhar_num = aadhar_num || user.aadhar_num;
      user.profile.pan_num = pan_num || user.pan_num;
      await user.save();
      console.log(user);
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default ProfileController;
