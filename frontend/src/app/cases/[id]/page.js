"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import useAuthGuard from "../../../hooks/useAuthGuard";
import api from "../../../lib/api";

const statusTone = {
  open: "bg-amber-100 text-amber-700",
  investigating: "bg-sky-100 text-sky-700",
  closed: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-700",
};

const priorityTone = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-rose-100 text-rose-700",
};

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
  const { isChecking, isAuthorized } = useAuthGuard();

  const [caseItem, setCaseItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [similarResults, setSimilarResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthorized || !id) {
      return;
    }

    const fetchCaseDetail = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [caseResponse, timelineResponse, recommendationResponse] = await Promise.all([
          api.get(`/cases/${id}`),
          api.get(`/cases/${id}/timeline`),
          api.get(`/cases/${id}/recommendations`),
        ]);

        const fetchedCase = caseResponse.data?.case || null;
        setCaseItem(fetchedCase);
        setTimeline(timelineResponse.data?.timeline || []);
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
    };

    fetchCaseDetail();
  }, [id, isAuthorized]);

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

  if (isChecking) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading case details...
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700">
        {error || "Case not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-linear-to-r from-slate-900 via-slate-800 to-cyan-900 px-6 py-7 text-white shadow-lg shadow-slate-900/15">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Case Intelligence Brief</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{caseItem.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-sky-100/95">{caseItem.case_summary || caseItem.description}</p>
          </div>
          <Link
            href="/cases"
            className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Back to cases
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white/15 px-3 py-1">ID #{caseItem._id.slice(-6).toUpperCase()}</span>
          <span className={`rounded-full px-3 py-1 ${statusTone[caseItem.status] || "bg-slate-100 text-slate-700"}`}>
            {caseItem.status || "unknown"}
          </span>
          <span className={`rounded-full px-3 py-1 ${priorityTone[caseItem.priority] || "bg-slate-100 text-slate-700"}`}>
            {caseItem.priority || "Medium"} priority
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Case info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Location</p>
                <p className="mt-1 text-sm text-slate-800">{caseItem.location || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Crime type</p>
                <p className="mt-1 text-sm text-slate-800">{caseItem.crime_type || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Incident date</p>
                <p className="mt-1 text-sm text-slate-800">{formatDate(caseItem.date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Created</p>
                <p className="mt-1 text-sm text-slate-800">{formatDateTime(caseItem.createdAt)}</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Description</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{caseItem.description}</p>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">Vertical timeline of case events.</p>
            {timeline.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No timeline events found.
              </p>
            ) : (
              <ol className="relative mt-6 space-y-5 border-l border-slate-200 pl-6">
                {timeline.map((entry, index) => (
                  <li key={`${entry.date}-${index}`} className="relative">
                    <span className="absolute -left-7.75 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-cyan-600 shadow" />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">{formatDate(entry.date)}</p>
                    <p className="mt-1 text-sm text-slate-700">{entry.event}</p>
                  </li>
                ))}
              </ol>
            )}
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <h2 className="text-lg font-semibold text-slate-900">Suspects</h2>
              {Array.isArray(caseItem.suspects) && caseItem.suspects.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {caseItem.suspects.map((suspect, index) => (
                    <div key={`${suspect.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{suspect.name}</p>
                      {suspect.relationship ? <p className="mt-1 text-xs text-slate-600">Role: {suspect.relationship}</p> : null}
                      {suspect.notes ? <p className="mt-1 text-xs text-slate-600">Notes: {suspect.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No suspects linked yet.</p>
              )}
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <h2 className="text-lg font-semibold text-slate-900">Evidence</h2>
              {Array.isArray(caseItem.evidence) && caseItem.evidence.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {caseItem.evidence.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{item.type || "Evidence item"}</p>
                      {item.description ? <p className="mt-1 text-xs text-slate-600">{item.description}</p> : null}
                      {item.reference ? <p className="mt-1 text-xs text-slate-500">Ref: {item.reference}</p> : null}
                      {item.file_name ? <p className="mt-1 text-xs text-slate-500">File: {item.file_name}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No evidence attached yet.</p>
              )}
            </article>
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">AI Insights</h2>

            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Similar cases</h3>
              {similarResults.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No similar cases returned.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {similarResults.map((item) => (
                    <Link
                      key={item.case._id}
                      href={`/cases/${item.case._id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.case.title}</p>
                        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                          {(Number(item.similarity || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{item.case.location} · {item.case.crime_type}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Recommendations</h3>
              {recommendations.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No recommendations available.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recommendations.map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Extracted entities</h3>
              {groupedEntities.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No entities extracted.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {groupedEntities.map((entityGroup) => (
                    <div key={entityGroup.type} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">{entityGroup.type}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entityGroup.values.map((value) => (
                          <span key={`${entityGroup.type}-${value}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
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
    </div>
  );
}
