import { Router } from "express";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
