import path from "path";
import categoryModel from "../models/categoryModel.js";
import courseModel from "../models/courseModel.js";
import userModel from "../models/userModel.js";
import { mutateCourseSchema } from "../utils/schema.js";
import fs from "fs";
import courseDetailModel from "../models/courseDetailModel.js";

export const getCourses = async (req, res) => {
  try {
    const courses = await courseModel
      .find({
        manager: req.user?._id,
      })
      .select("name thumbnail")
      .populate({
        path: "category",
        select: "name -_id",
      })
      .populate({
        path: "students",
        select: "name",
      });

    const imageUrl = process.env.APP_URL + "/uploads/courses/";

    const response = courses.map((item) => {
      return {
        ...item.toObject(),
        thumbnail_url: `${imageUrl}${item.thumbnail}`,
        total_students: item.students.length,
      };
    });

    return res.json({
      message: "Get courses success",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find();

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        message: "No categories found",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { preview } = req.query;
    const course = await courseModel
      .findById(req.params.id)
      .populate({
        path: "category",
        select: "name -_id",
      })
      .populate({
        path: "details",
        select: preview === "true" ? "title type youtubeId text" : "title type",
      });

    const imageUrl = process.env.APP_URL + "/uploads/courses/";

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        data: null,
      });
    }
    return res.json({
      message: "Get course by ID success",
      data: {
        ...course.toObject(),
        thumbnail_url: `${imageUrl}${course.thumbnail}`,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const postCourse = async (req, res) => {
  try {
    const { body } = req;

    const parse = mutateCourseSchema.safeParse(body);

    if (!parse.success) {
      const errorMessage = parse.error.issues.map((err) => err.message);

      if (req?.file?.path && fs.existsSync(req?.file?.path)) {
        fs.unlinkSync(req?.file?.path);
      }

      return res.status(500).json({
        message: "Validation Error",
        data: null,
        errors: errorMessage,
      });
    }

    const category = await categoryModel.findById(parse.data.categoryId);

    if (!category) {
      return res.status(404).json({
        message: "Category Not Found",
        data: null,
      });
    }

    const course = new courseModel({
      name: parse.data.name,
      category: category._id,
      description: parse.data.description,
      tagline: parse.data.tagline,
      thumbnail: req.file?.filename,
      manager: req.user?._id,
    });

    await course.save();

    await categoryModel.findByIdAndUpdate(
      category._id,
      {
        $push: {
          courses: course._id,
        },
      },
      { new: true }
    );

    await userModel.findByIdAndUpdate(
      req.user?._id,
      {
        $push: {
          courses: course._id,
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Course Created Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { body } = req;

    const courseId = req.params.id;

    const parse = mutateCourseSchema.safeParse(body);

    if (!parse.success) {
      const errorMessage = parse.error.issues.map((err) => err.message);

      if (req?.file?.path && fs.existsSync(req?.file?.path)) {
        fs.unlinkSync(req?.file?.path);
      }

      return res.status(500).json({
        message: "Validation Error",
        data: null,
        errors: errorMessage,
      });
    }

    const category = await categoryModel.findById(parse.data.categoryId);
    const oldCourse = await courseModel.findById(courseId);

    if (!category) {
      return res.status(404).json({
        message: "Category Not Found",
        data: null,
      });
    }

    if (req?.file && oldCourse.thumbnail) {
      const oldFilePath = `public/uploads/courses/${oldCourse.thumbnail}`;
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    await courseModel.findByIdAndUpdate(courseId, {
      name: parse.data.name,
      category: category._id,
      description: parse.data.description,
      tagline: parse.data.tagline,
      thumbnail: req?.file ? req.file?.filename : oldCourse.thumbnail,
      manager: req.user?._id,
    });

    res.status(200).json({
      message: "Course Updated Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseModel.findById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const dirname = path.resolve();

    const filePath = path.join(
      dirname,
      "public/uploads/courses",
      course.thumbnail
    );

    if (course.thumbnail && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await courseModel.findByIdAndDelete(id);

    res.json({
      message: "Course deleted successfully",
      data: course,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const postContentCourse = async (req, res) => {
  try {
    const body = req.body;

    const course = await courseModel.findById(body.courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const content = new courseDetailModel({
      title: body.title,
      type: body.type,
      course: course._id,
      text: body.text,
      youtubeId: body.youtubeId,
    });

    await content.save();

    await courseModel.findByIdAndUpdate(
      course._id,
      {
        $push: {
          details: content._id,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Content created successfully",
      data: content,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateContentCourse = async (req, res) => {
  try {
    const body = req.body;
    const { id } = req.params;

    const course = await courseModel.findById(body.courseId);

    const content = await courseDetailModel.findByIdAndUpdate(
      id,
      {
        title: body.title,
        type: body.type,
        text: body.text,
        course: course._id,
        youtubeId: body.youtubeId,
      },
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "Content updated successfully",
      data: content,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteContentCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await courseDetailModel.findByIdAndDelete(id);
    if (!content) {
      return res.status(404).json({
        message: "Content not found",
      });
    }

    return res.status(200).json({
      message: "Content deleted successfully",
      data: content,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getDetailContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await courseDetailModel.findById(id);

    if (!content) {
      return res.status(404).json({
        message: "Content not found",
      });
    }

    return res.status(200).json({
      message: "Content fetched successfully",
      data: content,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getStudentsByCourseId = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseModel.findById(id).select("name").populate({
      path: "students",
      select: "name email photo",
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const photoUrl = process.env.APP_URL + "/uploads/students/";

    const students = course?.students.map((item) => {
      return {
        ...item.toObject(),
        photo_url: photoUrl + item.photo,
      };
    });

    return res.status(200).json({
      message: "Get students by course id success",
      data: {
        ...course.toObject(),
        students,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const postStudentToCourse = async (req, res) => {
  try {
    const body = req.body;
    const { id } = req.params;

    const student = await userModel.findById(body.studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const course = await courseModel.findById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    if (student.courses.includes(id)) {
      return res
        .status(400)
        .json({ message: "Student already enrolled in this course" });
    }

    await student.updateOne({ $push: { courses: id } });

    await course.updateOne({ $push: { students: body.studentId } });

    return res.status(200).json({
      message: "Student added to course successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteStudentFromCourse = async (req, res) => {
  try {
    const body = req.body;
    const { id } = req.params;

    const student = await userModel.findById(body.studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const course = await courseModel.findById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    await student.updateOne({ $pull: { courses: id } });

    await course.updateOne({ $pull: { students: body.studentId } });

    return res.status(200).json({
      message: "Student removed from course successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
