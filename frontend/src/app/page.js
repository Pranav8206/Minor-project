"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const subscribeAuth = (onStoreChange) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("focus", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("focus", handler);
  };
};

const getAuthSnapshot = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem("token"));
};

export default function Home() {
  const hasToken = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => false);

  return (
    <div className="min-h-screen bg-radial-[140%_90%_at_50%_10%] from-orange-100 via-background to-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 text-lg font-bold text-white">
              C
            </span>
            <span className="text-text-primary text-lg font-semibold tracking-tight">CIMS</span>
          </Link>

          {hasToken ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary/35 hover:text-text-primary"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6">
        <section className="rounded-3xl border border-border/70 bg-linear-to-br from-orange-700 via-orange-600 to-amber-600 p-8 text-white shadow-lg shadow-orange-900/20 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-50/90">Crime Investigation Management System</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Investigate Faster. Coordinate Better. Close Cases with Confidence.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-orange-50/95 sm:text-base">
            CIMS helps investigation teams manage cases, suspects, evidence, and timelines in one focused workspace with AI-assisted search and recommendations.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {hasToken ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="cims-card p-6">
            <h2 className="text-text-primary text-base font-semibold">Case-Centric Workflow</h2>
            <p className="text-text-secondary mt-2 text-sm">Track case details, priorities, suspects, and timeline updates in one structured interface.</p>
          </article>
          <article className="cims-card p-6">
            <h2 className="text-text-primary text-base font-semibold">Evidence + AI Search</h2>
            <p className="text-text-secondary mt-2 text-sm">Attach evidence and discover related cases faster with natural-language similarity search.</p>
          </article>
          <article className="cims-card p-6">
            <h2 className="text-text-primary text-base font-semibold">Actionable Insights</h2>
            <p className="text-text-secondary mt-2 text-sm">Use recommendations, risk indicators, and location patterns to guide next investigative steps.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
