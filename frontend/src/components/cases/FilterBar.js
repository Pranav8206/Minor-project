"use client";

import { CalendarRange, Filter, Plus, RotateCcw, Search } from "lucide-react";
import Link from "next/link";

const statusOptions = [
  { label: "All Statuses", value: "" },
  { label: "Open", value: "open" },
  { label: "Investigating", value: "investigating" },
  { label: "Closed", value: "closed" },
  { label: "Archived", value: "archived" },
];

export default function FilterBar({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  primaryTypeValue,
  onPrimaryTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  crimeTypeOptions = [],
  onClearFilters,
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-lg shadow-black/20 lg:p-5">
      <div className="grid gap-3 xl:grid-cols-[1.2fr,repeat(4,minmax(0,1fr))]">
        <label className="relative block xl:col-span-1">
          <span className="sr-only">Search cases</span>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search cases..."
            className="cims-input h-12 pl-11"
          />
        </label>
        
        <div className="w-full flex gap-3">
        <label className="block w-1/2">
          <span className="sr-only">Status filter</span>
          <div className="relative">
            <select
              value={statusValue}
              onChange={(event) => onStatusChange(event.target.value)}
              className="cims-input h-12 pl-10 pr-4 "
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all-statuses"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="block w-1/2">
          <span className="sr-only">Primary type filter</span>
          <select
            value={primaryTypeValue}
            onChange={(event) => onPrimaryTypeChange(event.target.value)}
            className="cims-input h-12 px-4"
          >
            <option value="">Primary Type</option>
            {crimeTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:col-span-1">
          <label className="block">
            <span className="sr-only">Start date</span>
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="cims-input h-12 pl-10 pr-4"
              />
            </div>
          </label>
          <label className="block">
            <span className="sr-only">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="cims-input h-12 px-4"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-text-secondary text-sm">
          Use the filters to narrow cases by status, type, date, or text across title, description, and suspects.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearFilters}
            className="cims-button-muted gap-2 text-sm"
          >
            <RotateCcw size={16} />
            Clear Filters
          </button>
          <Link href="/add-case" className="cims-button-primary gap-2 text-sm">
            <Plus size={18} />
            New Case File
          </Link>
        </div>
      </div>
    </section>
  );
}
