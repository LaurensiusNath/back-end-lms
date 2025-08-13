import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  deleteStudent,
  getCourseByStudentId,
  getStudentDetail,
  getStudents,
  postStudent,
  updateStudent,
} from "../controllers/studentController.js";
import multer from "multer";
import { fileFilter, fileStorage } from "../utils/multer.js";

const studentRoutes = express.Router();

const upload = multer({
  storage: fileStorage("students"),
  fileFilter: fileFilter,
});

studentRoutes.get("/students", verifyToken, getStudents);
studentRoutes.get("/students/courses", verifyToken, getCourseByStudentId);

studentRoutes.get("/students/:id", verifyToken, getStudentDetail);
studentRoutes.post(
  "/students",
  verifyToken,
  upload.single("photo"),
  postStudent
);

studentRoutes.put(
  "/students/:id",
  verifyToken,
  upload.single("photo"),
  updateStudent
);

studentRoutes.delete("/students/:id", verifyToken, deleteStudent);

export default studentRoutes;
