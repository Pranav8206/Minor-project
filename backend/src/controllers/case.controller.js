import mongoose from "mongoose";

import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const sanitizePayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

const parseCasePayload = (body, { partial = false } = {}) => {
  const payload = {
    title: body.title,
    description: body.description,
    location: body.location,
    date: body.date,
    crime_type: body.crime_type,
    status: body.status,
    assigned_officer: body.assigned_officer === "" ? null : body.assigned_officer,
    suspects: body.suspects,
    evidence: body.evidence,
    embedding: body.embedding,
    entities: body.entities,
  };

  return partial ? sanitizePayload(payload) : payload;
};

export const createCase = asyncHandler(async (req, res) => {
  const caseData = parseCasePayload(req.body);
  const createdCase = await Case.create(caseData);

  return res.status(201).json({
    message: "Case created successfully",
    case: createdCase,
  });
});

export const getCases = asyncHandler(async (req, res) => {
  const cases = await Case.find().sort({ createdAt: -1 });

  return res.status(200).json({
    count: cases.length,
    cases,
  });
});

export const getCaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  const caseItem = await Case.findById(id);

  if (!caseItem) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  return res.status(200).json({
    case: caseItem,
  });
});

export const updateCase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  const updateData = parseCasePayload(req.body, { partial: true });

  const updatedCase = await Case.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedCase) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  return res.status(200).json({
    message: "Case updated successfully",
    case: updatedCase,
  });
});

export const deleteCase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  const deletedCase = await Case.findByIdAndDelete(id);

  if (!deletedCase) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  return res.status(200).json({
    message: "Case deleted successfully",
  });
});