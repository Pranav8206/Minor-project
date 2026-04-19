import { Router } from "express";

import { searchCases } from "../controllers/search.controller.js";

const router = Router();

router.post("/", searchCases);

export default router;