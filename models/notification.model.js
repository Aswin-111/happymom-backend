import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    event_name: { type: String, required: true },
    event_date: { type: Date, required: true },
    event_image: { type: String }, // store filename
    event_description: { type: String, required: true },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
