import express from "express";
import multer from "multer";

import AdminController from "../controllers/admin.controller.js";
import upload from "../middlewares/upload.js";
import courseUpload from "../middlewares/course.middleware.js";
import CourseController from "../controllers/course.controller.js";
const router = express.Router();
const uploadxlsx = multer({ dest: "uploads/xlsx" });
router.get("/dashusers", AdminController.getDashUsers);
router.get("/reset-password", AdminController.resetPassword);
router.get("/userdashboard", AdminController.getDashboardaData);
router.get("/getedituser", AdminController.getEditUser);
router.put("/edituser", AdminController.editUserData);
router.get("/getuserwallet", AdminController.getUserWallet);
router.post("/add-incentives", AdminController.addIncentives);
router.post("/add-credit-points", AdminController.addCreditPoints);
router.put("/update-credit-points", AdminController.updateCreditPoints);
router.get("/test", (req, res) => {
  res.send("test endpoint");
});

router.post(
  "/send-notification",
  upload.single("event_image"),
  AdminController.sendNotifications
);
router.get("/get-notifications", AdminController.getNotifications);
router.post("/delete-notification", AdminController.deleteNotification);

router.get("/courses", CourseController.getCourses); // Get all

router.post(
  "/course",
  courseUpload.single("course_image"),
  CourseController.createCourse
);
router.put(
  "/course",
  courseUpload.single("course_image"),
  CourseController.editCourse
);
router.delete("/course", CourseController.deleteCourse);
router.get("/geteditcourse", CourseController.getEditCourse);
router.post(
  "/authorizeusers",
  uploadxlsx.single("file"),
  AdminController.authorizeUsers
);
// Download pending wallet records as XLSX and mark them as processing
// full_name , bank details , pan card, amount ,bank_name, bank_account_num, bank_ifsc_code

router.get("/exportwallet", AdminController.exportPendingWallets);
router.get("/getprocessingwallets", AdminController.getProcessingWallets);
router.get("/exportprocessingwallets", AdminController.exportProcessingWallets);
router.put("/approveallwallets", AdminController.approveAllProcessingWallets);

export default router;
