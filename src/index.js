import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import globalRoutes from "./routes/globalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./utils/database.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import overviewRoutes from "./routes/overviewRoutes.js";

const app = express();

dotenv.config();

connectDB();

const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({ text: "Hello world" });
});

app.use("/api", globalRoutes);
app.use("/api", authRoutes);
app.use("/api", paymentRoutes);
app.use("/api", courseRoutes);
app.use("/api", studentRoutes);
app.use("/api", overviewRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
