"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

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

const initialForm = {
  // Basic Info
  title: "",
  description: "",
  location: "",
  latitude: "",
  longitude: "",
  date: "",
  crime_type: "",
  priority: "Medium",

  // Suspects
  suspects: [],

  // Timeline
  timeline: [],

  // Evidence (files will be handled separately)
  evidence: [],
};

export default function AddCasePage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Basic Info handlers
  const handleBasicChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Suspects handlers
  const addSuspect = () => {
    setFormData((prev) => ({
      ...prev,
      suspects: [...prev.suspects, { name: "", relationship: "", status: "pending" }],
    }));
  };

  const updateSuspect = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      suspects: prev.suspects.map((suspect, i) => (i === index ? { ...suspect, [field]: value } : suspect)),
    }));
  };

  const removeSuspect = (index) => {
    setFormData((prev) => ({
      ...prev,
      suspects: prev.suspects.filter((_, i) => i !== index),
    }));
  };

  // Timeline handlers
  const addTimelineStep = () => {
    setFormData((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { date: "", event: "" }],
    }));
  };

  const updateTimelineStep = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }));
  };

  const removeTimelineStep = (index) => {
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Case title is required.";
    if (!formData.description.trim()) return "Case description is required.";
    if (!formData.location.trim()) return "Location is required.";
    if (!formData.date) return "Incident date is required.";
    if (!formData.crime_type) return "Crime type is required.";
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    // Validate required fields
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Convert form data to payload with JSON arrays
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      date: formData.date,
      crime_type: formData.crime_type,
      status: "open",
      suspects: formData.suspects,
      evidence: formData.evidence,
      entities: [], // Can be populated by AI later
      embedding: [], // Can be populated by AI later
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
    return <div className="cims-card text-text-secondary p-6 text-sm">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-text-primary text-3xl font-bold">Create New Case</h2>
        <p className="text-text-secondary mt-2">Provide case details, suspects, evidence, and timeline events.</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">{message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          {/* Section 1: Basic Info */}
          <section className="cims-card p-6">
            <h3 className="text-text-primary text-lg font-semibold">Basic Information</h3>
            <p className="text-text-secondary mt-1 text-sm">Enter core case details</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleBasicChange("title", e.target.value)}
                className="cims-input px-4 py-3 text-sm sm:col-span-2"
                placeholder="Case Title"
              />

              <select
                value={formData.crime_type}
                onChange={(e) => handleBasicChange("crime_type", e.target.value)}
                className="cims-input px-4 py-3 text-sm"
              >
                <option value="">Select Crime Type</option>
                {CRIME_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={formData.priority}
                onChange={(e) => handleBasicChange("priority", e.target.value)}
                className="cims-input px-4 py-3 text-sm"
              >
                {PRIORITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level} Priority
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleBasicChange("date", e.target.value)}
                className="cims-input px-4 py-3 text-sm"
              />

              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleBasicChange("location", e.target.value)}
                className="cims-input px-4 py-3 text-sm sm:col-span-2"
                placeholder="Location / Address"
              />

              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleBasicChange("latitude", e.target.value)}
                className="cims-input px-4 py-3 text-sm"
                placeholder="Latitude (e.g. 28.6139)"
              />

              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleBasicChange("longitude", e.target.value)}
                className="cims-input px-4 py-3 text-sm"
                placeholder="Longitude (e.g. 77.2090)"
              />

              <textarea
                value={formData.description}
                onChange={(e) => handleBasicChange("description", e.target.value)}
                className="cims-input min-h-32 px-4 py-3 text-sm sm:col-span-2"
                placeholder="Detailed case description..."
              />
            </div>
          </section>

          {/* Section 2: Suspects */}
          <section className="cims-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-text-primary text-lg font-semibold">Suspects</h3>
                <p className="text-text-secondary mt-1 text-sm">Add individuals involved in the case</p>
              </div>
              <button
                type="button"
                onClick={addSuspect}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {formData.suspects.length === 0 ? (
                <p className="text-text-secondary text-sm italic">No suspects added yet. Click &quot;Add&quot; to get started.</p>
              ) : (
                formData.suspects.map((suspect, index) => (
                  <div key={index} className="rounded-lg border border-border bg-background p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        value={suspect.name}
                        onChange={(e) => updateSuspect(index, "name", e.target.value)}
                        className="cims-input px-3 py-2 text-sm"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={suspect.relationship}
                        onChange={(e) => updateSuspect(index, "relationship", e.target.value)}
                        className="cims-input px-3 py-2 text-sm"
                        placeholder="Relationship (e.g., Witness, Suspect)"
                      />
                      <select
                        value={suspect.status}
                        onChange={(e) => updateSuspect(index, "status", e.target.value)}
                        className="cims-input px-3 py-2 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="cleared">Cleared</option>
                        <option value="arrested">Arrested</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSuspect(index)}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
                    >
                      <X size={16} />
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 3: Evidence Upload */}
          <section className="cims-card p-6">
            <h3 className="text-text-primary text-lg font-semibold">Evidence</h3>
            <p className="text-text-secondary mt-1 text-sm">Upload and document evidence items</p>

            <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
              <p className="text-text-secondary text-sm">Evidence upload functionality will be available in the next update.</p>
              <p className="text-text-secondary mt-2 text-xs">Files can be attached through the case detail page after creation.</p>
            </div>
          </section>

          {/* Section 4: Timeline */}
          <section className="cims-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-text-primary text-lg font-semibold">Timeline Events</h3>
                <p className="text-text-secondary mt-1 text-sm">Document key events chronologically</p>
              </div>
              <button
                type="button"
                onClick={addTimelineStep}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition"
              >
                <Plus size={16} />
                Add Event
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {formData.timeline.length === 0 ? (
                <p className="text-text-secondary text-sm italic">No timeline events yet. Click &quot;Add Event&quot; to create one.</p>
              ) : (
                formData.timeline.map((step, index) => (
                  <div key={index} className="rounded-lg border border-border bg-background p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr,2fr]">
                      <input
                        type="datetime-local"
                        value={step.date}
                        onChange={(e) => updateTimelineStep(index, "date", e.target.value)}
                        className="cims-input px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={step.event}
                        onChange={(e) => updateTimelineStep(index, "event", e.target.value)}
                        className="cims-input px-3 py-2 text-sm"
                        placeholder="Event description (e.g., Victim reported incident)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimelineStep(index)}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
                    >
                      <X size={16} />
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="cims-button-primary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating Case..." : "Create Case"}
          </button>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <article className="cims-card p-5">
            <h4 className="text-text-primary font-semibold text-sm">Form Guide</h4>
            <ul className="text-text-secondary mt-4 space-y-3 text-xs leading-relaxed">
              <li>
                <strong>Basic Info</strong><br />All marked fields are required
              </li>
              <li>
                <strong>Suspects</strong><br />Add names and relationships as known
              </li>
              <li>
                <strong>Timeline</strong><br />Document events in chronological order
              </li>
              <li>
                <strong>Evidence</strong><br />Will be available after case creation
              </li>
            </ul>
          </article>

          <article className="cims-card p-5">
            <h4 className="text-text-primary font-semibold text-sm">Tips</h4>
            <p className="text-text-secondary mt-2 text-xs leading-relaxed">
              Be specific and detailed in descriptions. This improves AI analysis and case search quality.
            </p>
          </article>

          <article className="cims-card p-5 border-l-4 border-orange-500">
            <h4 className="text-text-primary font-semibold text-sm">Auto-Conversion</h4>
            <p className="text-text-secondary mt-2 text-xs leading-relaxed">
              Form data is automatically converted to structured JSON before sending to the backend.
            </p>
          </article>
        </aside>
      </div>
    </form>
  );
}
