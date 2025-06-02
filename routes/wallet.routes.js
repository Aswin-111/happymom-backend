import express from "express";
import WalletController from "../controllers/wallet.controller.js";
const router = express.Router();
router.get("/getwallet", WalletController.getWallet);
router.put("/redeem", WalletController.widthdrawAmount);
router.get("/getincentives", WalletController.getIncentives);
export default router;
