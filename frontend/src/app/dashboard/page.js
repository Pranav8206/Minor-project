"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

import api from "../../lib/api";
import useAuthGuard from "../../hooks/useAuthGuard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [overview, setOverview] = useState({ totalCases: 0, openCases: 0, closedCases: 0 });
  const [timeline, setTimeline] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [overviewResponse, timelineResponse, casesResponse] = await Promise.all([
          api.get("/analytics/overview"),
          api.get("/analytics/crime-by-time"),
          api.get("/cases"),
        ]);

        setOverview(overviewResponse.data || { totalCases: 0, openCases: 0, closedCases: 0 });
        setTimeline(timelineResponse.data?.timeline || []);
        setRecentCases((casesResponse.data?.cases || []).slice(0, 6));
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthorized]);

  const trend = useMemo(() => {
    if (!overview.totalCases) {
      return "No case data yet";
    }

    const openRate = Math.round((overview.openCases / overview.totalCases) * 100);
    return `${openRate}% currently active`;
  }, [overview]);

  const lineData = useMemo(
    () => ({
      labels: timeline.map((item) => item.period),
      datasets: [
        {
          label: "Cases",
          data: timeline.map((item) => item.count),
          borderColor: "#0f172a",
          backgroundColor: "rgba(15, 23, 42, 0.15)",
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [timeline]
  );

  const doughnutData = useMemo(
    () => ({
      labels: ["Open", "Closed"],
      datasets: [
        {
          data: [overview.openCases, overview.closedCases],
          backgroundColor: ["#f59e0b", "#10b981"],
          borderColor: ["#ffffff", "#ffffff"],
          borderWidth: 3,
        },
      ],
    }),
    [overview]
  );

  if (isChecking) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return <div className="rounded-2xl border border-white/70 bg-white/90 p-6 text-sm text-slate-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Total Cases</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{overview.totalCases}</p>
          <p className="mt-1 text-xs font-medium text-sky-600">{trend}</p>
        </article>
        <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Open Cases</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{overview.openCases}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Need active investigation</p>
        </article>
        <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Closed Cases</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{overview.closedCases}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Resolved or archived</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <h3 className="text-lg font-semibold text-slate-900">Crime Trend by Time</h3>
          <p className="mt-1 text-sm text-slate-500">Monthly case trend based on incident date.</p>
          <div className="mt-5 h-80">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
          <h3 className="text-lg font-semibold text-slate-900">Open vs Closed</h3>
          <p className="mt-1 text-sm text-slate-500">Current workload distribution.</p>
          <div className="mt-5 h-80">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
        <h3 className="text-lg font-semibold text-slate-900">Recent Case Activity</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-130 text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Case ID</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.map((item) => (
                <tr key={item._id} className="border-b border-slate-100/80 last:border-none">
                  <td className="py-3 font-medium text-slate-700">{item._id.slice(-6).toUpperCase()}</td>
                  <td className="py-3 text-slate-700">{item.title}</td>
                  <td className="py-3 capitalize text-slate-600">{item.status}</td>
                  <td className="py-3 text-slate-600">{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
