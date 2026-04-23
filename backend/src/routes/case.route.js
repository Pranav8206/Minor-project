import { Router } from "express";

import {
  createCase,
  deleteCase,
  getCaseRecommendations,
  getSimilarCases,
  getCaseById,
  getCases,
  getCaseTimeline,
  updateCase,
} from "../controllers/case.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

router.route("/").post(upload.array("evidenceFiles", 10), createCase).get(getCases);
router.post("/similar", getSimilarCases);
router.get("/:id/timeline", getCaseTimeline);
router.get("/:id/recommendations", getCaseRecommendations);
router.route("/:id").get(getCaseById).put(updateCase).delete(deleteCase);

export default router;