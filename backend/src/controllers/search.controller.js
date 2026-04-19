import mongoose from "mongoose";

import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { searchSimilarCases } from "../utils/pythonAiClient.js";

const normalizeSimilarCaseIds = (payload) => {
  const candidateIds =
    payload?.similar_case_ids || payload?.caseIds || payload?.ids || [];

  if (!Array.isArray(candidateIds)) {
    return [];
  }

  return candidateIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildFilter = ({ location, crime_type, ids }) => {
  const filter = {
    _id: { $in: ids },
  };

  if (typeof location === "string" && location.trim()) {
    filter.location = new RegExp(`^${escapeRegExp(location.trim())}$`, "i");
  }

  if (typeof crime_type === "string" && crime_type.trim()) {
    filter.crime_type = new RegExp(`^${escapeRegExp(crime_type.trim())}$`, "i");
  }

  return filter;
};

const orderCasesById = (cases, ids) => {
  const caseMap = new Map(cases.map((caseItem) => [caseItem._id.toString(), caseItem]));

  return ids.map((id) => caseMap.get(id)).filter(Boolean);
};

export const searchCases = asyncHandler(async (req, res) => {
  const { query, location, crime_type } = req.body;
  const normalizedLocation = typeof location === "string" ? location.trim() : undefined;
  const normalizedCrimeType = typeof crime_type === "string" ? crime_type.trim() : undefined;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      message: "query is required",
    });
  }

  const aiResult = await searchSimilarCases({
    query: query.trim(),
    location: normalizedLocation,
    crime_type: normalizedCrimeType,
  });

  const similarCaseIds = normalizeSimilarCaseIds(aiResult).slice(0, 5);

  if (!similarCaseIds.length) {
    return res.status(200).json({
      count: 0,
      cases: [],
      similarCaseIds: [],
    });
  }

  const cases = await Case.find(
    buildFilter({ location: normalizedLocation, crime_type: normalizedCrimeType, ids: similarCaseIds })
  );
  const orderedCases = orderCasesById(cases, similarCaseIds).slice(0, 5);

  return res.status(200).json({
    count: orderedCases.length,
    similarCaseIds,
    cases: orderedCases,
  });
});