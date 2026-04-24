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
  Filler,
  RadialLinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line, PolarArea } from "react-chartjs-2";
import { AlertTriangle, Flame, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

import api from "../../lib/api";
import useAuthGuard from "../../hooks/useAuthGuard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

const statusTone = {
  open: "text-emerald-200 bg-emerald-500/12 border border-emerald-400/25",
  investigating: "text-amber-200 bg-amber-500/12 border border-amber-400/25",
  closed: "text-slate-300 bg-slate-500/12 border border-slate-400/25",
  archived: "text-zinc-300 bg-zinc-500/12 border border-zinc-400/25",
};

const metricCards = [
  {
    id: "total",
    label: "Total Cases",
    field: "totalCases",
    Icon: TrendingUp,
    accentClass: "text-cyan-200 border-cyan-400/35 bg-cyan-500/12",
    hint: "All tracked investigations",
  },
  {
    id: "active",
    label: "Active Cases",
    field: "openCases",
    Icon: ShieldAlert,
    accentClass: "text-amber-100 border-amber-400/35 bg-amber-500/12",
    hint: "Open and investigating",
  },
  {
    id: "closed",
    label: "Closed Cases",
    field: "closedCases",
    Icon: Sparkles,
    accentClass: "text-violet-100 border-violet-400/35 bg-violet-500/12",
    hint: "Resolved investigations",
  },
  {
    id: "high",
    label: "High Priority",
    field: "highPriorityCases",
    Icon: AlertTriangle,
    accentClass: "text-rose-100 border-rose-400/35 bg-rose-500/12",
    hint: "Urgent response required",
  },
];

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

  const totalTimelineCases = useMemo(
    () => timeline.reduce((sum, item) => sum + Number(item.count || 0), 0),
    [timeline]
  );

  const previousTimelineCases = useMemo(() => {
    if (timeline.length < 2) {
      return 0;
    }

    return timeline
      .slice(0, -1)
      .reduce((sum, item) => sum + Number(item.count || 0), 0);
  }, [timeline]);

  const periodGrowth = useMemo(() => {
    if (!previousTimelineCases) {
      return totalTimelineCases > 0 ? 100 : 0;
    }

    return Math.round(((totalTimelineCases - previousTimelineCases) / previousTimelineCases) * 100);
  }, [previousTimelineCases, totalTimelineCases]);

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

  const locationChartData = useMemo(() => {
    const palette = [
      "rgba(56, 189, 248, 0.8)",
      "rgba(20, 184, 166, 0.8)",
      "rgba(249, 115, 22, 0.8)",
      "rgba(244, 114, 182, 0.8)",
      "rgba(168, 85, 247, 0.8)",
      "rgba(96, 165, 250, 0.8)",
      "rgba(59, 130, 246, 0.8)",
      "rgba(236, 72, 153, 0.8)",
    ];

    const topLocations = locationStats.slice(0, 8);

    return {
      labels: topLocations.map((item) => item.location),
      datasets: [
        {
          label: "Cases",
          data: topLocations.map((item) => item.count),
          backgroundColor: topLocations.map((_, index) => palette[index % palette.length]),
          borderColor: "rgba(9, 12, 18, 0.2)",
          borderWidth: 1,
        },
      ],
    };
  }, [locationStats]);

  const lineData = useMemo(
    () => ({
      labels: timeline.map((item) => item.period),
      datasets: [
        {
          label: "Cases",
          data: timeline.map((item) => item.count),
          borderColor: "rgba(56, 189, 248, 0.9)",
          backgroundColor: "rgba(56, 189, 248, 0.18)",
          tension: 0.38,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "rgba(15, 23, 42, 0.95)",
          pointBorderWidth: 2,
          pointBorderColor: "rgba(56, 189, 248, 0.9)",
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
            "rgba(244, 114, 182, 0.9)",
            "rgba(59, 130, 246, 0.9)",
            "rgba(20, 184, 166, 0.9)",
            "rgba(249, 115, 22, 0.9)",
            "rgba(168, 85, 247, 0.9)",
            "rgba(56, 189, 248, 0.9)",
          ],
          borderColor: "rgba(9, 12, 18, 0.8)",
          borderWidth: 2,
        },
      ],
    }),
    [typeBreakdown]
  );

  const statusData = useMemo(() => {
    const statusMap = new Map();

    for (const caseItem of allCases) {
      const key = (caseItem.status || "unknown").toLowerCase();
      statusMap.set(key, (statusMap.get(key) || 0) + 1);
    }

    const labels = [...statusMap.keys()].map((status) =>
      status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    );

    return {
      labels,
      datasets: [
        {
          label: "Status",
          data: [...statusMap.values()],
          backgroundColor: [
            "rgba(16, 185, 129, 0.75)",
            "rgba(245, 158, 11, 0.75)",
            "rgba(14, 165, 233, 0.75)",
            "rgba(99, 102, 241, 0.75)",
            "rgba(244, 114, 182, 0.75)",
          ],
          borderColor: "rgba(17, 24, 39, 0.7)",
          borderWidth: 1,
        },
      ],
    };
  }, [allCases]);

  const dashboardMetrics = useMemo(
    () => [
      { ...metricCards[0], value: overview.totalCases },
      { ...metricCards[1], value: activeCases },
      { ...metricCards[2], value: overview.closedCases },
      { ...metricCards[3], value: highPriorityCases },
    ],
    [activeCases, highPriorityCases, overview.closedCases, overview.totalCases]
  );

  if (isChecking) {
    return (
      <div className="cims-card text-text-secondary p-6 text-sm">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="dashboard-hero-panel p-6 md:p-8">
          <div className="dashboard-skeleton h-4 w-36 rounded-full" />
          <div className="mt-3 dashboard-skeleton h-9 w-72 rounded-xl" />
          <div className="mt-3 dashboard-skeleton h-4 w-full max-w-xl rounded-full" />
        </section>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="dashboard-panel p-5">
              <div className="dashboard-skeleton h-4 w-28 rounded-full" />
              <div className="mt-4 dashboard-skeleton h-10 w-20 rounded-xl" />
              <div className="mt-4 dashboard-skeleton h-3 w-32 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <section key={index} className="dashboard-panel p-5">
              <div className="dashboard-skeleton h-5 w-40 rounded-full" />
              <div className="mt-2 dashboard-skeleton h-3 w-56 rounded-full" />
              <div className="mt-5 dashboard-skeleton h-64 w-full rounded-2xl" />
            </section>
          ))}
        </div>

        <section className="dashboard-panel p-5">
          <div className="dashboard-skeleton h-5 w-44 rounded-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="dashboard-skeleton h-20 w-full rounded-2xl" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-primary">
          {error}
        </div>
      ) : null}

      <section className="dashboard-hero-panel px-6 py-7 md:px-8 md:py-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-cyan-100/80 text-xs font-semibold uppercase tracking-[0.2em]">CIMS Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Operational Intelligence Matrix
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200/85">
              Unified visibility of case load, hotspot volatility, and active investigation movement.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
            <Flame size={14} />
            {periodGrowth >= 0 ? "+" : ""}
            {periodGrowth}% trend vs prior window
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.Icon;

          return (
            <article key={metric.id} className="dashboard-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-300">{metric.label}</p>
                <span className={`rounded-xl border p-2 ${metric.accentClass}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-300">{metric.id === "total" ? trend : metric.hint}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="dashboard-panel p-5 lg:col-span-2">
          <h3 className="text-text-primary text-lg font-semibold">Crime by location</h3>
          <p className="text-text-secondary mt-1 text-sm">Hotspot density across top reporting zones.</p>
          <div className="mt-5 h-72">
            <Bar
              data={locationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                indexAxis: "y",
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0, color: "var(--text-secondary)" },
                    grid: { color: "var(--border)" },
                  },
                  x: {
                    ticks: {
                      precision: 0,
                      color: "var(--text-secondary)",
                    },
                    grid: { color: "var(--border)" },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="dashboard-panel p-5">
          <h3 className="text-text-primary text-lg font-semibold">Status pressure map</h3>
          <p className="text-text-secondary mt-1 text-sm">Quick view of case status distribution.</p>
          <div className="mt-5 h-72">
            <PolarArea
              data={statusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    grid: { color: "color-mix(in srgb, var(--border) 80%, transparent)" },
                    angleLines: { color: "color-mix(in srgb, var(--border) 70%, transparent)" },
                    ticks: { color: "var(--text-secondary)", backdropColor: "transparent", precision: 0 },
                    pointLabels: { color: "var(--text-secondary)", font: { size: 11 } },
                  },
                },
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "var(--text-secondary)",
                      boxWidth: 12,
                    },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="dashboard-panel p-5">
          <h3 className="text-text-primary text-lg font-semibold">Crime by type</h3>
          <p className="text-text-secondary mt-1 text-sm">Distribution across major crime categories.</p>
          <div className="mt-5 h-72">
            <Doughnut
              data={typeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: "var(--text-secondary)", boxWidth: 10 },
                  },
                },
              }}
            />
          </div>
        </section>

        <section className="dashboard-panel p-5 lg:col-span-2">
          <h3 className="text-text-primary text-lg font-semibold">Crime over time</h3>
          <p className="text-text-secondary mt-1 text-sm">Incident rhythm and acceleration over time.</p>
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
                    ticks: { precision: 0, color: "var(--text-secondary)" },
                    grid: { color: "var(--border)" },
                  },
                  x: {
                    ticks: { color: "var(--text-secondary)" },
                    grid: { color: "var(--border)" },
                  },
                },
              }}
            />
          </div>
        </section>
      </div>

      <section className="dashboard-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-text-primary text-lg font-semibold">Recent activity feed</h3>
          <span className="text-text-secondary bg-background rounded-full px-3 py-1 text-xs font-medium">
            {recentCases.length} updates
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {recentCases.length === 0 ? (
            <p className="text-text-secondary bg-background rounded-2xl border border-dashed border-border px-4 py-6 text-sm">
              No recent activity found.
            </p>
          ) : (
            recentCases.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_14px_26px_rgba(0,0,0,0.26)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-text-primary text-sm font-semibold">{item.title || "Untitled case"}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusTone[item.status] || "bg-background text-text-secondary"}`}
                  >
                    {item.status || "unknown"}
                  </span>
                </div>
                <p className="text-text-secondary mt-1 text-sm">
                  {item.crime_type || "Unknown type"} at {item.location || "Unknown location"}
                </p>
                <div className="text-text-secondary mt-2 flex items-center justify-between text-xs">
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
