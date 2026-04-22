import mongoose from "mongoose";

import Case from "../models/case.model.js";
import Suspect from "../models/suspect.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { analyzeCaseDescription, searchSimilarCases } from "../utils/pythonAiClient.js";
import calculateRiskScore from "../utils/riskScore.js";

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

const parseCasePayload = (body, { partial = false } = {}) => {
  const latitude = normalizeCoordinate(body.latitude);
  const longitude = normalizeCoordinate(body.longitude);

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
    suspects: normalizeSuspects(body.suspects),
    evidence: body.evidence,
    embedding: body.embedding,
    entities: body.entities,
    timeline: normalizeTimeline(body.timeline),
  };

  return partial ? sanitizePayload(payload) : payload;
};

export const createCase = asyncHandler(async (req, res) => {
  const caseData = parseCasePayload(req.body);
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

  const matches = Array.isArray(aiResult?.matches) ? aiResult.matches : [];

  const matchedEntries = matches
    .map((match) => {
      if (!match || typeof match !== "object") {
        return null;
      }

      const index = Number(match.index);
      const similarity = Number(match.similarity);

      if (!Number.isInteger(index) || index < 0 || index >= casesWithEmbeddings.length) {
        return null;
      }

      if (!Number.isFinite(similarity)) {
        return null;
      }

      return {
        caseId: casesWithEmbeddings[index]._id.toString(),
        similarity,
      };
    })
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