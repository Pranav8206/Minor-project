"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Investigating", value: "investigating" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
];

const initialFormState = {
  title: "",
  description: "",
  location: "",
  date: "",
  crime_type: "",
  status: "open",
};

const formatDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

export default function EditCaseModal({ caseItem, isOpen, isSaving, onClose, onSave }) {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!caseItem || !isOpen) {
      return;
    }

    setFormData({
      title: caseItem.title || "",
      description: caseItem.description || "",
      location: caseItem.location || "",
      date: formatDateInput(caseItem.date),
      crime_type: caseItem.crime_type || "",
      status: caseItem.status || "open",
    });
  }, [caseItem, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  if (!isOpen || !caseItem) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-border bg-card p-6 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">Edit Case</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">{caseItem.title || "Untitled case"}</h2>
            <p className="text-text-secondary mt-1 text-sm">Update the case record and refresh the table after saving.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-background p-2 text-text-secondary transition hover:border-primary/45 hover:text-text-primary"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-text-primary">Case Title</span>
              <input
                value={formData.title}
                onChange={(event) => handleChange("title", event.target.value)}
                className="cims-input"
                placeholder="Case title"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-text-primary">Description</span>
              <textarea
                value={formData.description}
                onChange={(event) => handleChange("description", event.target.value)}
                className="cims-input min-h-28"
                placeholder="Case description"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Primary Type</span>
              <input
                value={formData.crime_type}
                onChange={(event) => handleChange("crime_type", event.target.value)}
                className="cims-input"
                placeholder="Crime type"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Status</span>
              <select
                value={formData.status}
                onChange={(event) => handleChange("status", event.target.value)}
                className="cims-input"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Date Opened</span>
              <input
                type="date"
                value={formData.date}
                onChange={(event) => handleChange("date", event.target.value)}
                className="cims-input"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Location</span>
              <input
                value={formData.location}
                onChange={(event) => handleChange("location", event.target.value)}
                className="cims-input"
                placeholder="Location"
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="cims-button-muted text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="cims-button-primary text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
