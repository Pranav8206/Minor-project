"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import useAuthGuard from "../../../hooks/useAuthGuard";
import api from "../../../lib/api";

const statusTone = {
  open: "bg-background border border-border text-primary",
  investigating: "bg-background border border-border text-primary",
  closed: "bg-background border border-border text-text-secondary",
  archived: "bg-background border border-border text-text-secondary",
};

const priorityTone = {
  Low: "bg-background border border-border text-text-secondary",
  Medium: "bg-background border border-border text-primary",
  High: "bg-background border border-border text-primary",
  Critical: "bg-background border border-border text-primary",
};

const CRIME_TYPES = [
  "Theft",
  "Robbery",
  "Burglary",
  "Assault",
  "Homicide",
  "Fraud",
  "Cybercrime",
  "Drug Trafficking",
  "Human Trafficking",
  "Other",
];

const PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"];

const formatDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

const formatDateTimeLocal = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const normalizeEditableData = (caseItem, timeline) => ({
  title: caseItem?.title || "",
  description: caseItem?.description || "",
  location: caseItem?.location || "",
  date: formatDateInput(caseItem?.date),
  crime_type: caseItem?.crime_type || "",
  priority: caseItem?.priority || "Medium",
  suspects: Array.isArray(caseItem?.suspects)
    ? caseItem.suspects.map((suspect) => ({
        name: suspect?.name || "",
        relationship: suspect?.relationship || "",
        notes: suspect?.notes || "",
      }))
    : [],
  timeline: Array.isArray(timeline)
    ? timeline.map((entry) => ({
        date: formatDateTimeLocal(entry?.date),
        event: entry?.event || "",
      }))
    : [],
});

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function CaseDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { isChecking, isAuthorized } = useAuthGuard();

  const [caseItem, setCaseItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [similarResults, setSimilarResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editFormData, setEditFormData] = useState(null);
  const [initialEditData, setInitialEditData] = useState(null);
  const [hasAutoOpenedFromQuery, setHasAutoOpenedFromQuery] = useState(false);
  const [quickSuspect, setQuickSuspect] = useState({
    name: "",
    relationship: "",
    notes: "",
  });
  const [quickTimeline, setQuickTimeline] = useState({
    date: "",
    event: "",
  });
  const [quickActionError, setQuickActionError] = useState("");
  const [quickActionSuccess, setQuickActionSuccess] = useState("");
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  const fetchCaseDetail = useCallback(async () => {
    if (!isAuthorized || !id) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const [caseResponse, timelineResponse, recommendationResponse] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get(`/cases/${id}/timeline`),
        api.get(`/cases/${id}/recommendations`),
      ]);

      const fetchedCase = caseResponse.data?.case || null;
      const fetchedTimeline = timelineResponse.data?.timeline || [];

      setCaseItem(fetchedCase);
      setTimeline(fetchedTimeline);
      setRecommendations(recommendationResponse.data?.recommendations || []);

      if (fetchedCase?.description) {
        const similarResponse = await api.post("/cases/similar", {
          query: fetchedCase.description,
          location: fetchedCase.location,
          crime_type: fetchedCase.crime_type,
        });

        const results = (similarResponse.data?.results || [])
          .filter((item) => item?.case?._id && item.case._id !== fetchedCase._id)
          .slice(0, 5);

        setSimilarResults(results);
      } else {
        setSimilarResults([]);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load case details.");
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthorized]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!caseItem) {
      return;
    }

    if (searchParams?.get("edit") === "1" && !hasAutoOpenedFromQuery) {
      const editableData = normalizeEditableData(caseItem, timeline);
      setInitialEditData(editableData);
      setEditFormData(editableData);
      setSaveError("");
      setSaveSuccess("");
      setIsEditOpen(true);
      setHasAutoOpenedFromQuery(true);
    }
  }, [caseItem, timeline, searchParams, hasAutoOpenedFromQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const groupedEntities = useMemo(() => {
    const entities = caseItem?.entities;

    if (!Array.isArray(entities)) {
      return [];
    }

    const map = new Map();

    for (const entity of entities) {
      const type = entity?.type || entity?.label || "other";
      const key = String(type).toLowerCase();
      const current = map.get(key) || [];
      if (entity?.value) {
        current.push(entity.value);
      }
      map.set(key, current);
    }

    return [...map.entries()].map(([type, values]) => ({
      type,
      values: [...new Set(values)],
    }));
  }, [caseItem]);

  const openEditModal = () => {
    const editableData = normalizeEditableData(caseItem, timeline);
    setInitialEditData(editableData);
    setEditFormData(editableData);
    setSaveError("");
    setSaveSuccess("");
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (isSaving) {
      return;
    }

    setIsEditOpen(false);
  };

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addEditSuspect = () => {
    setEditFormData((prev) => ({
      ...prev,
      suspects: [...(prev?.suspects || []), { name: "", relationship: "", notes: "" }],
    }));
  };

  const updateEditSuspect = (index, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      suspects: (prev?.suspects || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeEditSuspect = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      suspects: (prev?.suspects || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addEditTimeline = () => {
    setEditFormData((prev) => ({
      ...prev,
      timeline: [...(prev?.timeline || []), { date: "", event: "" }],
    }));
  };

  const updateEditTimeline = (index, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      timeline: (prev?.timeline || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeEditTimeline = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      timeline: (prev?.timeline || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const buildChangedPayload = () => {
    if (!editFormData || !initialEditData) {
      return {};
    }

    const normalizedCurrent = {
      ...editFormData,
      title: editFormData.title.trim(),
      description: editFormData.description.trim(),
      location: editFormData.location.trim(),
      suspects: (editFormData.suspects || [])
        .map((suspect) => ({
          name: suspect.name.trim(),
          relationship: suspect.relationship.trim(),
          notes: suspect.notes.trim(),
        }))
        .filter((suspect) => Boolean(suspect.name)),
      timeline: (editFormData.timeline || [])
        .map((entry) => ({
          date: entry.date,
          event: entry.event.trim(),
        }))
        .filter((entry) => Boolean(entry.date && entry.event)),
    };

    const normalizedInitial = {
      ...initialEditData,
      suspects: (initialEditData.suspects || [])
        .map((suspect) => ({
          name: suspect.name.trim(),
          relationship: suspect.relationship.trim(),
          notes: suspect.notes.trim(),
        }))
        .filter((suspect) => Boolean(suspect.name)),
      timeline: (initialEditData.timeline || [])
        .map((entry) => ({
          date: entry.date,
          event: entry.event.trim(),
        }))
        .filter((entry) => Boolean(entry.date && entry.event)),
    };

    const payload = {};

    const fieldsToCompare = [
      "title",
      "description",
      "location",
      "date",
      "crime_type",
      "priority",
      "suspects",
      "timeline",
    ];

    fieldsToCompare.forEach((field) => {
      if (JSON.stringify(normalizedCurrent[field]) !== JSON.stringify(normalizedInitial[field])) {
        payload[field] = normalizedCurrent[field];
      }
    });

    return payload;
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editFormData) {
      return;
    }

    if (!editFormData.title.trim() || !editFormData.description.trim() || !editFormData.location.trim() || !editFormData.date || !editFormData.crime_type) {
      setSaveError("Title, description, location, date, and crime type are required.");
      return;
    }

    const changedPayload = buildChangedPayload();

    if (Object.keys(changedPayload).length === 0) {
      setSaveSuccess("No changes detected.");
      setSaveError("");
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");
      setSaveSuccess("");
      await api.put(`/cases/${id}`, changedPayload);
      setSaveSuccess("Case updated successfully.");
      await fetchCaseDetail();
      setTimeout(() => {
        setIsEditOpen(false);
      }, 600);
    } catch (apiError) {
      setSaveError(apiError.response?.data?.message || "Failed to update case.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSuspectSubmit = async (event) => {
    event.preventDefault();
    const name = quickSuspect.name.trim();

    if (!name) {
      setQuickActionError("Suspect name is required.");
      setQuickActionSuccess("");
      return;
    }

    try {
      setIsQuickSubmitting(true);
      setQuickActionError("");
      setQuickActionSuccess("");

      await api.post(`/cases/${id}/suspects`, {
        suspects: [
          {
            name,
            relationship: quickSuspect.relationship.trim(),
            notes: quickSuspect.notes.trim(),
          },
        ],
      });

      setQuickSuspect({ name: "", relationship: "", notes: "" });
      setQuickActionSuccess("Suspect linked successfully.");
      await fetchCaseDetail();
    } catch (apiError) {
      setQuickActionError(apiError.response?.data?.message || "Failed to add suspect.");
      setQuickActionSuccess("");
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const handleQuickTimelineSubmit = async (event) => {
    event.preventDefault();
    if (!quickTimeline.date || !quickTimeline.event.trim()) {
      setQuickActionError("Timeline date and event are required.");
      setQuickActionSuccess("");
      return;
    }

    try {
      setIsQuickSubmitting(true);
      setQuickActionError("");
      setQuickActionSuccess("");

      await api.post(`/cases/${id}/timeline`, {
        timeline: [
          {
            date: quickTimeline.date,
            event: quickTimeline.event.trim(),
          },
        ],
      });

      setQuickTimeline({ date: "", event: "" });
      setQuickActionSuccess("Timeline event added successfully.");
      await fetchCaseDetail();
    } catch (apiError) {
      setQuickActionError(apiError.response?.data?.message || "Failed to add timeline event.");
      setQuickActionSuccess("");
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="cims-card text-text-secondary p-6 text-sm">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="cims-card text-text-secondary p-6 text-sm">
        Loading case details...
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm font-medium text-primary">
        {error || "Case not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-3xl border border-border bg-card px-4 py-3 text-sm font-medium text-primary">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-border bg-card px-6 py-7 shadow-lg shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-text-secondary text-xs uppercase tracking-[0.2em]">Case Intelligence Brief</p>
            <h1 className="text-text-primary mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{caseItem.title}</h1>
            <p className="text-text-secondary mt-2 max-w-3xl text-sm">{caseItem.case_summary || caseItem.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openEditModal}
              className="cims-button-primary text-sm"
            >
              Edit
            </button>
            <Link
              href="/cases"
              className="cims-button-muted text-sm"
            >
              Back to cases
            </Link>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-background border border-border px-3 py-1 text-text-secondary">ID #{caseItem._id.slice(-6).toUpperCase()}</span>
          <span className={`rounded-full px-3 py-1 ${statusTone[caseItem.status] || "bg-background text-text-secondary"}`}>
            {caseItem.status || "unknown"}
          </span>
          <span className={`rounded-full px-3 py-1 ${priorityTone[caseItem.priority] || "bg-background text-text-secondary"}`}>
            {caseItem.priority || "Medium"} priority
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <section className="space-y-6">
          <article className="cims-card p-6">
            <h2 className="text-text-primary text-lg font-semibold">Case info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-[0.12em]">Location</p>
                <p className="text-text-primary mt-1 text-sm">{caseItem.location || "Unknown"}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-[0.12em]">Crime type</p>
                <p className="text-text-primary mt-1 text-sm">{caseItem.crime_type || "Unknown"}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-[0.12em]">Incident date</p>
                <p className="text-text-primary mt-1 text-sm">{formatDate(caseItem.date)}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-[0.12em]">Created</p>
                <p className="text-text-primary mt-1 text-sm">{formatDateTime(caseItem.createdAt)}</p>
              </div>
            </div>
            <div className="bg-background mt-5 rounded-2xl border border-border p-4">
              <p className="text-text-secondary text-xs font-medium uppercase tracking-[0.12em]">Description</p>
              <p className="text-text-primary mt-2 text-sm leading-relaxed">{caseItem.description}</p>
            </div>
          </article>

          <article className="cims-card p-6">
            <h2 className="text-text-primary text-lg font-semibold">Timeline</h2>
            <p className="text-text-secondary mt-1 text-sm">Vertical timeline of case events.</p>
            {timeline.length === 0 ? (
              <p className="text-text-secondary bg-background mt-4 rounded-2xl border border-dashed border-border px-4 py-6 text-sm">
                No timeline events found.
              </p>
            ) : (
              <ol className="relative mt-6 space-y-5 border-l border-border pl-6">
                {timeline.map((entry, index) => (
                  <li key={`${entry.date}-${index}`} className="relative">
                    <span className="absolute -left-7.75 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary shadow" />
                    <p className="text-primary text-xs font-semibold uppercase tracking-[0.12em]">{formatDate(entry.date)}</p>
                    <p className="text-text-primary mt-1 text-sm">{entry.event}</p>
                  </li>
                ))}
              </ol>
            )}

            <form className="mt-6 rounded-2xl border border-border bg-background p-4" onSubmit={handleQuickTimelineSubmit}>
              <p className="text-text-primary text-sm font-semibold">Quick add timeline event</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,2fr,auto]">
                <input
                  type="datetime-local"
                  value={quickTimeline.date}
                  onChange={(event) =>
                    setQuickTimeline((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="cims-input px-3 py-2 text-sm"
                />
                <input
                  value={quickTimeline.event}
                  onChange={(event) =>
                    setQuickTimeline((prev) => ({ ...prev, event: event.target.value }))
                  }
                  className="cims-input px-3 py-2 text-sm"
                  placeholder="Event details"
                />
                <button
                  type="submit"
                  disabled={isQuickSubmitting}
                  className="cims-button-primary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Add Event
                </button>
              </div>
            </form>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="cims-card p-6">
              <h2 className="text-text-primary text-lg font-semibold">Suspects</h2>
              {Array.isArray(caseItem.suspects) && caseItem.suspects.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {caseItem.suspects.map((suspect, index) => (
                    <div key={`${suspect.name}-${index}`} className="bg-background rounded-2xl border border-border p-3">
                      <p className="text-text-primary text-sm font-semibold">{suspect.name}</p>
                      {suspect.relationship ? <p className="text-text-secondary mt-1 text-xs">Role: {suspect.relationship}</p> : null}
                      {suspect.notes ? <p className="text-text-secondary mt-1 text-xs">Notes: {suspect.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary mt-4 text-sm">No suspects linked yet.</p>
              )}

              <form className="mt-6 rounded-2xl border border-border bg-background p-4" onSubmit={handleQuickSuspectSubmit}>
                <p className="text-text-primary text-sm font-semibold">Quick add suspect</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <input
                    value={quickSuspect.name}
                    onChange={(event) =>
                      setQuickSuspect((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="cims-input px-3 py-2 text-sm"
                    placeholder="Suspect name"
                  />
                  <input
                    value={quickSuspect.relationship}
                    onChange={(event) =>
                      setQuickSuspect((prev) => ({
                        ...prev,
                        relationship: event.target.value,
                      }))
                    }
                    className="cims-input px-3 py-2 text-sm"
                    placeholder="Relationship"
                  />
                  <input
                    value={quickSuspect.notes}
                    onChange={(event) =>
                      setQuickSuspect((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="cims-input px-3 py-2 text-sm"
                    placeholder="Notes"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isQuickSubmitting}
                  className="cims-button-primary mt-3 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Add Suspect
                </button>
              </form>
            </article>

            <article className="cims-card p-6">
              <h2 className="text-text-primary text-lg font-semibold">Evidence</h2>
              {Array.isArray(caseItem.evidence) && caseItem.evidence.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {caseItem.evidence.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="bg-background rounded-2xl border border-border p-3">
                      <p className="text-text-primary text-sm font-semibold">{item.type || "Evidence item"}</p>
                      {item.description ? <p className="text-text-secondary mt-1 text-xs">{item.description}</p> : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-primary underline"
                        >
                          Open file
                        </a>
                      ) : null}
                      {item.reference ? <p className="text-text-secondary mt-1 text-xs">Ref: {item.reference}</p> : null}
                      {item.file_name ? <p className="text-text-secondary mt-1 text-xs">File: {item.file_name}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary mt-4 text-sm">No evidence attached yet.</p>
              )}
            </article>
          </div>
        </section>

        <section className="space-y-6">
          <article className="cims-card p-6">
            <h2 className="text-text-primary text-lg font-semibold">AI Insights</h2>

            <div className="mt-4">
              <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-[0.12em]">Similar cases</h3>
              {similarResults.length === 0 ? (
                <p className="text-text-secondary mt-2 text-sm">No similar cases returned.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {similarResults.map((item) => (
                    <Link
                      key={item.case._id}
                      href={`/cases/${item.case._id}`}
                      className="bg-background block rounded-2xl border border-border p-3 transition hover:border-primary/45"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-text-primary text-sm font-semibold">{item.case.title}</p>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-primary">
                          {(Number(item.similarity || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-text-secondary mt-1 text-xs">{item.case.location} · {item.case.crime_type}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-[0.12em]">Recommendations</h3>
              {recommendations.length === 0 ? (
                <p className="text-text-secondary mt-2 text-sm">No recommendations available.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recommendations.map((item, index) => (
                    <li key={`${item}-${index}`} className="text-text-primary bg-background rounded-2xl border border-border px-3 py-2 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-[0.12em]">Extracted entities</h3>
              {groupedEntities.length === 0 ? (
                <p className="text-text-secondary mt-2 text-sm">No entities extracted.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {groupedEntities.map((entityGroup) => (
                    <div key={entityGroup.type} className="bg-background rounded-2xl border border-border p-3">
                      <p className="text-primary text-xs font-semibold uppercase tracking-[0.12em]">{entityGroup.type}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entityGroup.values.map((value) => (
                          <span key={`${entityGroup.type}-${value}`} className="text-text-secondary rounded-full bg-card border border-border px-2.5 py-1 text-xs font-medium">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </div>

      {quickActionError ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-primary">
          {quickActionError}
        </div>
      ) : null}
      {quickActionSuccess ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text-secondary">
          {quickActionSuccess}
        </div>
      ) : null}

      {isEditOpen && editFormData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
          <div className="cims-card max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-text-primary text-xl font-semibold">Edit Case</h2>
                <p className="text-text-secondary mt-1 text-sm">Update basic details, suspects, timeline, and priority.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-border p-2 text-text-secondary transition hover:text-text-primary"
                aria-label="Close edit modal"
              >
                <X size={16} />
              </button>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleEditSubmit}>
              <section className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-text-primary text-sm font-semibold uppercase tracking-[0.12em]">Basic Info</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={editFormData.title}
                    onChange={(event) => handleEditChange("title", event.target.value)}
                    className="cims-input px-4 py-2 text-sm sm:col-span-2"
                    placeholder="Case title"
                  />
                  <select
                    value={editFormData.crime_type}
                    onChange={(event) => handleEditChange("crime_type", event.target.value)}
                    className="cims-input px-4 py-2 text-sm"
                  >
                    <option value="">Select crime type</option>
                    {CRIME_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editFormData.priority}
                    onChange={(event) => handleEditChange("priority", event.target.value)}
                    className="cims-input px-4 py-2 text-sm"
                  >
                    {PRIORITY_LEVELS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(event) => handleEditChange("date", event.target.value)}
                    className="cims-input px-4 py-2 text-sm"
                  />
                  <input
                    value={editFormData.location}
                    onChange={(event) => handleEditChange("location", event.target.value)}
                    className="cims-input px-4 py-2 text-sm sm:col-span-2"
                    placeholder="Location"
                  />
                  <textarea
                    value={editFormData.description}
                    onChange={(event) => handleEditChange("description", event.target.value)}
                    className="cims-input min-h-28 px-4 py-2 text-sm sm:col-span-2"
                    placeholder="Description"
                  />
                </div>
              </section>

              <section className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-text-primary text-sm font-semibold uppercase tracking-[0.12em]">Suspects</h3>
                  <button
                    type="button"
                    onClick={addEditSuspect}
                    className="cims-button-primary px-3 py-1.5 text-xs"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {(editFormData.suspects || []).length === 0 ? (
                    <p className="text-text-secondary text-sm">No suspects added.</p>
                  ) : (
                    editFormData.suspects.map((suspect, index) => (
                      <div key={`edit-suspect-${index}`} className="rounded-lg border border-border bg-card p-3">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            value={suspect.name}
                            onChange={(event) => updateEditSuspect(index, "name", event.target.value)}
                            className="cims-input px-3 py-2 text-sm"
                            placeholder="Name"
                          />
                          <input
                            value={suspect.relationship}
                            onChange={(event) => updateEditSuspect(index, "relationship", event.target.value)}
                            className="cims-input px-3 py-2 text-sm"
                            placeholder="Relationship"
                          />
                          <input
                            value={suspect.notes}
                            onChange={(event) => updateEditSuspect(index, "notes", event.target.value)}
                            className="cims-input px-3 py-2 text-sm"
                            placeholder="Notes"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditSuspect(index)}
                          className="mt-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-text-primary text-sm font-semibold uppercase tracking-[0.12em]">Timeline</h3>
                  <button
                    type="button"
                    onClick={addEditTimeline}
                    className="cims-button-primary px-3 py-1.5 text-xs"
                  >
                    <Plus size={14} />
                    Add Event
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {(editFormData.timeline || []).length === 0 ? (
                    <p className="text-text-secondary text-sm">No timeline events.</p>
                  ) : (
                    editFormData.timeline.map((entry, index) => (
                      <div key={`edit-timeline-${index}`} className="rounded-lg border border-border bg-card p-3">
                        <div className="grid gap-2 sm:grid-cols-[1fr,2fr]">
                          <input
                            type="datetime-local"
                            value={entry.date}
                            onChange={(event) => updateEditTimeline(index, "date", event.target.value)}
                            className="cims-input px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.event}
                            onChange={(event) => updateEditTimeline(index, "event", event.target.value)}
                            className="cims-input px-3 py-2 text-sm"
                            placeholder="Event"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditTimeline(index)}
                          className="mt-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {saveError ? <p className="text-sm font-medium text-primary">{saveError}</p> : null}
              {saveSuccess ? <p className="text-sm font-medium text-text-secondary">{saveSuccess}</p> : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="cims-button-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
