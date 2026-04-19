import { Router } from "express";

import { uploadEvidence } from "../controllers/evidence.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

router.post("/upload", upload.single("file"), uploadEvidence);

export default router;