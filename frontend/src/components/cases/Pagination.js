"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const buildPageItems = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];
  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);

  if (windowStart > 2) {
    items.push("ellipsis-start");
  }

  for (let currentPage = windowStart; currentPage <= windowEnd; currentPage += 1) {
    items.push(currentPage);
  }

  if (windowEnd < totalPages - 1) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);
  return items;
};

export default function Pagination({ page, totalPages, onPageChange, total, pageStart, pageEnd }) {
  const effectiveTotalPages = Math.max(1, totalPages);
  const pageItems = buildPageItems(page, effectiveTotalPages);

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-5 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-text-secondary text-sm">
        Showing {pageStart}–{pageEnd} of {total} cases
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || total === 0}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary/45 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <div className="flex items-center gap-2">
          {pageItems.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                disabled={total === 0}
                className={`min-w-10 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  item === page
                    ? "bg-primary text-white"
                    : "border border-border bg-card text-text-secondary hover:border-primary/45 hover:text-text-primary"
                }`}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-2 text-text-secondary">
                ...
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(effectiveTotalPages, page + 1))}
          disabled={page >= effectiveTotalPages || total === 0}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary/45 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
