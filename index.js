import express from "express";
import path from "path";
import cors from "cors";
import "dotenv/config";
import connectDB from "./db/index.js";
import userMiddleware from "./middlewares/user.middleware.js";
import adminMiddleware from "./middlewares/admin.middleware.js";
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import courseRoutes from "./routes/course.routes.js";

import profileRoutes from "./routes/profile.routes.js";
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// auth routes
app.use("/auth", authRoutes);
// user routes

app.use("/user", userMiddleware, userRoutes);
// wallet routes
app.use("/wallet", userMiddleware, walletRoutes);

// admin routes
app.use("/admin", adminMiddleware, adminRoutes);

// course routes
app.use("/course", userMiddleware, courseRoutes);
// profile routes
app.use("/profile", userMiddleware, profileRoutes);
// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
  connectDB().catch((err) => console.log(err));
});
