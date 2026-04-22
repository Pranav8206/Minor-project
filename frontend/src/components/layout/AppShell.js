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

const getTopBarTitle = (pathname) => {
  if (pathname?.startsWith("/cases/") && pathname !== "/cases") {
    return "Case Intelligence View";
  }

  return topBarMap[pathname] || "Control Center";
};

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return (
      <div className="bg-background min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-background text-text-primary min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-400">
        <aside className="hidden w-72 border-r border-border/90 bg-card/90 p-6 backdrop-blur lg:block">
          <div className="mb-10">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.24em]">Operations</p>
            <h1 className="text-text-primary mt-2 text-2xl font-semibold tracking-tight">CIMS</h1>
            <p className="text-text-secondary mt-2 text-xs">Crime Investigation Management System</p>
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
                      ? "bg-primary text-white shadow-lg shadow-orange-800/20"
                      : "text-text-secondary hover:bg-orange-50 hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 px-4 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">CIMS</p>
                <h2 className="text-text-primary mt-1 text-xl font-semibold">{getTopBarTitle(pathname)}</h2>
              </div>
              <Link
                href="/login"
                className="text-text-secondary rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:text-text-primary"
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
