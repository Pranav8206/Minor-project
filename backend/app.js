import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const defaultCorsOrigin = "http://localhost:3000";
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [defaultCorsOrigin];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

app.use(express.static("public"));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome to the Booking System API");
});

export { app };