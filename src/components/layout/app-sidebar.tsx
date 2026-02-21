"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  Compass,
  Settings,
  LogOut,
  HelpCircle,
  UserCircle,
  Sun,
  Moon,
  Monitor,
  ChevronUp,
  BookOpen,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Entdecken", icon: Compass },
  { href: "/create", label: "Erstellen", icon: PlusCircle },
  { href: "/community", label: "Community", icon: Users },
  { href: "/kapiert", label: "Kapiert?", icon: HelpCircle },
];

type Theme = "light" | "dark" | "system";

function applyThemeToDOM(t: Theme) {
  const root = document.documentElement;
  localStorage.setItem("synapze-theme", t);
  if (t === "dark") {
    root.classList.add("dark");
  } else if (t === "light") {
    root.classList.remove("dark");
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

const schuljahreMap: Record<string, string> = {
  ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`klasse-${i + 1}`, `Klasse ${i + 1}`])),
  "berufsschule": "Berufsschule",
  "studium-1": "1. Semester",
  "studium-2": "2. Semester",
  "studium-3": "3. Semester",
  "studium-4": "4. Semester",
  "studium-5": "5. Semester",
  "studium-6": "6. Semester",
  "studium-hoeher": "7.+ Semester",
};

export function AppSidebar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [profileName, setProfileName] = useState("Mert Basol");
  const [profileJahr, setProfileJahr] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load theme
    const storedTheme = localStorage.getItem("synapze-theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      applyThemeToDOM(storedTheme);
    }

    // Load profile
    const stored = localStorage.getItem("synapze-profile");
    if (stored) {
      const p = JSON.parse(stored);
      if (p.name) setProfileName(p.name);
      if (p.schuljahr && schuljahreMap[p.schuljahr]) {
        setProfileJahr(schuljahreMap[p.schuljahr]);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleTheme = (t: Theme) => {
    setTheme(t);
    applyThemeToDOM(t);
  };

  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MB";

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo — links to dashboard */}
      <Link href="/dashboard" className="flex h-16 items-center border-b px-5 hover:opacity-80 transition-opacity">
        <p className="text-lg font-extrabold tracking-tight text-foreground">Synapze</p>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Onboarding re-trigger */}
        <div className="mt-auto pt-3">
          <div className="h-px bg-border mb-3" />
          <button
            onClick={() => window.dispatchEvent(new Event("synapze:show-onboarding"))}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-violet-400" />
            Warum anders lernen?
          </button>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Einstellungen
        </Link>

        {/* Profile dropdown trigger */}
        <div className="relative mt-1" ref={dropdownRef}>

          {/* ── Dropdown Panel (opens upward) ── */}
          {dropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border bg-popover shadow-2xl ring-1 ring-black/5">

              {/* Profile header */}
              <div className="flex items-center gap-3 bg-muted/40 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{profileName}</p>
                  {profileJahr ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {profileJahr}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Noch kein Schuljahr</p>
                  )}
                </div>
              </div>

              {/* Konto verwalten */}
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                Konto verwalten
              </Link>

              {/* Theme toggle */}
              <div className="border-t px-4 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Erscheinungsbild
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { value: "light" as Theme, label: "Hell", Icon: Sun },
                    { value: "dark" as Theme, label: "Dunkel", Icon: Moon },
                    { value: "system" as Theme, label: "System", Icon: Monitor },
                  ] as const).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleTheme(value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-all",
                        theme === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div className="border-t p-2">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </button>
              </div>
            </div>
          )}

          {/* Profile button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
              dropdownOpen
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "bg-muted/60 hover:bg-primary/10 hover:ring-1 hover:ring-primary/30"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold">{profileName}</p>
              <p className="text-xs text-muted-foreground">🔥 3 Tage Streak</p>
            </div>
            <ChevronUp
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                !dropdownOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
