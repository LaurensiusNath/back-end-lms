import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import { mutateStudentSchema } from "../utils/schema.js";
import fs from "fs";
import courseModel from "../models/courseModel.js";
import path from "path";
import { log } from "console";

export const getStudents = async (req, res) => {
  try {
    const students = await userModel
      .find({
        role: "student",
        manager: req.user._id,
      })
      .select("name courses photo");

    const photoUrl = process.env.APP_URL + "/uploads/students/";

    const response = students.map((student) => {
      return {
        ...student.toObject(),
        photo_url: photoUrl + student.photo,
      };
    });

    if (!students) {
      return res.status(404).json({
        message: "Students not found",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Get students success",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await userModel.findById(id).select("name email");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Get student success",
      data: student,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const postStudent = async (req, res) => {
  try {
    const { body } = req;

    const parse = mutateStudentSchema.safeParse(body);

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

    const hashPassword = bcrypt.hashSync(body.password, 12);

    const student = new userModel({
      name: body.name,
      email: body.email,
      password: hashPassword,
      photo: req.file?.filename,
      manager: req.user._id,
      role: "student",
    });

    await student.save();

    return res.status(201).json({
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const parse = mutateStudentSchema
      .partial({ password: true })
      .safeParse(body);

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

    const student = await userModel.findById(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        data: null,
      });
    }

    const hashPassword = parse?.data?.password
      ? bcrypt.hashSync(parse.data.password, 12)
      : student.password;

    if (req?.file && student.photo) {
      const oldFilePath = `public/uploads/students/${student.photo}`;
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const updatedStudent = await userModel.findByIdAndUpdate(
      id,
      {
        name: parse.data.name,
        email: parse.data.email,
        password: hashPassword,
        photo: req?.file ? req.file.filename : student.photo,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await userModel.findById(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const course = await courseModel.findOneAndUpdate(
      { students: id },
      {
        $pull: {
          students: id,
        },
      }
    );

    const dirname = path.resolve();

    const filePath = path.join(
      dirname,
      "public/uploads/students",
      student.photo
    );

    if (student.photo && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await student.deleteOne();

    return res.status(200).json({
      message: "Student deleted successfully",
      data: student,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getCourseByStudentId = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).populate({
      path: "courses",
      select: "name category thumbnail",
      populate: {
        path: "category",
        select: "name -_id",
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        data: null,
      });
    }

    const imageUrl = process.env.APP_URL + "/uploads/courses/";

    const response = user?.courses?.map((item) => {
      return {
        ...item.toObject(),
        thumbnail_url: imageUrl + item.thumbnail,
      };
    });

    return res.status(200).json({
      message: "Get course by student id success",
      data: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
