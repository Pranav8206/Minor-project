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
  Bell,
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

const getUserDisplayData = () => {
  if (typeof window === "undefined") {
    return {
      name: "Officer",
      rank: "Detective",
      department: "Investigations",
      initials: "OF",
    };
  }

  const storedUser = window.localStorage.getItem("user");

  if (!storedUser) {
    return {
      name: "Officer",
      rank: "Detective",
      department: "Investigations",
      initials: "OF",
    };
  }

  try {
    const parsed = JSON.parse(storedUser);
    const name = parsed?.name || "Officer";
    const role = parsed?.role || "user";
    const rank = role === "admin" ? "Chief Investigator" : "Detective";
    const department = role === "admin" ? "Major Crimes" : "Homicide";
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

    return {
      name,
      rank,
      department,
      initials: initials || "OF",
    };
  } catch {
    return {
      name: "Officer",
      rank: "Detective",
      department: "Investigations",
      initials: "OF",
    };
  }
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userProfile = getUserDisplayData();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
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
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden w-25 shrink-0 border-r border-border/90 bg-card/90 p-4 backdrop-blur lg:flex lg:flex-col">
          <div className="flex flex-col items-center gap-2 mb-8 pb-6 border-b border-border/50">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
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
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-background hover:text-text-primary"
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
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-text-secondary hover:bg-background hover:text-text-primary transition mt-auto"
          >
            <LogOut size={20} />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar backdrop"
            />
            <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-border/90 bg-card p-4 backdrop-blur">
              <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <span className="text-lg font-bold text-white">C</span>
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-semibold">CIMS</p>
                    <p className="text-text-secondary text-xs">Navigation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text-primary"
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
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
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:bg-background hover:text-text-primary"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-6 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-text-secondary transition hover:bg-background hover:text-text-primary"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </aside>
          </div>
        ) : null}

        {/* Desktop Main Content */}
        <main className="min-h-screen w-full min-w-0 flex-1 lg:flex lg:flex-col">
          <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 px-4 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-background rounded-lg transition"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">CIMS</p>
                <h2 className="text-text-primary text-lg font-semibold">{getTopBarTitle(pathname)}</h2>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-background rounded-lg transition text-text-secondary"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>

          <header className="sticky top-0 z-20 hidden border-b border-border/80 bg-card/90 px-6 py-2 backdrop-blur lg:block xl:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
               
                <h2 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
                  {getTopBarTitle(pathname)}
                </h2>
              </div>

              <div className="flex items-center gap-3 self-start">
                

                <div className="flex items-center gap-3  px-3 py-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-sm font-semibold text-text-primary">
                    {userProfile.initials}
                  </div>
                  <div>
                    <p className="text-text-primary text-xl font-medium leading-tight">{userProfile.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-5 lg:px-6 lg:py-8 xl:px-8">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
