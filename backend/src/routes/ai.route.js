import { Router } from "express";

import { analyzeCase } from "../controllers/ai.controller.js";

const router = Router();

router.post("/analyze", analyzeCase);

export default router;