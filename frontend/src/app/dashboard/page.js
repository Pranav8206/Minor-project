"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

import api from "../../lib/api";
import useAuthGuard from "../../hooks/useAuthGuard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const statusTone = {
  open: "text-amber-600 bg-amber-50",
  investigating: "text-sky-600 bg-sky-50",
  closed: "text-emerald-600 bg-emerald-50",
  archived: "text-slate-600 bg-slate-100",
};

const formatRelativeTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
};

export default function DashboardPage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [overview, setOverview] = useState({ totalCases: 0, openCases: 0, closedCases: 0 });
  const [locationStats, setLocationStats] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [allCases, setAllCases] = useState([]);
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

        const [overviewResponse, locationResponse, timelineResponse, casesResponse] = await Promise.all([
          api.get("/analytics/overview"),
          api.get("/analytics/crime-by-location"),
          api.get("/analytics/crime-by-time"),
          api.get("/cases"),
        ]);

        setOverview(overviewResponse.data || { totalCases: 0, openCases: 0, closedCases: 0 });
        setLocationStats(locationResponse.data?.locations || []);
        setTimeline(timelineResponse.data?.timeline || []);
        setAllCases(casesResponse.data?.cases || []);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthorized]);

  const activeCases = overview.openCases;
  const highPriorityCases = useMemo(
    () => allCases.filter((item) => item.priority === "High").length,
    [allCases]
  );
  const recentCases = useMemo(() => allCases.slice(0, 8), [allCases]);

  const trend = useMemo(() => {
    if (!overview.totalCases) {
      return "No case data yet";
    }

    const openRate = Math.round((activeCases / overview.totalCases) * 100);
    return `${openRate}% currently active`;
  }, [activeCases, overview.totalCases]);

  const typeBreakdown = useMemo(() => {
    const counts = new Map();

    for (const item of allCases) {
      const key = item.crime_type?.trim() || "Unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([crimeType, count]) => ({ crimeType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allCases]);

  const locationChartData = useMemo(
    () => ({
      labels: locationStats.slice(0, 8).map((item) => item.location),
      datasets: [
        {
          label: "Cases",
          data: locationStats.slice(0, 8).map((item) => item.count),
          backgroundColor: "rgba(14, 165, 233, 0.75)",
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    }),
    [locationStats]
  );

  const lineData = useMemo(
    () => ({
      labels: timeline.map((item) => item.period),
      datasets: [
        {
          label: "Cases",
          data: timeline.map((item) => item.count),
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    }),
    [timeline]
  );

  const typeData = useMemo(
    () => ({
      labels: typeBreakdown.map((item) => item.crimeType),
      datasets: [
        {
          data: typeBreakdown.map((item) => item.count),
          backgroundColor: [
            "#0ea5e9",
            "#06b6d4",
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#6366f1",
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }),
    [typeBreakdown]
  );

  if (isChecking) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200/80 bg-linear-to-r from-slate-900 via-slate-800 to-sky-900 px-6 py-7 text-white shadow-lg shadow-slate-900/15">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Investigation Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold">Operational Crime Intelligence</h2>
        <p className="mt-1 text-sm text-sky-100/90">Live view of workload, hotspot behavior, and recent investigation activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Total cases</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{overview.totalCases}</p>
          <p className="mt-1 text-xs font-medium text-sky-600">{trend}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Active cases</p>
          <p className="mt-3 text-4xl font-semibold text-amber-600">{activeCases}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Open and investigating cases</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">High priority cases</p>
          <p className="mt-3 text-4xl font-semibold text-rose-600">{highPriorityCases}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Urgent cases requiring quick response</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <h3 className="text-lg font-semibold text-slate-900">Crime by location</h3>
          <p className="mt-1 text-sm text-slate-500">Top areas by reported case volume.</p>
          <div className="mt-5 h-72">
            <Bar
              data={locationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                  x: {
                    ticks: {
                      maxRotation: 30,
                      minRotation: 0,
                    },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <h3 className="text-lg font-semibold text-slate-900">Crime by type</h3>
          <p className="mt-1 text-sm text-slate-500">Distribution across major crime categories.</p>
          <div className="mt-5 h-72">
            <Doughnut
              data={typeData}
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

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 xl:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Crime over time</h3>
          <p className="mt-1 text-sm text-slate-500">Monthly trend showing incident frequency over time.</p>
          <div className="mt-5 h-80">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              }}
            />
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Recent activity feed</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {recentCases.length} updates
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {recentCases.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No recent activity found.
            </p>
          ) : (
            recentCases.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 transition hover:border-sky-300 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.title || "Untitled case"}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusTone[item.status] || "bg-slate-100 text-slate-600"}`}
                  >
                    {item.status || "unknown"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.crime_type || "Unknown type"} at {item.location || "Unknown location"}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Case #{item._id?.slice(-6)?.toUpperCase() || "N/A"}</span>
                  <span>{formatRelativeTime(item.createdAt || item.date)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
