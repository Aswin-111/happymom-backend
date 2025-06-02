import express from "express";
import ProfileController from "../controllers/profile.controller.js";

const router = express.Router();
router.get("/getprofile", ProfileController.getProfile);
router.put("/updateprofile", ProfileController.updateProfile);
export default router;
