"use client";

import { useMemo, useState } from "react";

import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractKeywords = (query) => {
  if (typeof query !== "string") {
    return [];
  }

  const stopWords = new Set([
    "the",
    "is",
    "was",
    "were",
    "and",
    "for",
    "from",
    "with",
    "that",
    "this",
    "into",
    "near",
    "case",
  ]);

  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !stopWords.has(item));

  return [...new Set(tokens)].slice(0, 8);
};

const highlightText = (text, keywords) => {
  if (typeof text !== "string" || !text) {
    return text;
  }

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${keywords.map((item) => escapeRegExp(item)).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());

    if (!isMatch) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200/70 px-1 py-0.5 text-slate-900">
        {part}
      </mark>
    );
  });
};

export default function SearchPage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [crimeType, setCrimeType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);

  const keywords = useMemo(() => extractKeywords(query), [query]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");

    if (!query.trim()) {
      setError("Search query is required.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/cases/similar", {
        query: query.trim(),
        location: location.trim() || undefined,
        crime_type: crimeType.trim() || undefined,
      });

      setResults(response.data?.results || []);
      setRecentQueries((prev) => [query.trim(), ...prev.filter((item) => item !== query.trim())].slice(0, 5));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Search failed.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setLocation("");
    setCrimeType("");
  };

  if (isChecking) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-linear-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-lg shadow-slate-900/10">
        <h3 className="text-xl font-semibold">Natural Language Search</h3>
        <p className="mt-1 text-sm text-cyan-100/90">
          Describe incidents in plain language. AI will return semantically similar cases with ranked scores.
        </p>

        <form className="mt-5 grid gap-4 sm:grid-cols-[1.2fr,1fr,1fr,auto]" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Example: robbery involving knife near railway station with known suspect"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-cyan-100/70 outline-none focus:border-cyan-200"
          />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-cyan-100/70 outline-none focus:border-cyan-200"
          />
          <input
            value={crimeType}
            onChange={(event) => setCrimeType(event.target.value)}
            placeholder="Crime type"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-cyan-100/70 outline-none focus:border-cyan-200"
          />
          <button
            disabled={isLoading}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
          >
            Clear filters
          </button>
          {keywords.length > 0 ? (
            <>
              <span className="text-xs text-cyan-100/85">Detected keywords:</span>
              {keywords.map((item) => (
                <span key={item} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-cyan-50">
                  {item}
                </span>
              ))}
            </>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5">
        <h4 className="font-semibold text-slate-900">Recent Search Queries</h4>
        <div className="mt-4 flex flex-wrap gap-2">
          {recentQueries.map((query) => (
            <span key={query} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {query}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold text-slate-900">Search Results</h4>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {results.length} matches
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
                <div className="mt-4 h-6 w-24 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No results yet. Run a natural language search to see similar cases.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {results.map((result) => {
              const caseItem = result.case;
              const similarityScore = Math.max(0, Math.min(100, Math.round(Number(result.similarity || 0) * 1000) / 10));

              return (
                <article key={caseItem._id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      {caseItem._id.slice(-6).toUpperCase()}
                    </p>
                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                      {similarityScore}% match
                    </span>
                  </div>
                  <h5 className="mt-2 text-base font-semibold text-slate-900">{highlightText(caseItem.title, keywords)}</h5>
                  <p className="mt-2 text-sm text-slate-600">
                    {highlightText(caseItem.case_summary || caseItem.description, keywords)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{highlightText(caseItem.description, keywords)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{caseItem.location}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{caseItem.crime_type}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 capitalize">{caseItem.status}</span>
                </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
