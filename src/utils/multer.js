import multer from "multer";
import fs from "fs";
import pathModule from "path";

export const fileStorage = (path = "courses") =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = pathModule.join("public", "uploads", path);

      // Create the folder if it doesn't exist
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = file.originalname.split(".")[1];
      const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueId}.${ext}`);
    },
  });

export const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
