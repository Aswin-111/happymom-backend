import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "superadmin"],
        default: "admin"
    }
})
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Instance method to compare password
adminSchema.methods.comparePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

// 🎟️ Generate JWT Token
adminSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone },
    process.env.JWT_SECRET || "defaultSecret",
    { expiresIn: "30d" }
  );
};
const Admin = mongoose.model("Admin", adminSchema)
export default Admin