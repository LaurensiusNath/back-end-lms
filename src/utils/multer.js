import multer from "multer";

export const fileStorage = (path = "courses") =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `public/uploads/${path}`);
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
