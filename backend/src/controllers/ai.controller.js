import mongoose from "mongoose";

import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { analyzeCaseDescription } from "../utils/pythonAiClient.js";

const mapAiEntitiesToCaseEntities = (entitiesPayload) => {
  if (!entitiesPayload || typeof entitiesPayload !== "object") {
    return [];
  }

  const categories = [
    { key: "persons", label: "PERSON", type: "person" },
    { key: "locations", label: "LOCATION", type: "location" },
    { key: "weapons", label: "WEAPON", type: "weapon" },
  ];

  return categories.flatMap((category) => {
    const values = Array.isArray(entitiesPayload[category.key])
      ? entitiesPayload[category.key]
      : [];

    return values
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => ({
        label: category.label,
        value: value.trim(),
        type: category.type,
      }));
  });
};

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
  const entities = mapAiEntitiesToCaseEntities(aiResult.entities);

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