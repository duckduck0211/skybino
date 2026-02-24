"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  ClipboardList,
  Users,
  BookOpen,
  Zap,
  ChevronDown,
  MoreHorizontal,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllDecks } from "@/lib/store";
import type { Deck } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "decks" | "ordner" | "tests" | "gruppen";

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60">
        <Icon className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href={actionHref}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

// ─── Deck Card ────────────────────────────────────────────────────────────────

function DeckCard({ deck }: { deck: Deck }) {
  const mastered = deck.masteredCount ?? 0;
  const total = deck.cards.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
      {/* Emoji + title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl", deck.color ?? "bg-violet-500")}>
            {deck.emoji ?? "📚"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-snug">{deck.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total} Karten · {deck.category}
            </p>
          </div>
        </div>
        <button className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{mastered} gemeistert</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/study/${deck.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <Play className="h-3.5 w-3.5" />
          Lernen
        </Link>
        <Link
          href={`/quiz/${deck.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:bg-muted"
        >
          <Zap className="h-3.5 w-3.5" />
          Quiz
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("decks");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [filter, setFilter] = useState<"alle" | "von-dir">("von-dir");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setDecks(getAllDecks());
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "decks",   label: "Decks",        icon: BookOpen      },
    { id: "ordner",  label: "Ordner",        icon: FolderOpen    },
    { id: "tests",   label: "Übungstests",   icon: ClipboardList },
    { id: "gruppen", label: "Lerngruppen",   icon: Users         },
  ];

  const filterLabels: Record<typeof filter, string> = {
    "alle":    "Alle",
    "von-dir": "Von dir",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deine Bibliothek</h1>
        <Link
          href="/create"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Erstellen
        </Link>
      </div>

      {/* ── Tab bar ── */}
      <div className="border-b">
        <nav className="flex gap-0">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-all",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Filter row (only on Decks tab) ── */}
      {tab === "decks" && decks.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className="flex items-center gap-1.5 rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-all hover:bg-muted"
          >
            {filterLabels[filter]}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full z-10 mt-1.5 w-36 overflow-hidden rounded-xl border bg-popover shadow-lg">
              {(["von-dir", "alle"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setFilterOpen(false); }}
                  className={cn(
                    "flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                    filter === f && "font-semibold text-primary"
                  )}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab content ── */}

      {/* DECKS */}
      {tab === "decks" && (
        decks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Du hast noch keine Decks erstellt"
            description="Erstelle ein Deck, um deine Lernkarten zu organisieren."
            actionLabel="Deck erstellen"
            actionHref="/create"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
            {/* Add deck tile */}
            <Link
              href="/create"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted py-10 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Neues Deck</span>
            </Link>
          </div>
        )
      )}

      {/* ORDNER */}
      {tab === "ordner" && (
        <EmptyState
          icon={FolderOpen}
          title="Du hast noch keine Ordner erstellt"
          description="Erstelle einen Ordner, um deine Lernsets zu organisieren."
          actionLabel="Ordner erstellen"
          actionHref="#"
        />
      )}

      {/* ÜBUNGSTESTS */}
      {tab === "tests" && (
        <EmptyState
          icon={ClipboardList}
          title="Du hast noch keine Übungstests"
          description="Erstelle einen Übungstest aus deinen Lernkarten."
          actionLabel="Übungstest erstellen"
          actionHref="#"
        />
      )}

      {/* LERNGRUPPEN */}
      {tab === "gruppen" && (
        <EmptyState
          icon={Users}
          title="Du bist noch keiner Lerngruppe beigetreten"
          description="Lerne gemeinsam mit anderen und tausche Lernsets aus."
          actionLabel="Lerngruppe erstellen"
          actionHref="/community"
        />
      )}
    </div>
  );
}
