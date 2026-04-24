import mongoose from "mongoose";

import Case from "../models/case.model.js";
import Suspect from "../models/suspect.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import calculateRiskScore from "../utils/riskScore.js";

export const getSuspectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid suspect id",
    });
  }

  const suspect = await Suspect.findById(id);

  if (!suspect) {
    return res.status(404).json({
      message: "Suspect not found",
    });
  }

  const linkedCases = await Case.find({
    _id: { $in: suspect.linked_cases || [] },
  }).select("title description location date crime_type status priority tags case_summary");

  const riskScore = calculateRiskScore(linkedCases.length);

  if (suspect.risk_score !== riskScore) {
    suspect.risk_score = riskScore;
    await suspect.save();
  }

  return res.status(200).json({
    suspect: {
      _id: suspect._id,
      name: suspect.name,
      image_url: suspect.image_url,
      risk_score: riskScore,
      linked_cases_count: linkedCases.length,
      linked_cases: linkedCases,
      createdAt: suspect.createdAt,
      updatedAt: suspect.updatedAt,
    },
  });
});
