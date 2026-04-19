import express from "express";
import cors from "cors";
import path from "node:path";

import apiRoutes from "./src/routes/index.js";
import { errorHandler, notFound } from "./src/middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend API is running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
