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
    <div className="min-h-screen bg-radial-[140%_90%_at_50%_10%] from-card via-background to-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
              C
            </span>
            <span className="text-text-primary text-lg font-semibold tracking-tight">CIMS</span>
          </Link>

          {hasToken ? (
            <Link
              href="/dashboard"
              className="cims-button-primary text-sm"
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
                className="cims-button-primary text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6">
        <section className="rounded-3xl border border-border bg-card p-8 shadow-lg shadow-black/20 sm:p-10">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">Crime Investigation Management System</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Investigate Faster. Coordinate Better. Close Cases with Confidence.
          </h1>
          <p className="text-text-secondary mt-4 max-w-2xl text-sm sm:text-base">
            CIMS helps investigation teams manage cases, suspects, evidence, and timelines in one focused workspace with AI-assisted search and recommendations.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {hasToken ? (
              <Link
                href="/dashboard"
                className="cims-button-primary text-sm"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="cims-button-primary text-sm"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="cims-button-muted text-sm"
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
