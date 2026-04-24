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

const caseUploadFields = upload.fields([
  { name: "evidenceFiles", maxCount: 10 },
  { name: "suspectImageFiles", maxCount: 20 },
  { name: "timelineImageFiles", maxCount: 20 },
]);

router.route("/").get(protect, getCases).post(protect, caseUploadFields, createCase);
router.post("/similar", protect, getSimilarCases);
router.post("/:id/suspects", protect, upload.single("suspectImageFile"), addCaseSuspect);
router.post("/:id/timeline", protect, upload.single("timelineImageFile"), addCaseTimelineEvent);
router.get("/:id/timeline", protect, getCaseTimeline);
router.get("/:id/recommendations", protect, getCaseRecommendations);
router
  .route("/:id")
  .get(protect, getCaseById)
  .put(protect, caseUploadFields, updateCase)
  .delete(protect, deleteCase);

export default router;