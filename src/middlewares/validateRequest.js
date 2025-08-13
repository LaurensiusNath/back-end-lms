import { ZodError } from "zod";

export const validateRequest = (schema) => async (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    console.log("error1 ", error);
    if (error instanceof ZodError) {
      const errMsg = error.issues.map((err) => err.message);
      return res
        .status(500)
        .json({ error: "Invalid Request", details: errMsg });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};
