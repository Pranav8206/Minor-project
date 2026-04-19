import mongoose from "mongoose";

import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const uploadEvidence = asyncHandler(async (req, res) => {
  const { caseId, description, reference } = req.body;

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

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/evidence/${req.file.filename}`;
  const evidenceItem = {
    type: req.file.mimetype === "application/pdf" ? "pdf" : "image",
    description: description || req.file.originalname,
    reference: reference || fileUrl,
    file_name: req.file.filename,
    file_url: fileUrl,
    mime_type: req.file.mimetype,
    file_size: req.file.size,
    collected_at: new Date(),
  };

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
    fileUrl,
    evidence: evidenceItem,
    case: updatedCase,
  });
});