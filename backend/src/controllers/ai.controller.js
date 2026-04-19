import mongoose from "mongoose";

import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { analyzeCaseDescription } from "../utils/pythonAiClient.js";

export const analyzeCase = asyncHandler(async (req, res) => {
  const { caseId, description } = req.body;

  if (!caseId) {
    return res.status(400).json({
      message: "caseId is required",
    });
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({
      message: "description is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(caseId)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  const aiResult = await analyzeCaseDescription(description.trim());
  const embedding = Array.isArray(aiResult.embedding) ? aiResult.embedding : [];
  const entities = Array.isArray(aiResult.entities) ? aiResult.entities : [];

  const updatedCase = await Case.findByIdAndUpdate(
    caseId,
    {
      embedding,
      entities,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCase) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  return res.status(200).json({
    message: "Case analyzed successfully",
    embedding,
    entities,
    case: updatedCase,
  });
});