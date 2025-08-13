import express from "express";
import {
  deleteContentCourse,
  deleteCourse,
  deleteStudentFromCourse,
  getCategories,
  getCourseById,
  getCourses,
  getDetailContent,
  getStudentsByCourseId,
  postContentCourse,
  postCourse,
  postStudentToCourse,
  updateContentCourse,
  updateCourse,
} from "../controllers/courseController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";
import { fileFilter, fileStorage } from "../utils/multer.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  addStudentToCourseSchema,
  mutateContentSchema,
} from "../utils/schema.js";

const courseRoutes = express.Router();

const upload = multer({
  storage: fileStorage("courses"),
  fileFilter: fileFilter,
});

courseRoutes.get("/courses", verifyToken, getCourses);
courseRoutes.get("/courses/:id", verifyToken, getCourseById);
courseRoutes.get("/categories", verifyToken, getCategories);
courseRoutes.post(
  "/courses",
  verifyToken,
  upload.single("thumbnail"),
  postCourse
);
courseRoutes.put(
  "/courses/:id",
  verifyToken,
  upload.single("thumbnail"),
  updateCourse
);
courseRoutes.delete("/courses/:id", verifyToken, deleteCourse);

courseRoutes.get("/courses/contents/:id", verifyToken, getDetailContent);

courseRoutes.post(
  `/courses/contents`,
  verifyToken,
  validateRequest(mutateContentSchema),
  postContentCourse
);
courseRoutes.put(
  `/courses/contents/:id`,
  verifyToken,
  validateRequest(mutateContentSchema),
  updateContentCourse
);
courseRoutes.delete(`/courses/contents/:id`, verifyToken, deleteContentCourse);

courseRoutes.get("/courses/students/:id", verifyToken, getStudentsByCourseId);
courseRoutes.post(
  "/courses/students/:id",
  verifyToken,
  validateRequest(addStudentToCourseSchema),
  postStudentToCourse
);

courseRoutes.put(
  "/courses/students/:id",
  verifyToken,
  validateRequest(addStudentToCourseSchema),
  deleteStudentFromCourse
);

export default courseRoutes;
