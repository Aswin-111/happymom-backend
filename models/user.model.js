// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    referred_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // parent user
    referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users referred
    wallet_balance: { type: Number, default: 0 },
    profile: {
      bank_name: String,
      bank_account_num: String,
      bank_ifsc_code: String,
      dob: String,
      address: String,
      pin_code: String,
      district: String,
      area: String,
      state: String,
      country: String,
      aadhar_num: String,
      pan_num: String,
    },
    reg_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    incentive_desc: [
      {
        amount: {
          type: Number,
          default: 0,
        },
        desc: String,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    profile_status: {
      type: String,
      enum: ["pending", "active"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["active", "pending", "blocked"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    credit_points: [
      {
        amount: {
          type: Number,
          default: 0,
        },
        desc: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    designation: {
      type: String,
      enum: ["user", "promoter", "silver", "platinum", "emerald", "ruby", "diamond"],
      default: "user",
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Instance method to compare password
userSchema.methods.comparePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

// 🎟️ Generate JWT Token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.JWT_SECRET || "defaultSecret",
    { expiresIn: "30" }
  );
};
const User = mongoose.model("User", userSchema);
export default User;
