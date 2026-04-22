"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/heatmap", label: "Heatmap" },
  { href: "/add-case", label: "Add Case" },
  { href: "/search", label: "Search" },
];

const topBarMap = {
  "/dashboard": "Investigation Dashboard",
  "/cases": "Case List",
  "/heatmap": "Crime Heatmap",
  "/add-case": "Create New Case",
  "/search": "Intelligent Search",
  "/login": "Sign In",
};

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,#fceccf_0%,#f9f2e2_28%,#edf2ff_72%,#dce7ff_100%)]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8f3ff_0%,#f4f7ff_35%,#f8f4ef_100%)] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-400">
        <aside className="hidden w-72 border-r border-slate-200/70 bg-white/80 p-6 backdrop-blur lg:block">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ops Panel</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">CasePulse</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Police Investigation System</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{topBarMap[pathname] || "Control Center"}</h2>
              </div>
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Switch Account
              </Link>
            </div>
          </header>

          <section className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</section>
        </main>
      </div>
    </div>
  );
}
