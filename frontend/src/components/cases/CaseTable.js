"use client";

import CaseRow from "./CaseRow";

const SkeletonRow = () => (
  <tr className="border-b border-border/60 last:border-none">
    <td className="py-4 pr-4">
      <div className="h-4 w-24 animate-pulse rounded-full bg-border" />
    </td>
    <td className="py-4 pr-4">
      <div className="h-4 w-40 animate-pulse rounded-full bg-border" />
    </td>
    <td className="py-4 pr-4">
      <div className="h-4 w-28 animate-pulse rounded-full bg-border" />
    </td>
    <td className="py-4 pr-4">
      <div className="h-7 w-24 animate-pulse rounded-full bg-border" />
    </td>
    <td className="py-4 pr-4">
      <div className="h-4 w-28 animate-pulse rounded-full bg-border" />
    </td>
    <td className="py-4 pr-4">
      <div className="h-4 w-32 animate-pulse rounded-full bg-border" />
    </td>
    <td className="py-4">
      <div className="h-8 w-36 animate-pulse rounded-full bg-border" />
    </td>
  </tr>
);

export default function CaseTable({ cases = [], isLoading = false, onEdit }) {
  if (isLoading) {
    return (
      <section className="rounded-3xl border border-border bg-card p-5 shadow-lg shadow-black/20">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1100px] table-fixed text-left">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.15em] text-text-secondary">
                <th className="pb-4 pr-4 font-medium">Case ID</th>
                <th className="pb-4 pr-4 font-medium">Case Title</th>
                <th className="pb-4 pr-4 font-medium">Primary Type</th>
                <th className="pb-4 pr-4 font-medium">Status</th>
                <th className="pb-4 pr-4 font-medium">Date Opened</th>
                <th className="pb-4 pr-4 font-medium">Investigating Officer</th>
                <th className="pb-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-4 md:hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-background p-4">
              <div className="h-3 w-24 animate-pulse rounded-full bg-border" />
              <div className="mt-3 h-5 w-40 animate-pulse rounded-full bg-border" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-4 w-full animate-pulse rounded-full bg-border" />
                <div className="h-4 w-full animate-pulse rounded-full bg-border" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-border sm:col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-lg shadow-black/20">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1100px] table-fixed text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-[0.15em] text-text-secondary">
              <th className="pb-4 pr-4 font-medium">Case ID</th>
              <th className="pb-4 pr-4 font-medium">Case Title</th>
              <th className="pb-4 pr-4 font-medium">Primary Type</th>
              <th className="pb-4 pr-4 font-medium">Status</th>
              <th className="pb-4 pr-4 font-medium">Date Opened</th>
              <th className="pb-4 pr-4 font-medium">Investigating Officer</th>
              <th className="pb-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem) => (
              <CaseRow key={caseItem._id} caseItem={caseItem} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {cases.map((caseItem) => (
          <CaseRow key={caseItem._id} caseItem={caseItem} onEdit={onEdit} variant="card" />
        ))}
      </div>
    </section>
  );
}
