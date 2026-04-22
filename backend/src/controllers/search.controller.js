import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { searchSimilarCases } from "../utils/pythonAiClient.js";

const normalizeSimilarMatches = (payload, casePoolLength) => {
  const matches = Array.isArray(payload?.matches) ? payload.matches : [];

  return matches
    .map((match) => {
      if (!match || typeof match !== "object") {
        return null;
      }

      const index = Number(match.index);
      const similarity = Number(match.similarity);

      if (!Number.isInteger(index) || index < 0 || index >= casePoolLength) {
        return null;
      }

      if (!Number.isFinite(similarity)) {
        return null;
      }

      return { index, similarity };
    })
    .filter(Boolean);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildFilter = ({ location, crime_type, ids }) => {
  const filter = {};

  if (Array.isArray(ids)) {
    filter._id = { $in: ids };
  }

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

  const candidateCases = await Case.find(
    buildFilter({
      location: normalizedLocation,
      crime_type: normalizedCrimeType,
    })
  ).lean();

  const casesWithEmbeddings = candidateCases.filter(
    (caseItem) => Array.isArray(caseItem.embedding) && caseItem.embedding.length > 0
  );

  if (!casesWithEmbeddings.length) {
    return res.status(200).json({
      count: 0,
      cases: [],
      similarCaseIds: [],
    });
  }

  const aiResult = await searchSimilarCases({
    query: query.trim(),
    stored_embeddings: casesWithEmbeddings.map((caseItem) => caseItem.embedding),
  });

  const matches = normalizeSimilarMatches(aiResult, casesWithEmbeddings.length).slice(0, 5);
  const similarCaseIds = matches.map((match) => casesWithEmbeddings[match.index]._id.toString());

  if (!similarCaseIds.length) {
    return res.status(200).json({
      count: 0,
      cases: [],
      similarCaseIds: [],
    });
  }

  const cases = await Case.find({ _id: { $in: similarCaseIds } });
  const orderedCases = orderCasesById(cases, similarCaseIds).slice(0, 5);

  return res.status(200).json({
    count: orderedCases.length,
    similarCaseIds,
    cases: orderedCases,
  });
});