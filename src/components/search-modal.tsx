"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Compass,
  LayoutDashboard,
  PlusCircle,
  Users,
  HelpCircle,
  Settings,
  UserCircle,
  Brain,
  Calendar,
  Clock,
  Timer,
  Shuffle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { decks, TODAY } from "@/lib/data";
import type { LucideIcon } from "lucide-react";

// ─── Chip helpers ──────────────────────────────────────────────────────────────

type Chip = "due" | "new" | "hard" | "suspended";

const chipCfg: { key: Chip; label: string; icon: string }[] = [
  { key: "due",       label: "Fällig",     icon: "🕐" },
  { key: "new",       label: "Neu",         icon: "🆕" },
  { key: "hard",      label: "Schwierig",   icon: "💀" },
  { key: "suspended", label: "Ausgesetzt",  icon: "⏸" },
];

function deckChipCount(deckId: string, chip: Chip): number {
  const deck = decks.find(d => d.id === deckId);
  if (!deck) return 0;
  switch (chip) {
    case "due":       return deck.cards.filter(c => c.dueDate && c.dueDate <= TODAY).length;
    case "new":       return deck.cards.filter(c => (c.status ?? "new") === "new").length;
    case "hard":      return deck.cards.filter(c => (c.lapses ?? 0) >= 3 || (c.ease ?? 2.5) < 2.0).length;
    case "suspended": return deck.cards.filter(c => c.status === "suspended").length;
  }
}

function chipDesc(deckId: string, chip: Chip, fallbackDesc: string): string {
  const count = deckChipCount(deckId, chip);
  const labels: Record<Chip, string> = { due: "fällige Karten", new: "neue Karten", hard: "schwierige Karten", suspended: "ausgesetzte Karten" };
  return `${count} ${labels[chip]} · ${fallbackDesc.split("·")[1]?.trim() ?? ""}`;
}

// ─── Search index ─────────────────────────────────────────────────────────────

type ResultType = "page" | "deck" | "feature";

interface SearchItem {
  type: ResultType;
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  emoji?: string;
  keywords: string[];
}

const staticItems: SearchItem[] = [
  // Pages
  {
    type: "page", title: "Entdecken", desc: "Startseite & Lernwissenschaft",
    href: "/", icon: Compass,
    keywords: ["entdecken", "startseite", "home", "landing", "lernwissenschaft", "warum lernen"],
  },
  {
    type: "page", title: "Dashboard", desc: "Übersicht, Streak & Heatmap",
    href: "/dashboard", icon: LayoutDashboard,
    keywords: ["dashboard", "übersicht", "streak", "heatmap", "fortschritt", "aktivität"],
  },
  {
    type: "page", title: "Deck erstellen", desc: "Neue Karteikarten anlegen",
    href: "/create", icon: PlusCircle,
    keywords: ["erstellen", "neu", "deck", "karten", "anlegen", "create", "karteikarten", "neues deck"],
  },
  {
    type: "page", title: "Community", desc: "Decks teilen & Lerngruppen",
    href: "/community", icon: Users,
    keywords: ["community", "teilen", "lerngruppen", "decks", "gruppen", "bestenliste", "leaderboard"],
  },
  {
    type: "page", title: "Kapiert?", desc: "Hilfe & Anleitung",
    href: "/kapiert", icon: HelpCircle,
    keywords: ["kapiert", "hilfe", "anleitung", "erklärung", "tutorial", "wie funktioniert"],
  },
  {
    type: "page", title: "Einstellungen", desc: "App-Einstellungen",
    href: "/settings", icon: Settings,
    keywords: ["einstellungen", "settings", "konfiguration", "thema", "hell", "dunkel"],
  },
  {
    type: "page", title: "Profil", desc: "Konto & persönliche Daten",
    href: "/profile", icon: UserCircle,
    keywords: ["profil", "konto", "account", "name", "schuljahr", "klasse", "semester"],
  },
  // Features
  {
    type: "feature", title: "Active Recall", desc: "Abrufen statt passives Lesen — Synapzen wachsen",
    href: "/", icon: Brain,
    keywords: ["active recall", "abrufen", "aktiv lernen", "erinnerung", "testen"],
  },
  {
    type: "feature", title: "Spaced Repetition", desc: "Optimale Wiederholungsintervalle automatisch",
    href: "/", icon: Calendar,
    keywords: ["spaced repetition", "wiederholen", "intervalle", "vergessen", "ebbinghaus"],
  },
  {
    type: "feature", title: "Feynman-Technik", desc: "KI erklärt jeden Begriff auf Level 1–3",
    href: "/", icon: HelpCircle,
    keywords: ["feynman", "erklären", "verstehen", "niveau", "level", "ki erklärung"],
  },
  {
    type: "feature", title: "Pomodoro-Timer", desc: "Fokus-Sessions mit eingebautem Timer",
    href: "/", icon: Timer,
    keywords: ["pomodoro", "timer", "fokus", "pause", "session", "25 minuten"],
  },
  {
    type: "feature", title: "Interleaved Practice", desc: "Themen mischen für besseres Lernen",
    href: "/", icon: Shuffle,
    keywords: ["interleaved", "mischen", "themen", "practice", "gemischt"],
  },
  {
    type: "feature", title: "Parkinsons Gesetz", desc: "Zeitdruck macht aus 3 Stunden 30 Minuten",
    href: "/", icon: Clock,
    keywords: ["parkinson", "zeitdruck", "effizienz", "deadline", "zeit"],
  },
];

const typeLabel: Record<ResultType, string> = {
  page: "Seiten",
  deck: "Meine Decks",
  feature: "Lernmethoden",
};

const chipTypeLabel: Record<Chip, string> = {
  due:       "Fällige Decks",
  new:       "Decks mit neuen Karten",
  hard:      "Schwierige Karten",
  suspended: "Decks mit ausgesetzten Karten",
};

const typeOrder: ResultType[] = ["page", "deck", "feature"];

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [activeChip, setActiveChip] = useState<Chip | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build deck items (chip-aware)
  const baseDeckItems: SearchItem[] = decks.map((d) => ({
    type: "deck" as ResultType,
    title: d.title,
    desc: `${d.cards.length} Karten · ${d.category}`,
    href: `/study/${d.id}`,
    icon: BookOpen,
    emoji: d.emoji,
    keywords: [d.title.toLowerCase(), d.category.toLowerCase(), d.description.toLowerCase()],
  }));

  const deckItems: SearchItem[] = activeChip
    ? baseDeckItems
        .filter(item => deckChipCount(decks.find(d => d.title === item.title)?.id ?? "", activeChip) > 0)
        .map(item => ({
          ...item,
          desc: chipDesc(decks.find(d => d.title === item.title)?.id ?? "", activeChip, item.desc),
        }))
    : baseDeckItems;

  const allItems = activeChip
    ? deckItems  // only deck results when chip active
    : [...staticItems, ...deckItems];

  // Filter
  const filtered = query.trim().length === 0
    ? allItems
    : allItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
        );
      });

  // Group by type
  const grouped = typeOrder
    .map((type) => ({ type, items: filtered.filter((i) => i.type === type) }))
    .filter((g) => g.items.length > 0);

  // Flat list for keyboard nav
  const flatItems = grouped.flatMap((g) => g.items);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setFocusedIndex(0);
      setActiveChip(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset focus on query change
  useEffect(() => {
    setFocusedIndex(0);
  }, [query]);

  const navigate = useCallback(
    (item: SearchItem) => {
      router.push(item.href);
      onClose();
    },
    [router, onClose]
  );

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[focusedIndex];
        if (item) navigate(item);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatItems, focusedIndex, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 overflow-hidden rounded-2xl border bg-background shadow-2xl">

        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen oder fragen…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex items-center gap-1.5 border-b px-4 py-2 overflow-x-auto scrollbar-none">
          {chipCfg.map(({ key, label, icon }) => {
            const isActive = activeChip === key;
            const total = decks.reduce((s, d) => s + deckChipCount(d.id, key), 0);
            return (
              <button
                key={key}
                onClick={() => { setActiveChip(isActive ? null : key); setFocusedIndex(0); }}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <span>{icon}</span>
                {label}
                <span className={cn(
                  "rounded-full px-1 text-[9px]",
                  isActive ? "bg-white/20" : "bg-muted"
                )}>{total}</span>
              </button>
            );
          })}
          <Link
            href="/browse"
            onClick={onClose}
            className="ml-auto shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Browser öffnen →
          </Link>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {flatItems.length === 0 && query.trim() ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Keine Ergebnisse für „{query}"</p>
            </div>
          ) : (
            grouped.map((group) => {
              // Calculate offset in flatItems for correct focusedIndex mapping
              const groupOffset = flatItems.indexOf(group.items[0]);
              return (
                <div key={group.type}>
                  <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {activeChip && group.type === "deck" ? chipTypeLabel[activeChip] : typeLabel[group.type]}
                  </p>
                  {group.items.map((item, i) => {
                    const flatIdx = groupOffset + i;
                    const isFocused = flatIdx === focusedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={`${item.href}-${item.title}`}
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setFocusedIndex(flatIdx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isFocused ? "bg-primary/8 text-foreground" : "hover:bg-muted/50"
                        )}
                      >
                        {/* Icon or emoji */}
                        {item.emoji ? (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                            {item.emoji}
                          </span>
                        ) : (
                          <span className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            isFocused ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>

                        {isFocused && (
                          <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}

          {/* ── KI-Sektion ── */}
          <div className="border-t">
            <div className="px-4 py-3">
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <Sparkles className="h-4 w-4 text-violet-400" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  {query.trim() ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        KI fragen: „{query}"
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        KI-Antworten kommen bald — Thaura.ai wird integriert.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">KI-Assistent</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Stell eine Frage — z.B. „Erkläre mir Spaced Repetition einfach"
                      </p>
                    </>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                  Bald
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">↑</kbd>
            <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">↓</kbd>
            Navigieren
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">↵</kbd>
            Öffnen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 py-0.5 text-[10px]">Esc</kbd>
            Schließen
          </span>
        </div>
      </div>
    </div>
  );
}
