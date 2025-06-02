import express from "express";
import UserController from "../controllers/user.controller.js";

const router = express.Router();

router.get("/fetchreferral/:id", UserController.fetchReferralLink);
router.get("/dashboard/user", UserController.dashboardData);
router.get("/getreferrallink", UserController.getReferralLink);
// referrals
// frontend link GET /dashboard/referrals?page=2&limit=10

router.get("/dashboard/referrals", UserController.getReferrals);

router.put("/dashboard/reset-password", UserController.resetPassword);
export default router;
