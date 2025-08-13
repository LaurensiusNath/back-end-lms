import express from "express";

const globalRoutes = express.Router();

globalRoutes.get("/", (req, res) => {
  res.json({ text: "Hello world" });
});

export default globalRoutes;
