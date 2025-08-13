import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
  const secretKey = process.env.SECRET_KEY ?? "";

  if (req?.headers?.authorization?.split(" ")[0] === "JWT") {
    try {
      const decoded = jwt.verify(
        req?.headers?.authorization?.split(" ")[1],
        secretKey
      );

      const user = await userModel.findById(
        decoded.data.id,
        "_id name email role"
      );

      if (!user) {
        return res.status(400).json({
          message: "Token Expired",
        });
      }

      req.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
      next();
    } catch (error) {
      if (error.message === "jwt expired") {
        return res.status(400).json({
          message: "Token Expired",
        });
      } else {
        return res.status(400).json({
          message: "Unauthorized",
        });
      }
    }
  } else {
    return res.status(400).json({
      message: "Unauthorized",
    });
  }
};
