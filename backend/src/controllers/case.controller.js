import mongoose from "mongoose";
import fs from "node:fs/promises";

import Case from "../models/case.model.js";
import Suspect from "../models/suspect.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { analyzeCaseDescription, searchSimilarCases } from "../utils/pythonAiClient.js";
import calculateRiskScore from "../utils/riskScore.js";
import { uploadEvidenceFileToCloudinary } from "../utils/cloudinary.js";

const sanitizePayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

const normalizeTags = (value) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
};

const normalizeEmbedding = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

const parseJsonArrayField = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const normalizeEvidence = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const url = typeof item.url === "string" ? item.url.trim() : "";
      const type = typeof item.type === "string" ? item.type.trim().toLowerCase() : "";

      if (!url || !["image", "pdf"].includes(type)) {
        return null;
      }

      return { url, type };
    })
    .filter(Boolean);
};

const normalizeCaseEntities = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entity) => {
      if (!entity || typeof entity !== "object") {
        return null;
      }

      const label = typeof entity.label === "string" ? entity.label.trim() : "";
      const entityValue = typeof entity.value === "string" ? entity.value.trim() : "";
      const type = typeof entity.type === "string" ? entity.type.trim() : undefined;

      if (!label || !entityValue) {
        return null;
      }

      return {
        label,
        value: entityValue,
        type,
      };
    })
    .filter(Boolean);
};

const mapAiEntitiesToCaseEntities = (entitiesPayload) => {
  if (!entitiesPayload || typeof entitiesPayload !== "object") {
    return [];
  }

  const mappedEntities = [];

  const categories = [
    { key: "persons", label: "PERSON", type: "person" },
    { key: "locations", label: "LOCATION", type: "location" },
    { key: "weapons", label: "WEAPON", type: "weapon" },
  ];

  for (const category of categories) {
    const values = Array.isArray(entitiesPayload[category.key])
      ? entitiesPayload[category.key]
      : [];

    for (const rawValue of values) {
      if (typeof rawValue !== "string") {
        continue;
      }

      const value = rawValue.trim();
      if (!value) {
        continue;
      }

      mappedEntities.push({
        label: category.label,
        value,
        type: category.type,
      });
    }
  }

  return normalizeCaseEntities(mappedEntities);
};

const normalizeSuspects = (value) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((suspect) => {
      if (!suspect || typeof suspect !== "object") {
        return null;
      }

      const name = typeof suspect.name === "string" ? suspect.name.trim() : "";
      const relationship =
        typeof suspect.relationship === "string" ? suspect.relationship.trim() : undefined;
      const notes = typeof suspect.notes === "string" ? suspect.notes.trim() : undefined;

      if (!name) {
        return null;
      }

      return {
        name,
        relationship,
        notes,
      };
    })
    .filter(Boolean);
};

const syncSuspectsForCase = async (caseId, suspects) => {
  if (!Array.isArray(suspects) || suspects.length === 0) {
    return suspects;
  }

  const dedupedSuspects = new Map();

  for (const suspect of suspects) {
    const normalizedName = suspect.name.toLowerCase();

    if (!dedupedSuspects.has(normalizedName)) {
      dedupedSuspects.set(normalizedName, suspect);
    }
  }

  const linkedSuspects = [];

  for (const suspect of dedupedSuspects.values()) {
    const normalizedName = suspect.name.toLowerCase();

    const suspectDoc = await Suspect.findOneAndUpdate(
      { normalized_name: normalizedName },
      {
        $setOnInsert: {
          name: suspect.name,
          normalized_name: normalizedName,
        },
        $addToSet: {
          linked_cases: caseId,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const linkedCaseCount = Array.isArray(suspectDoc.linked_cases)
      ? suspectDoc.linked_cases.length
      : 0;
    const riskScore = calculateRiskScore(linkedCaseCount);

    if (suspectDoc.risk_score !== riskScore) {
      suspectDoc.risk_score = riskScore;
      await suspectDoc.save();
    }

    linkedSuspects.push({
      suspect_id: suspectDoc._id,
      name: suspectDoc.name,
      relationship: suspect.relationship,
      notes: suspect.notes,
    });
  }

  return linkedSuspects;
};

const normalizeTimeline = (value) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const date = new Date(entry.date);
      const event = typeof entry.event === "string" ? entry.event.trim() : "";

      if (Number.isNaN(date.getTime()) || !event) {
        return null;
      }

      return { date, event };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
};

const normalizeCoordinate = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isDateLikeEqual = (left, right) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
    return false;
  }

  return leftDate.getTime() === rightDate.getTime();
};

const areValuesEqual = (left, right) => {
  if (left === right) {
    return true;
  }

  if (left === undefined || right === undefined) {
    return false;
  }

  if (left === null || right === null) {
    return left === right;
  }

  const leftType = typeof left;
  const rightType = typeof right;

  if (leftType !== rightType) {
    return false;
  }

  if (
    (leftType === "string" || left instanceof Date || right instanceof Date) &&
    isDateLikeEqual(left, right)
  ) {
    return true;
  }

  if (leftType === "object") {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  return false;
};

const uploadIncomingEvidenceFiles = async (files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploaded = [];

  try {
    for (const file of files) {
      const uploadedFile = await uploadEvidenceFileToCloudinary(file.path, file.mimetype);
      uploaded.push(uploadedFile);
    }

    return uploaded;
  } finally {
    await Promise.all(
      files.map((file) => fs.unlink(file.path).catch(() => undefined))
    );
  }
};

const parseCasePayload = (body, { partial = false } = {}) => {
  const latitude = normalizeCoordinate(body.latitude);
  const longitude = normalizeCoordinate(body.longitude);
  const suspectsInput =
    body.suspects === undefined ? undefined : parseJsonArrayField(body.suspects, []);
  const evidenceInput =
    body.evidence === undefined ? undefined : parseJsonArrayField(body.evidence, []);
  const embeddingInput =
    body.embedding === undefined ? undefined : parseJsonArrayField(body.embedding, []);
  const entitiesInput =
    body.entities === undefined ? undefined : parseJsonArrayField(body.entities, []);
  const timelineInput =
    body.timeline === undefined ? undefined : parseJsonArrayField(body.timeline, []);

  const payload = {
    title: body.title,
    description: body.description,
    case_summary: body.case_summary,
    location: body.location,
    coordinates:
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : body.coordinates,
    date: body.date,
    crime_type: body.crime_type,
    priority: body.priority,
    tags: normalizeTags(body.tags),
    status: body.status,
    assigned_officer: body.assigned_officer === "" ? null : body.assigned_officer,
    suspects: suspectsInput === undefined ? undefined : normalizeSuspects(suspectsInput),
    evidence: evidenceInput === undefined ? undefined : normalizeEvidence(evidenceInput),
    embedding:
      embeddingInput === undefined ? undefined : normalizeEmbedding(embeddingInput),
    entities: entitiesInput === undefined ? undefined : normalizeCaseEntities(entitiesInput),
    timeline: timelineInput === undefined ? undefined : normalizeTimeline(timelineInput),
  };

  return partial ? sanitizePayload(payload) : payload;
};

const toTitleCase = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const extractSentence = (description) => {
  if (typeof description !== "string") {
    return "";
  }

  const cleaned = description.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "";
  }

  const firstSentence = cleaned.split(/[.!?]+/)[0]?.trim() || "";
  if (!firstSentence) {
    return "";
  }

  return firstSentence.length > 140
    ? `${firstSentence.slice(0, 137).trim()}...`
    : firstSentence;
};

const detectWeaponTerm = (description, entities = []) => {
  const entityWeapon = Array.isArray(entities)
    ? entities.find(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.type === "string" &&
          item.type.toLowerCase() === "weapon" &&
          typeof item.value === "string" &&
          item.value.trim()
      )
    : null;

  if (entityWeapon) {
    return entityWeapon.value.trim().toLowerCase();
  }

  if (typeof description !== "string") {
    return "";
  }

  const match = description
    .toLowerCase()
    .match(/\b(knife|gun|pistol|rifle|shotgun|machete|bomb|grenade|crowbar|bat)\b/);

  return match?.[1] || "";
};

const hasSuspectLead = ({ description, suspects }) => {
  if (Array.isArray(suspects) && suspects.length > 0) {
    return true;
  }

  if (typeof description !== "string") {
    return false;
  }

  return /\b(suspect\s+identified|suspect\s+arrested|identified\s+suspect|known\s+suspect)\b/i.test(
    description
  );
};

const generateCaseSummary = ({
  title,
  description,
  crime_type,
  location,
  entities,
  suspects,
}) => {
  const summaryLines = [];
  const crimeType = toTitleCase(crime_type) || "Crime";
  const locationPart =
    typeof location === "string" && location.trim() ? ` in ${location.trim()}` : "";
  const weapon = detectWeaponTerm(description, entities);
  const weaponPart = weapon ? ` involving ${weapon}` : "";

  summaryLines.push(`${crimeType}${weaponPart}${locationPart}.`);

  const firstSentence = extractSentence(description);
  if (firstSentence) {
    summaryLines.push(`Incident details: ${firstSentence}.`);
  } else if (typeof title === "string" && title.trim()) {
    summaryLines.push(`Incident details: ${title.trim()}.`);
  }

  if (hasSuspectLead({ description, suspects })) {
    summaryLines.push("Investigation update: suspect identified.");
  }

  const trimmedLines = summaryLines
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);

  return trimmedLines.join("\n").slice(0, 500);
};

export const createCase = asyncHandler(async (req, res) => {
  const caseData = parseCasePayload(req.body);
  const uploadedEvidence = await uploadIncomingEvidenceFiles(req.files);

  if (uploadedEvidence.length > 0) {
    caseData.evidence = [...(Array.isArray(caseData.evidence) ? caseData.evidence : []), ...uploadedEvidence];
  }

  const normalizedDescription =
    typeof caseData.description === "string" ? caseData.description.trim() : "";

  if (!normalizedDescription) {
    return res.status(400).json({
      message: "description is required",
    });
  }

  caseData.description = normalizedDescription;

  const aiResult = await analyzeCaseDescription(caseData.description);
  caseData.embedding = normalizeEmbedding(aiResult?.embedding);
  caseData.entities = mapAiEntitiesToCaseEntities(aiResult?.entities);
  caseData.case_summary = generateCaseSummary({
    title: caseData.title,
    description: caseData.description,
    crime_type: caseData.crime_type,
    location: caseData.location,
    entities: caseData.entities,
    suspects: caseData.suspects,
  });

  const createdCase = await Case.create(caseData);

  if (Array.isArray(caseData.suspects) && caseData.suspects.length > 0) {
    const linkedSuspects = await syncSuspectsForCase(createdCase._id, caseData.suspects);
    createdCase.suspects = linkedSuspects;
    await createdCase.save();
  }

  return res.status(201).json({
    message: "Case created successfully",
    case: createdCase,
  });
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildCaseSimilarityFilter = ({ location, crime_type }) => {
  const filter = {};

  if (typeof location === "string" && location.trim()) {
    filter.location = new RegExp(`^${escapeRegExp(location.trim())}$`, "i");
  }

  if (typeof crime_type === "string" && crime_type.trim()) {
    filter.crime_type = new RegExp(`^${escapeRegExp(crime_type.trim())}$`, "i");
  }

  return filter;
};

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

export const getSimilarCases = asyncHandler(async (req, res) => {
  const { query, location, crime_type } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      message: "query is required",
    });
  }

  const candidateFilter = buildCaseSimilarityFilter({ location, crime_type });
  const candidateCases = await Case.find(candidateFilter).lean();

  const casesWithEmbeddings = candidateCases.filter(
    (caseItem) => Array.isArray(caseItem.embedding) && caseItem.embedding.length > 0
  );

  if (!casesWithEmbeddings.length) {
    return res.status(200).json({
      count: 0,
      results: [],
    });
  }

  const aiResult = await searchSimilarCases({
    query: query.trim(),
    stored_embeddings: casesWithEmbeddings.map((caseItem) => caseItem.embedding),
  });

  const matchedEntries = normalizeSimilarMatches(aiResult, casesWithEmbeddings.length)
    .map((match) => ({
      caseId: casesWithEmbeddings[match.index]._id.toString(),
      similarity: match.similarity,
    }))
    .filter(Boolean);

  if (!matchedEntries.length) {
    return res.status(200).json({
      count: 0,
      results: [],
    });
  }

  const matchedIds = matchedEntries.map((entry) => entry.caseId);
  const matchedCases = await Case.find({ _id: { $in: matchedIds } });
  const caseMap = new Map(
    matchedCases.map((caseItem) => [caseItem._id.toString(), caseItem])
  );

  const results = matchedEntries
    .map((entry) => {
      const caseItem = caseMap.get(entry.caseId);
      if (!caseItem) {
        return null;
      }

      return {
        similarity: entry.similarity,
        case: caseItem,
      };
    })
    .filter(Boolean);

  return res.status(200).json({
    count: results.length,
    results,
  });
});

export const getCaseRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  const caseItem = await Case.findById(id).lean();

  if (!caseItem) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  const recommendations = [];
  const queryText =
    (typeof caseItem.description === "string" && caseItem.description.trim()) ||
    (typeof caseItem.case_summary === "string" && caseItem.case_summary.trim()) ||
    (typeof caseItem.title === "string" && caseItem.title.trim()) ||
    "";

  let matchedSimilarCases = [];

  if (queryText) {
    const candidateCases = await Case.find({ _id: { $ne: caseItem._id } }).lean();
    const casesWithEmbeddings = candidateCases.filter(
      (candidate) => Array.isArray(candidate.embedding) && candidate.embedding.length > 0
    );

    if (casesWithEmbeddings.length > 0) {
      const aiResult = await searchSimilarCases({
        query: queryText,
        stored_embeddings: casesWithEmbeddings.map((candidate) => candidate.embedding),
      });

      const similarMatches = normalizeSimilarMatches(aiResult, casesWithEmbeddings.length);
      matchedSimilarCases = similarMatches
        .map((match) => ({
          caseId: casesWithEmbeddings[match.index]._id,
          similarity: match.similarity,
          date: casesWithEmbeddings[match.index].date,
        }))
        .filter(Boolean);
    }
  }

  const similarCaseIds = matchedSimilarCases.map((item) => item.caseId.toString());
  const similarCaseIdSet = new Set(similarCaseIds);

  if (similarCaseIds.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hasRecentPattern = matchedSimilarCases.some((item) => {
      const caseDate = new Date(item.date);
      return !Number.isNaN(caseDate.getTime()) && caseDate >= sevenDaysAgo;
    });

    if (hasRecentPattern) {
      recommendations.push("Similar pattern found in last 7 days");
    }
  }

  const suspectIds = Array.isArray(caseItem.suspects)
    ? caseItem.suspects
        .map((suspect) => suspect?.suspect_id)
        .filter((suspectId) => mongoose.Types.ObjectId.isValid(suspectId))
    : [];

  if (suspectIds.length > 0 && similarCaseIdSet.size > 0) {
    const suspects = await Suspect.find({ _id: { $in: suspectIds } }).lean();

    for (const suspect of suspects) {
      const linkedCases = Array.isArray(suspect.linked_cases) ? suspect.linked_cases : [];
      const linkedSimilarCount = linkedCases.reduce((count, linkedCaseId) => {
        const key = linkedCaseId.toString();
        return similarCaseIdSet.has(key) ? count + 1 : count;
      }, 0);

      if (linkedSimilarCount > 0) {
        recommendations.push(
          `Check suspect ${suspect.name} (linked to ${linkedSimilarCount} similar cases)`
        );
      }
    }
  }

  if (typeof caseItem.location === "string" && caseItem.location.trim()) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const locationTrendCount = await Case.countDocuments({
      _id: { $ne: caseItem._id },
      location: new RegExp(`^${escapeRegExp(caseItem.location.trim())}$`, "i"),
      date: { $gte: thirtyDaysAgo },
    });

    if (locationTrendCount >= 3) {
      recommendations.push("High crime area detected");
    }
  }

  const uniqueRecommendations = [...new Set(recommendations)];

  if (uniqueRecommendations.length === 0) {
    uniqueRecommendations.push("No strong recommendation signals detected yet");
  }

  return res.status(200).json({
    caseId: caseItem._id,
    recommendationCount: uniqueRecommendations.length,
    recommendations: uniqueRecommendations,
    context: {
      similarCasesFound: matchedSimilarCases.length,
      location: caseItem.location,
    },
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

  const existingCase = await Case.findById(id);

  if (!existingCase) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  const shouldAutoGenerateSummary =
    updateData.case_summary === undefined &&
    (updateData.description !== undefined ||
      updateData.location !== undefined ||
      updateData.crime_type !== undefined ||
      updateData.suspects !== undefined);

  if (shouldAutoGenerateSummary) {
    const mergedForSummary = {
      title: updateData.title ?? existingCase.title,
      description: updateData.description ?? existingCase.description,
      crime_type: updateData.crime_type ?? existingCase.crime_type,
      location: updateData.location ?? existingCase.location,
      entities: updateData.entities ?? existingCase.entities,
      suspects: updateData.suspects ?? existingCase.suspects,
    };

    updateData.case_summary = generateCaseSummary(mergedForSummary);
  }

  const changedData = Object.fromEntries(
    Object.entries(updateData).filter(([key, value]) => {
      const currentValue = existingCase.get(key);
      return !areValuesEqual(currentValue, value);
    })
  );

  if (Object.keys(changedData).length === 0) {
    return res.status(200).json({
      message: "No changes detected",
      case: existingCase,
    });
  }

  const updatedCase = await Case.findByIdAndUpdate(id, changedData, {
    new: true,
    runValidators: true,
  });

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

export const getCaseTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid case id",
    });
  }

  const caseItem = await Case.findById(id).select("title timeline");

  if (!caseItem) {
    return res.status(404).json({
      message: "Case not found",
    });
  }

  const timeline = Array.isArray(caseItem.timeline)
    ? [...caseItem.timeline].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  return res.status(200).json({
    caseId: caseItem._id,
    title: caseItem.title,
    count: timeline.length,
    timeline,
  });
});