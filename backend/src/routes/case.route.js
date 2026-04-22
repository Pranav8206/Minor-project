import { Router } from "express";

import {
  createCase,
  deleteCase,
  getCaseById,
  getCases,
  getCaseTimeline,
  updateCase,
} from "../controllers/case.controller.js";

const router = Router();

router.route("/").post(createCase).get(getCases);
router.get("/:id/timeline", getCaseTimeline);
router.route("/:id").get(getCaseById).put(updateCase).delete(deleteCase);

export default router;