import mongoose from "mongoose";
import fs from "node:fs/promises";

import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadEvidenceFileToCloudinary } from "../utils/cloudinary.js";

export const uploadEvidence = asyncHandler(async (req, res) => {
  const { caseId } = req.body;

  if (!caseId) {
    return res.status(400).json({
      message: "caseId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(caseId)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Evidence file is required",
    });
  }

  let evidenceItem;

  try {
    evidenceItem = await uploadEvidenceFileToCloudinary(req.file.path, req.file.mimetype);
  } finally {
    await fs.unlink(req.file.path).catch(() => undefined);
  }

  const updatedCase = await Case.findByIdAndUpdate(
    caseId,
    {
      $push: {
        evidence: evidenceItem,
      },
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

  return res.status(201).json({
    message: "Evidence uploaded successfully",
    fileUrl: evidenceItem.url,
    evidence: evidenceItem,
    case: updatedCase,
  });
});