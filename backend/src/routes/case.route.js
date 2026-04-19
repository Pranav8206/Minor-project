import { Router } from "express";

import {
  createCase,
  deleteCase,
  getCaseById,
  getCases,
  updateCase,
} from "../controllers/case.controller.js";

const router = Router();

router.route("/").post(createCase).get(getCases);
router.route("/:id").get(getCaseById).put(updateCase).delete(deleteCase);

export default router;