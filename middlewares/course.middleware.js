import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload folder if not exists
const courseUploadPath = "uploads/courses";
if (!fs.existsSync(courseUploadPath)) {
  fs.mkdirSync(courseUploadPath, { recursive: true });
}

const courseStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, courseUploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const courseFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image type"), false);
  }
};

const courseUpload = multer({ storage: courseStorage, fileFilter: courseFileFilter });

export default courseUpload;
