import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Health check successful",
    timestamp: new Date().toISOString(),
  });
});

export default router;
