"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Search,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/add-case", label: "Add Case", icon: Plus },
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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (pathname === "/login" || pathname === "/register") {
    return (
      <div className="bg-background min-h-screen">
        {children}
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-background text-text-primary min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-400">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-20 border-r border-border/90 bg-card/90 p-4 backdrop-blur flex flex-col">
          <div className="flex flex-col items-center gap-2 mb-8 pb-6 border-b border-border/50">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <p className="text-text-secondary text-xs font-semibold text-center">CIMS</p>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-3 transition ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-orange-800/20"
                      : "text-text-secondary hover:bg-orange-50 hover:text-text-primary"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-text-secondary hover:bg-red-50 hover:text-red-600 transition mt-auto"
          >
            <LogOut size={20} />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </aside>

        {/* Mobile Header + Sidebar Toggle */}
        <div className="lg:hidden w-full flex flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 px-4 py-4 backdrop-blur flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-orange-50 rounded-lg transition"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">CIMS</p>
              <h2 className="text-text-primary text-lg font-semibold">{getTopBarTitle(pathname)}</h2>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
            >
              <LogOut size={20} />
            </button>
          </header>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <aside className="border-b border-border/90 bg-card/90 backdrop-blur">
              <nav className="flex flex-col gap-2 p-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-orange-800/20"
                          : "text-text-secondary hover:bg-orange-50 hover:text-text-primary"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          )}
        </div>

        {/* Desktop Main Content */}
        <main className="hidden lg:flex min-h-screen flex-1 flex-col w-full">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-card/90 px-8 py-4 backdrop-blur flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">CIMS</p>
              <h2 className="text-text-primary text-xl font-semibold">{getTopBarTitle(pathname)}</h2>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </header>

          <section className="flex-1 px-8 py-8 overflow-y-auto">{children}</section>
        </main>

        {/* Mobile Main Content */}
        <main className="lg:hidden flex-1 flex flex-col w-full">
          <section className="flex-1 px-4 py-6 overflow-y-auto">{children}</section>
        </main>
      </div>
    </div>
  );
}
