"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { SearchModal } from "@/components/search-modal";
import { Pomodoro } from "@/components/Pomodoro";
import {
  Compass,
  PlusCircle,
  Table2,
  Users,
  HelpCircle,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  UserCircle,
  LogOut,
  BookOpen,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/",          icon: Compass,   label: "Entdecken"  },
  { href: "/create",    icon: PlusCircle,label: "Erstellen"  },
  { href: "/browse",    icon: Table2,    label: "Browser"    },
  { href: "/notes",     icon: BookOpen,  label: "Notizen"    },
  { href: "/community", icon: Users,     label: "Community"  },
  { href: "/kapiert",   icon: HelpCircle,label: "Kapiert?"   },
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

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [profileName, setProfileName] = useState("Mert Basol");
  const [profileJahr, setProfileJahr] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("synapze-theme") as Theme | null;
    if (storedTheme) { setTheme(storedTheme); applyThemeToDOM(storedTheme); }
    const stored = localStorage.getItem("synapze-profile");
    if (stored) {
      const p = JSON.parse(stored);
      if (p.name) setProfileName(p.name);
      if (p.schuljahr && schuljahreMap[p.schuljahr]) setProfileJahr(schuljahreMap[p.schuljahr]);
    }
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const initials = profileName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "MB";
  const handleTheme = (t: Theme) => { setTheme(t); applyThemeToDOM(t); };

  return (
    <>
    <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    <Pomodoro isOpen={pomodoroOpen} onClose={() => setPomodoroOpen(false)} />
    <header className="flex h-14 items-center gap-3 border-b bg-background/95 px-5 backdrop-blur-sm">

      {/* Logo — links to dashboard */}
      <Link
        href="/dashboard"
        className="font-extrabold tracking-tight text-sm hover:opacity-70 transition-opacity mr-2"
      >
        Synapze
      </Link>

      {/* ── Nav icons ── */}
      <nav className="flex items-center gap-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={isActive ? 2.2 : 1.75}
              />
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* ── Pomodoro ── */}
      <button
        title="Pomodoro-Timer"
        onClick={() => setPomodoroOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
      >
        <Timer className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>

      {/* ── Search ── */}
      <button
        title="Suchen (⌘K)"
        onClick={() => setSearchOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
      >
        <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] opacity-60">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* ── Notifications ── */}
      <div className="relative">
        <button
          title="Benachrichtigungen"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
          2
        </Badge>
      </div>

      {/* ── Profile avatar + dropdown ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-primary transition-all",
            dropdownOpen
              ? "bg-primary/20 ring-2 ring-primary/40"
              : "bg-primary/15 hover:bg-primary/25"
          )}
        >
          {initials}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border bg-popover shadow-2xl ring-1 ring-black/5 z-50">

            {/* Profile header */}
            <div className="flex items-center gap-3 bg-muted/40 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-foreground text-sm">{profileName}</p>
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
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
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
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
