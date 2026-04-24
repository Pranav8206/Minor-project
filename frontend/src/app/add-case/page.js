"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      evidenceFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      formData.suspects.forEach((suspect) => {
        if (suspect.imagePreviewUrl) {
          URL.revokeObjectURL(suspect.imagePreviewUrl);
        }
      });

      formData.timeline.forEach((event) => {
        if (event.imagePreviewUrl) {
          URL.revokeObjectURL(event.imagePreviewUrl);
        }
      });
    };
  }, [evidenceFiles, formData.suspects, formData.timeline]);

  // Basic Info handlers
  const handleBasicChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Suspects handlers
  const addSuspect = () => {
    setFormData((prev) => ({
      ...prev,
      suspects: [...prev.suspects, { name: "", relationship: "", status: "pending", imageFile: null, imagePreviewUrl: "" }],
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
      suspects: prev.suspects.filter((suspect, i) => {
        if (i === index && suspect.imagePreviewUrl) {
          URL.revokeObjectURL(suspect.imagePreviewUrl);
        }

        return i !== index;
      }),
    }));
  };

  const handleSuspectImageChange = (index, file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed for suspect photos.");
      return;
    }

    setError("");
    setFormData((prev) => ({
      ...prev,
      suspects: prev.suspects.map((suspect, i) => {
        if (i !== index) {
          return suspect;
        }

        if (suspect.imagePreviewUrl) {
          URL.revokeObjectURL(suspect.imagePreviewUrl);
        }

        return {
          ...suspect,
          imageFile: file,
          imagePreviewUrl: URL.createObjectURL(file),
        };
      }),
    }));
  };

  // Timeline handlers
  const addTimelineStep = () => {
    setFormData((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { date: "", event: "", imageFile: null, imagePreviewUrl: "" }],
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
      timeline: prev.timeline.filter((entry, i) => {
        if (i === index && entry.imagePreviewUrl) {
          URL.revokeObjectURL(entry.imagePreviewUrl);
        }

        return i !== index;
      }),
    }));
  };

  const handleTimelineImageChange = (index, file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed for timeline photos.");
      return;
    }

    setError("");
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.map((entry, i) => {
        if (i !== index) {
          return entry;
        }

        if (entry.imagePreviewUrl) {
          URL.revokeObjectURL(entry.imagePreviewUrl);
        }

        return {
          ...entry,
          imageFile: file,
          imagePreviewUrl: URL.createObjectURL(file),
        };
      }),
    }));
  };

  const handleEvidenceSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) {
      return;
    }

    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
    const hasInvalidFile = selectedFiles.some((file) => !allowedMimeTypes.has(file.type));

    if (hasInvalidFile) {
      setError("Only JPG, PNG, and PDF files are allowed.");
      event.target.value = "";
      return;
    }

    const nextFiles = selectedFiles.map((file) => ({
      file,
      type: file.type === "application/pdf" ? "pdf" : "image",
      previewUrl: file.type === "application/pdf" ? "" : URL.createObjectURL(file),
    }));

    setError("");
    setEvidenceFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const removeEvidenceFile = (index) => {
    setEvidenceFiles((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];

      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return next;
    });
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

    const suspectImageFiles = [];
    const normalizedSuspects = formData.suspects
      .map((suspect) => {
        const normalizedSuspect = {
          name: suspect.name?.trim() || "",
          relationship: suspect.relationship?.trim() || "",
          notes: suspect.notes?.trim() || "",
        };

        if (suspect.imageFile instanceof File) {
          normalizedSuspect.image_file_index = suspectImageFiles.length;
          suspectImageFiles.push(suspect.imageFile);
        }

        return normalizedSuspect;
      })
      .filter((suspect) => Boolean(suspect.name));

    const timelineImageFiles = [];
    const normalizedTimeline = formData.timeline
      .map((step) => {
        const normalizedStep = {
          date: step.date,
          event: step.event?.trim() || "",
        };

        if (step.imageFile instanceof File) {
          normalizedStep.image_file_index = timelineImageFiles.length;
          timelineImageFiles.push(step.imageFile);
        }

        return normalizedStep;
      })
      .filter((step) => Boolean(step.date && step.event));

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("location", formData.location.trim());
    payload.append("date", formData.date);
    payload.append("crime_type", formData.crime_type);
    payload.append("priority", formData.priority);
    payload.append("status", "open");
    payload.append("suspects", JSON.stringify(normalizedSuspects));
    payload.append("timeline", JSON.stringify(normalizedTimeline));
    payload.append("entities", JSON.stringify([]));
    payload.append("embedding", JSON.stringify([]));

    if (formData.latitude !== "") {
      payload.append("latitude", formData.latitude);
    }

    if (formData.longitude !== "") {
      payload.append("longitude", formData.longitude);
    }

    evidenceFiles.forEach((item) => {
      payload.append("evidenceFiles", item.file);
    });

    suspectImageFiles.forEach((file) => {
      payload.append("suspectImageFiles", file);
    });

    timelineImageFiles.forEach((file) => {
      payload.append("timelineImageFiles", file);
    });

    try {
      setIsSubmitting(true);
      await api.post("/cases", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("Case created successfully.");
      evidenceFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      formData.suspects.forEach((suspect) => {
        if (suspect.imagePreviewUrl) {
          URL.revokeObjectURL(suspect.imagePreviewUrl);
        }
      });

      formData.timeline.forEach((entry) => {
        if (entry.imagePreviewUrl) {
          URL.revokeObjectURL(entry.imagePreviewUrl);
        }
      });

      setEvidenceFiles([]);
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
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-primary">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-text-secondary">{message}</p>
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
                className="cims-button-primary px-3 py-2 text-sm"
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
                    <div className="mt-3 grid gap-3 sm:grid-cols-[auto,1fr] sm:items-center">
                      <label className="cims-button-muted cursor-pointer px-3 py-2 text-xs">
                        Upload suspect image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const selectedFile = event.target.files?.[0];
                            if (selectedFile) {
                              handleSuspectImageChange(index, selectedFile);
                            }
                            event.target.value = "";
                          }}
                        />
                      </label>

                      {suspect.imagePreviewUrl ? (
                        <Image
                          src={suspect.imagePreviewUrl}
                          alt={`${suspect.name || "Suspect"} preview`}
                          width={160}
                          height={96}
                          className="h-24 w-40 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <p className="text-text-secondary text-xs">No suspect image selected</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSuspect(index)}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition"
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

            <div className="mt-6 rounded-lg border-2 border-dashed border-border bg-background p-6">
              <label className="block cursor-pointer rounded-lg border border-border bg-card px-4 py-3 text-center text-sm text-text-secondary hover:border-primary/50 hover:text-text-primary transition">
                Select JPG, PNG, or PDF files
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleEvidenceSelect}
                />
              </label>

              {evidenceFiles.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {evidenceFiles.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="rounded-lg border border-border bg-card p-3">
                      {item.type === "image" ? (
                        <Image
                          src={item.previewUrl}
                          alt={item.file.name}
                          width={320}
                          height={112}
                          className="h-28 w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-md bg-background text-sm font-medium text-text-secondary">
                          PDF Document
                        </div>
                      )}
                      <p className="text-text-primary mt-2 truncate text-xs font-medium">{item.file.name}</p>
                      <p className="text-text-secondary mt-1 text-xs">{Math.round(item.file.size / 1024)} KB</p>
                      <button
                        type="button"
                        onClick={() => removeEvidenceFile(index)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                      >
                        <X size={14} />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary mt-4 text-center text-xs">
                  No files selected yet. Uploaded files will be previewed here.
                </p>
              )}
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
                className="cims-button-primary px-3 py-2 text-sm"
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
                    <div className="mt-3 grid gap-3 sm:grid-cols-[auto,1fr] sm:items-center">
                      <label className="cims-button-muted cursor-pointer px-3 py-2 text-xs">
                        Upload timeline image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const selectedFile = event.target.files?.[0];
                            if (selectedFile) {
                              handleTimelineImageChange(index, selectedFile);
                            }
                            event.target.value = "";
                          }}
                        />
                      </label>

                      {step.imagePreviewUrl ? (
                        <Image
                          src={step.imagePreviewUrl}
                          alt={`Timeline ${index + 1} preview`}
                          width={160}
                          height={96}
                          className="h-24 w-40 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <p className="text-text-secondary text-xs">No timeline image selected</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimelineStep(index)}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition"
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
                <strong>Evidence</strong><br />Attach JPG, PNG, or PDF files
              </li>
            </ul>
          </article>

          <article className="cims-card p-5">
            <h4 className="text-text-primary font-semibold text-sm">Tips</h4>
            <p className="text-text-secondary mt-2 text-xs leading-relaxed">
              Be specific and detailed in descriptions. This improves AI analysis and case search quality.
            </p>
          </article>

          <article className="cims-card p-5 border-l-4 border-primary">
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
