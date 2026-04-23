"use client";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    className: "cims-badge-open",
  },
  investigating: {
    label: "Investigating",
    className: "cims-badge-review",
  },
  pending_review: {
    label: "Investigating",
    className: "cims-badge-review",
  },
  closed: {
    label: "Closed",
    className: "cims-badge-closed",
  },
  archived: {
    label: "Archived",
    className: "cims-badge-neutral",
  },
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: normalizedStatus ? normalizedStatus.replace(/_/g, " ") : "Unknown",
    className: "cims-badge-neutral",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
