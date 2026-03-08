"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, BookOpen, Brain, RefreshCw, Target } from "lucide-react";
import { getAllDecks, getAllSRSStates } from "@/lib/store";
import type { SRSState } from "@/lib/srs";

interface CardSnapshot extends SRSState {
  deckId: string;
  cardId: string;
}

export default function StatsPage() {
  const [snapshots, setSnapshots] = useState<CardSnapshot[]>([]);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => {
    const allDecks = getAllDecks();
    const total = allDecks.reduce((sum, d) => sum + d.cards.length, 0);
    setTotalCards(total);

    const store = getAllSRSStates();
    const list: CardSnapshot[] = Object.entries(store).map(([key, state]) => {
      const [deckId, cardId] = key.split(":") as [string, string];
      return { ...state, deckId, cardId };
    });
    setSnapshots(list);
  }, []);

  // ── Metrics ────────────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const reviewed = snapshots.length;
  const newCards = totalCards - reviewed;

  const dueToday =
    newCards +
    snapshots.filter((s) => {
      if (s.due.includes("T")) return new Date(s.due) <= new Date();
      return s.due <= todayStr;
    }).length;

  const totalReps   = snapshots.reduce((sum, s) => sum + s.reps, 0);
  const totalLapses = snapshots.reduce((sum, s) => sum + s.lapses, 0);
  const retention   = totalReps > 0 ? ((totalReps - totalLapses) / totalReps) * 100 : 0;

  // ── Card-state distribution ────────────────────────────────────────────────

  const stateCounts = {
    new:        newCards,
    learning:   snapshots.filter((s) => s.cardState === "learning").length,
    review:     snapshots.filter((s) => s.cardState === "review").length,
    relearning: snapshots.filter((s) => s.cardState === "relearning").length,
  };

  // ── Scheduling forecast (next 30 days) ────────────────────────────────────

  const forecast = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = snapshots.filter((s) => s.due.slice(0, 10) === dateStr).length;
    return { day: i, count: i === 0 ? count + newCards : count };
  });
  const maxForecast = Math.max(...forecast.map((f) => f.count), 1);

  // ── Stability histogram ────────────────────────────────────────────────────

  const stabilityBuckets = [
    { label: "<1T",   min: 0,   max: 1,        color: "bg-sky-400" },
    { label: "1-7T",  min: 1,   max: 7,        color: "bg-blue-500" },
    { label: "7-30T", min: 7,   max: 30,       color: "bg-indigo-500" },
    { label: "1-3M",  min: 30,  max: 90,       color: "bg-violet-500" },
    { label: "3M+",   min: 90,  max: Infinity, color: "bg-purple-600" },
  ].map((b) => ({
    ...b,
    count: snapshots.filter((s) => s.stability >= b.min && s.stability < b.max).length,
  }));
  const maxStab = Math.max(...stabilityBuckets.map((b) => b.count), 1);

  // ── Difficulty distribution (1–10) ────────────────────────────────────────

  const diffBuckets = Array.from({ length: 10 }, (_, i) => ({
    label: String(i + 1),
    count: snapshots.filter((s) => Math.round(s.difficulty) === i + 1).length,
  }));
  const maxDiff = Math.max(...diffBuckets.map((b) => b.count), 1);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Statistiken</h1>
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { label: "Karten gesamt",   value: totalCards,                icon: BookOpen,  color: "text-blue-500",   bg: "bg-blue-500/10"   },
          { label: "Heute fällig",    value: dueToday,                  icon: Target,    color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Wiederholungen",  value: totalReps,                 icon: RefreshCw, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Erinnerungsrate", value: `${retention.toFixed(0)}%`, icon: Brain,     color: "text-green-500",  bg: "bg-green-500/10"  },
        ] as const).map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border bg-card p-4 flex flex-col gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Status + Stabilität ──────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">

        {/* Card-state bars */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Kartenstatus</h2>
          <div className="space-y-3">
            {([
              { label: "Neu",          count: stateCounts.new,        color: "bg-sky-500"    },
              { label: "Lernen",       count: stateCounts.learning,   color: "bg-amber-500"  },
              { label: "Wiederholen",  count: stateCounts.review,     color: "bg-green-500"  },
              { label: "Neu lernen",   count: stateCounts.relearning, color: "bg-red-500"    },
            ] as const).map(({ label, count, color }) => {
              const pct = totalCards > 0 ? (count / totalCards) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-[84px] text-xs text-muted-foreground shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-7 text-xs text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>

          {/* simple legend total */}
          <p className="mt-4 text-xs text-muted-foreground">
            {reviewed} von {totalCards} Karten bereits gelernt
          </p>
        </div>

        {/* Stability histogram */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Stabilität</h2>
          <div className="flex items-end gap-2 h-28">
            {stabilityBuckets.map(({ label, count, color }) => {
              const pct = (count / maxStab) * 100;
              return (
                <div key={label} className="flex flex-col items-center flex-1 gap-1.5 h-full justify-end">
                  {count > 0 && (
                    <span className="text-[11px] font-medium text-muted-foreground">{count}</span>
                  )}
                  <div
                    className={`w-full rounded-t-md ${color} transition-all duration-500`}
                    style={{ height: `${Math.max(pct * 0.75, count > 0 ? 4 : 0)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Zeitraum bis zur nächsten Wiederholung (in Tagen)
          </p>
        </div>
      </div>

      {/* ── Forecast ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5 mb-4">
        <h2 className="text-sm font-semibold mb-1">Zeitplanung</h2>
        <p className="text-xs text-muted-foreground mb-4">Fällige Karten in den nächsten 30 Tagen</p>
        <div className="flex items-end gap-px h-28">
          {forecast.map(({ day, count }) => {
            const pct = (count / maxForecast) * 100;
            const isToday = day === 0;
            return (
              <div
                key={day}
                title={`${day === 0 ? "Heute" : `+${day} T`}: ${count} Karten`}
                className={`flex-1 rounded-t-sm transition-all duration-300 ${isToday ? "bg-primary" : "bg-primary/35"}`}
                style={{ height: `${Math.max(pct * 0.85, count > 0 ? 3 : 0)}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>Heute</span>
          <span>+30 Tage</span>
        </div>
      </div>

      {/* ── Difficulty ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-sm font-semibold mb-1">Schwierigkeitsgrad</h2>
        <p className="text-xs text-muted-foreground mb-4">Verteilung (FSRS 1–10)</p>
        <div className="flex items-end gap-1.5 h-24">
          {diffBuckets.map(({ label, count }) => {
            const pct = (count / maxDiff) * 100;
            // Color from green (easy=1) to red (hard=10)
            const idx = Number(label) - 1;
            const colors = [
              "bg-green-500", "bg-green-400", "bg-lime-400", "bg-yellow-400",
              "bg-amber-400", "bg-orange-400", "bg-orange-500", "bg-red-400",
              "bg-red-500", "bg-red-600",
            ];
            return (
              <div key={label} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                {count > 0 && (
                  <span className="text-[10px] text-muted-foreground">{count}</span>
                )}
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${colors[idx]}`}
                  style={{ height: `${Math.max(pct * 0.7, count > 0 ? 4 : 0)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Einfach</span>
          <span>Schwer</span>
        </div>
      </div>

      {/* ── Bottom stats ─────────────────────────────────────────────────────── */}
      {reviewed > 0 && (
        <div className="mt-4 rounded-2xl border bg-card p-5 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{totalReps}</div>
            <div className="text-xs text-muted-foreground mt-1">Gesamt-Wdh.</div>
          </div>
          <div>
            <div className="text-xl font-bold">{totalLapses}</div>
            <div className="text-xs text-muted-foreground mt-1">Aussetzer</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-500">{retention.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Erinnerungsrate</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCards === 0 && (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Noch keine Karten vorhanden.</p>
          <Link href="/create" className="mt-2 inline-block text-primary hover:underline text-sm">
            Erstes Deck erstellen →
          </Link>
        </div>
      )}
    </div>
  );
}
