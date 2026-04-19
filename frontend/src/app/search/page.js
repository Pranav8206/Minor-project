"use client";

import { useState } from "react";

import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

export default function SearchPage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [crimeType, setCrimeType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");

    if (!query.trim()) {
      setError("Search query is required.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/search", {
        query: query.trim(),
        location: location.trim() || undefined,
        crime_type: crimeType.trim() || undefined,
      });

      setCases(response.data?.cases || []);
      setRecentQueries((prev) => [query.trim(), ...prev.filter((item) => item !== query.trim())].slice(0, 5));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <h3 className="text-lg font-semibold text-slate-900">Intelligent Search</h3>
        <p className="mt-1 text-sm text-slate-500">Find similar cases using semantic AI matching with optional filters.</p>

        <form className="mt-5 grid gap-4 sm:grid-cols-[1.2fr,1fr,1fr,auto]" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Describe what you want to find..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <input
            value={crimeType}
            onChange={(event) => setCrimeType(event.target.value)}
            placeholder="Crime type"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <button
            disabled={isLoading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <h4 className="font-semibold text-slate-900">Recent Search Queries</h4>
        <div className="mt-4 flex flex-wrap gap-2">
          {recentQueries.map((query) => (
            <span key={query} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {query}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <h4 className="font-semibold text-slate-900">Similar Cases</h4>
        {cases.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No results yet. Run a search to see similar cases.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cases.map((caseItem) => (
              <article key={caseItem._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{caseItem._id.slice(-6).toUpperCase()}</p>
                <h5 className="mt-2 text-base font-semibold text-slate-900">{caseItem.title}</h5>
                <p className="mt-2 text-sm text-slate-600">{caseItem.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{caseItem.location}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{caseItem.crime_type}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 capitalize">{caseItem.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
