import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "paid"],
      default: "pending",
    },
    admin_redeem_date: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
