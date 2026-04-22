import { Router } from "express";

import { getSuspectById } from "../controllers/suspect.controller.js";

const router = Router();

router.get("/:id", getSuspectById);

export default router;
