"use client";

import Link from "next/link";
import { Eye, PencilLine } from "lucide-react";

import StatusBadge from "./StatusBadge";

const formatCaseId = (caseItem) => {
  if (caseItem?.case_id) {
    return caseItem.case_id;
  }

  if (caseItem?.caseCode) {
    return caseItem.caseCode;
  }

  const crimePrefix = String(caseItem?.crime_type || "Case")
    .trim()
    .charAt(0)
    .toUpperCase();
  const year = caseItem?.date ? new Date(caseItem.date).getFullYear() : new Date().getFullYear();
  const suffix = String(caseItem?._id || "").slice(-3).toUpperCase() || "000";

  return `${crimePrefix}-${year}-${suffix}`;
};

const formatOpenedDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export default function CaseRow({ caseItem, onEdit, variant = "table" }) {
  const officerName =
    caseItem?.assigned_officer?.name ||
    caseItem?.assigned_officer?.email ||
    caseItem?.assigned_officer_name ||
    "Unassigned";

  if (variant === "card") {
    return (
      <article className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-secondary">
              {formatCaseId(caseItem)}
            </p>
            <Link href={`/cases/${caseItem._id}`} className="mt-1 block text-base font-semibold text-text-primary">
              {caseItem.title || "Untitled case"}
            </Link>
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-secondary">Primary Type</dt>
            <dd className="text-text-primary mt-1 font-medium">{caseItem.crime_type || "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Date Opened</dt>
            <dd className="text-text-primary mt-1 font-medium">{formatOpenedDate(caseItem.date)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-text-secondary">Investigating Officer</dt>
            <dd className="text-text-primary mt-1 font-medium">{officerName}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/cases/${caseItem._id}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-primary/45 hover:text-text-primary"
          >
            <Eye size={14} />
            View
          </Link>
          <button
            type="button"
            onClick={() => onEdit?.(caseItem)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-primary/45 hover:text-text-primary"
          >
            <PencilLine size={14} />
            Edit
          </button>
        </div>
      </article>
    );
  }

  return (
    <tr className="border-b border-border/70 text-sm last:border-none">
      <td className="py-4 pr-4 align-top text-text-primary">
        <div className="font-medium">{formatCaseId(caseItem)}</div>
      </td>
      <td className="py-4 pr-4 align-top text-text-primary">
        <Link href={`/cases/${caseItem._id}`} className="font-medium transition hover:text-primary">
          {caseItem.title || "Untitled case"}
        </Link>
      </td>
      <td className="py-4 pr-4 align-top text-text-secondary">
        {caseItem.crime_type || "Unknown"}
      </td>
      <td className="py-4 pr-4 align-top">
        <StatusBadge status={caseItem.status} />
      </td>
      <td className="py-4 pr-4 align-top text-text-secondary">
        {formatOpenedDate(caseItem.date)}
      </td>
      <td className="py-4 pr-4 align-top text-text-secondary">
        {officerName}
      </td>
      <td className="py-4 align-top">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/cases/${caseItem._id}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-primary/45 hover:text-text-primary"
          >
            <Eye size={14} />
            View
          </Link>
          <button
            type="button"
            onClick={() => onEdit?.(caseItem)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-primary/45 hover:text-text-primary"
          >
            <PencilLine size={14} />
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
}
