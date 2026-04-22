"use client";

import { useState } from "react";

import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

const initialForm = {
  title: "",
  description: "",
  location: "",
  latitude: "",
  longitude: "",
  date: "",
  crime_type: "",
  status: "open",
  assigned_officer: "",
  suspects: "",
  evidence: "",
  embedding: "",
  entities: "",
};

const parseJsonField = (value, fallback = []) => {
  if (!value.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export default function AddCasePage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.crime_type) {
      setError("Title, description, location, date and crime type are required.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      date: formData.date,
      crime_type: formData.crime_type.trim(),
      status: formData.status,
      assigned_officer: formData.assigned_officer.trim() || null,
      suspects: parseJsonField(formData.suspects, []),
      evidence: parseJsonField(formData.evidence, []),
      embedding: parseJsonField(formData.embedding, []),
      entities: parseJsonField(formData.entities, []),
    };

    try {
      setIsSubmitting(true);
      await api.post("/cases", payload);
      setMessage("Case created successfully.");
      setFormData(initialForm);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
      <section className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <h3 className="text-lg font-semibold text-slate-900">Case Details</h3>
        <p className="mt-1 text-sm text-slate-500">Capture the core incident details to start investigation workflows.</p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <input
            name="title"
            value={formData.title}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder="Case title"
          />
          <input
            name="location"
            value={formData.location}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="Location"
          />
          <input
            name="crime_type"
            value={formData.crime_type}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="Crime type"
          />
          <input
            name="latitude"
            value={formData.latitude}
            onChange={onChange}
            type="number"
            step="any"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="Latitude (e.g. 28.6139)"
          />
          <input
            name="longitude"
            value={formData.longitude}
            onChange={onChange}
            type="number"
            step="any"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            placeholder="Longitude (e.g. 77.2090)"
          />
          <input
            name="date"
            value={formData.date}
            onChange={onChange}
            type="date"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <select
            name="status"
            value={formData.status}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <input
            name="assigned_officer"
            value={formData.assigned_officer}
            onChange={onChange}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder="Assigned officer ID (optional)"
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder="Case description"
          />
          <textarea
            name="suspects"
            value={formData.suspects}
            onChange={onChange}
            className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder='Suspects JSON array, e.g. [{"name":"John Doe","relationship":"Witness"}]'
          />
          <textarea
            name="evidence"
            value={formData.evidence}
            onChange={onChange}
            className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder='Evidence JSON array, e.g. [{"type":"image","description":"CCTV frame"}]'
          />
          <textarea
            name="embedding"
            value={formData.embedding}
            onChange={onChange}
            className="min-h-20 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder="Embedding JSON array, e.g. [0.12, 0.34, 0.56]"
          />
          <textarea
            name="entities"
            value={formData.entities}
            onChange={onChange}
            className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:col-span-2"
            placeholder='Entities JSON array, e.g. [{"label":"person","value":"John"}]'
          />
          {error ? <p className="text-sm font-medium text-rose-600 sm:col-span-2">{error}</p> : null}
          {message ? <p className="text-sm font-medium text-emerald-600 sm:col-span-2">{message}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            {isSubmitting ? "Saving..." : "Save Case"}
          </button>
        </form>
      </section>

      <aside className="space-y-4">
        <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <h4 className="font-semibold text-slate-900">Checklist</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Attach supporting evidence files</li>
            <li>Run AI analysis for entities</li>
            <li>Assign officer and set priority</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <h4 className="font-semibold text-slate-900">Tip</h4>
          <p className="mt-2 text-sm text-slate-600">Keep descriptions specific to improve AI search matching quality.</p>
        </article>
      </aside>
    </div>
  );
}
