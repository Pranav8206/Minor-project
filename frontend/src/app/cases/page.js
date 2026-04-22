"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

export default function CasesPage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const fetchCases = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/cases");
        setCases(response.data?.cases || []);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load cases.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [isAuthorized]);

  if (isChecking) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Loading cases...</div>;
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

      <section className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Case List</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{cases.length} cases</span>
        </div>

        <div className="mt-5 hidden overflow-x-auto md:block">
          <table className="w-full min-w-130 text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Case</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Crime Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item._id} className="border-b border-slate-100/80 last:border-none">
                  <td className="py-3">
                    <Link href={`/cases/${item._id}`} className="font-semibold text-slate-800 hover:text-sky-700 hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-500">#{item._id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="py-3 text-slate-600">{item.location}</td>
                  <td className="py-3 text-slate-600">{item.crime_type}</td>
                  <td className="py-3 capitalize text-slate-600">{item.status}</td>
                  <td className="py-3 text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 md:hidden">
          {cases.map((item) => (
            <article key={item._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">#{item._id.slice(-6).toUpperCase()}</p>
              <h4 className="mt-1 font-semibold text-slate-900">
                <Link href={`/cases/${item._id}`} className="hover:text-sky-700 hover:underline">
                  {item.title}
                </Link>
              </h4>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-1">{item.location}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{item.crime_type}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 capitalize">{item.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
