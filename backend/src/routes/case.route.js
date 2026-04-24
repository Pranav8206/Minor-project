import { Router } from "express";

import {
  addCaseSuspect,
  addCaseTimelineEvent,
  createCase,
  deleteCase,
  getCaseRecommendations,
  getSimilarCases,
  getCaseById,
  getCases,
  getCaseTimeline,
  updateCase,
} from "../controllers/case.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

router.route("/").get(protect, getCases).post(protect, upload.array("evidenceFiles", 10), createCase);
router.post("/similar", protect, getSimilarCases);
router.post("/:id/suspects", protect, addCaseSuspect);
router.post("/:id/timeline", protect, addCaseTimelineEvent);
router.get("/:id/timeline", protect, getCaseTimeline);
router.get("/:id/recommendations", protect, getCaseRecommendations);
router
  .route("/:id")
  .get(protect, getCaseById)
  .put(protect, upload.array("evidenceFiles", 10), updateCase)
  .delete(protect, deleteCase);

export default router;