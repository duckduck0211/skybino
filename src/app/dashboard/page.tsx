"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Zap, Target, Plus, Flame, Shield, Trophy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decks, type Deck } from "@/lib/data";
import { getAllDecks } from "@/lib/store";
import { KalenderTab } from "@/components/dashboard/KalenderTab";
import { TodoTab } from "@/components/dashboard/TodoTab";
import { RetroTab } from "@/components/dashboard/RetroTab";
import { CoverQuoteWidget } from "@/components/dashboard/CoverQuoteWidget";
import { WeeksOfLife } from "@/components/WeeksOfLife";


// ─── Mock heatmap data (last 16 weeks) ────────────────────────────────────────

interface HeatCell {
  date: string;       // "12. Feb."
  fullDate: string;   // "Freitag, 12. Februar 2026"
  level: 0 | 1 | 2 | 3 | 4;
  cards: number;      // exact cards learned that day
}

// Deterministic card count per level (varied by index)
function cardsForLevel(level: number, i: number): number {
  if (level === 0) return 0;
  const base = [0, 5, 16, 31, 52][level];
  const range = [0, 10, 14, 18, 24][level];
  return base + ((i * 13 + 7) % (range + 1));
}

function generateHeatmapData(): HeatCell[] {
  const today = new Date();
  const cells: HeatCell[] = [];
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 111);

  const activitySeeds = [
    0,0,1,0,2,0,0,
    0,1,0,0,3,0,0,
    2,0,0,1,0,2,0,
    0,0,3,0,0,1,0,
    1,2,0,0,2,0,0,
    0,1,0,2,0,0,1,
    2,0,1,0,3,1,0,
    0,0,2,1,0,2,0,
    1,3,0,2,1,0,0,
    2,0,3,0,2,3,0,
    0,2,1,3,2,0,1,
    3,1,0,2,3,1,0,
    2,3,1,2,0,3,2,
    3,2,3,1,2,3,0,
    2,3,2,0,3,2,3,
    0,0,0,0,4,4,4,
  ];

  for (let i = 0; i < 112; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const level = (activitySeeds[i] ?? 0) as 0 | 1 | 2 | 3 | 4;
    const cards = cardsForLevel(level, i);
    cells.push({
      date: d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" }),
      fullDate: d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      level,
      cards,
    });
  }
  return cells;
}

const heatmapData = generateHeatmapData();
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const heatColors = [
  "bg-muted hover:bg-muted/70",
  "bg-violet-200 dark:bg-violet-900 hover:ring-2 hover:ring-violet-300",
  "bg-violet-400 dark:bg-violet-700 hover:ring-2 hover:ring-violet-400",
  "bg-violet-500 hover:ring-2 hover:ring-violet-400",
  "bg-primary hover:ring-2 hover:ring-primary/60",
];

const levelLabels = ["Kein Lernen", "Leicht gelernt", "Gut gelernt", "Viel gelernt", "Top-Tag! 🔥"];

// Split into weeks (columns of 7)
function getWeeks() {
  const weeks: HeatCell[][] = [];
  for (let w = 0; w < 16; w++) {
    weeks.push(heatmapData.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}

const weeks = getWeeks();

// Month labels for the top of the heatmap
function getMonthLabels() {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    const month = firstDay?.date.split(" ")[1] ?? "";
    if (month !== lastMonth) {
      labels.push({ label: month, col: wi });
      lastMonth = month;
    }
  });
  return labels;
}

const monthLabels = getMonthLabels();

// ─── Streak milestones ─────────────────────────────────────────────────────────
const streakMilestones = [
  { days: 7, label: "1 Woche", emoji: "⭐" },
  { days: 30, label: "1 Monat", emoji: "🔥" },
  { days: 100, label: "100 Tage", emoji: "💎" },
  { days: 365, label: "1 Jahr", emoji: "🏆" },
];
const currentStreak = 3;
const nextMilestone = streakMilestones.find((m) => m.days > currentStreak) ?? streakMilestones[0];
const progressToNext = Math.round((currentStreak / nextMilestone.days) * 100);

// ─── Mini To-Do Widget ─────────────────────────────────────────────────────────

interface MiniTodo {
  id: string;
  title: string;
  priority: "hoch" | "mittel" | "niedrig";
  completed: boolean;
}

const priorityOrder: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 };
const priorityDot: Record<string, string> = {
  hoch: "bg-rose-500",
  mittel: "bg-amber-500",
  niedrig: "bg-emerald-500",
};
const priorityBorder: Record<string, string> = {
  hoch: "border-rose-400",
  mittel: "border-amber-400",
  niedrig: "border-emerald-400",
};

function MiniTodoWidget({ onGoToTodo }: { onGoToTodo: () => void }) {
  const [todos, setTodos] = useState<MiniTodo[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("synapze-todos");
    if (raw) setTodos(JSON.parse(raw));
  }, []);

  function toggleTodo(id: string) {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      localStorage.setItem("synapze-todos", JSON.stringify(next));
      return next;
    });
  }

  const sorted = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const incomplete = sorted.filter((t) => !t.completed);
  const completed = sorted.filter((t) => t.completed);
  const display = [...incomplete, ...completed];

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Aufgaben</h3>
        <button
          onClick={onGoToTodo}
          className="text-xs text-primary hover:underline"
        >
          Alle →
        </button>
      </div>

      {display.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Keine Aufgaben vorhanden.{" "}
          <button onClick={onGoToTodo} className="text-primary hover:underline">
            Jetzt erstellen →
          </button>
        </p>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-0.5">
          {display.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-all ${
                todo.completed ? "opacity-40" : "hover:bg-muted/50"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                  todo.completed
                    ? "border-muted-foreground/30 bg-muted-foreground/20"
                    : priorityBorder[todo.priority]
                }`}
              >
                {todo.completed && (
                  <Check className="h-2.5 w-2.5 text-muted-foreground" />
                )}
              </button>

              {/* Title */}
              <span
                className={`flex-1 text-xs leading-snug ${
                  todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {todo.title}
              </span>

              {/* Priority dot (only incomplete) */}
              {!todo.completed && (
                <div
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot[todo.priority]}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "decks" | "aktivitaet" | "kalender" | "todo" | "retro" | "wochen">("overview");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [selectedCell, setSelectedCell] = useState<HeatCell | null>(null);
  const [allDecks, setAllDecks] = useState<Deck[]>(decks);

  useEffect(() => {
    setAllDecks(getAllDecks());
  }, []);

  const categories = useMemo(
    () => ["Alle", ...Array.from(new Set(allDecks.map((d) => d.category)))],
    [allDecks]
  );

  const recentDecks   = allDecks.filter((d) => d.lastStudied);
  const totalCards    = allDecks.reduce((s, d) => s + d.cards.length, 0);
  const totalMastered = allDecks.reduce((s, d) => s + d.masteredCount, 0);

  const filteredDecks =
    selectedCategory === "Alle"
      ? allDecks
      : allDecks.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* ── Cover + Quote ── */}
      <CoverQuoteWidget />

      {/* ── Hero Greeting ── */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-violet-400 p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Guten Morgen,</p>
        <h2 className="mt-0.5 text-3xl font-bold">Mert! 👋</h2>
        <p className="mt-1 text-sm opacity-75">Du hast heute noch nicht gelernt. Leg los!</p>

        <div className="mt-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-lg font-bold leading-none">{currentStreak}</p>
              <p className="text-xs opacity-80">Tage Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <BookOpen className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{allDecks.length}</p>
              <p className="text-xs opacity-80">Decks</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <Zap className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{totalCards}</p>
              <p className="text-xs opacity-80">Karten</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <Target className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{totalMastered}</p>
              <p className="text-xs opacity-80">Gemeistert</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {(
            [
              { id: "overview",    label: "Übersicht" },
              { id: "decks",       label: `Decks (${allDecks.length})` },
              { id: "aktivitaet",  label: "Aktivität" },
              { id: "kalender",    label: "Kalender" },
              { id: "todo",        label: "To-Do" },
              { id: "retro",       label: "Retro" },
              { id: "wochen",      label: "4000 Wochen" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Übersicht ── */}
      {activeTab === "overview" && (() => {
        const decksWithDue = [...allDecks]
          .map((d) => ({ ...d, dueCount: d.cards.length - d.masteredCount }))
          .sort((a, b) => b.dueCount - a.dueCount);
        const totalDue = decksWithDue.reduce((s, d) => s + d.dueCount, 0);

        return (
          <div className="space-y-8">

            {/* ── Quick stats ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: "🔥", label: "Streak", value: `${currentStreak} Tage` },
                { icon: "📚", label: "Decks", value: allDecks.length },
                { icon: "⏳", label: "Zu lernen", value: totalDue, highlight: totalDue > 0 },
                { icon: "✅", label: "Gemeistert", value: totalMastered },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl border p-4 text-center ${
                    s.highlight ? "border-primary/30 bg-primary/5" : "bg-card"
                  }`}
                >
                  <p className="text-2xl">{s.icon}</p>
                  <p className={`mt-1 text-2xl font-black tabular-nums ${s.highlight ? "text-primary" : ""}`}>
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Zu lernen ── */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Zu lernen</h3>
                <span className="text-sm text-muted-foreground">{totalDue} Karten ausstehend</span>
              </div>

              {decksWithDue.filter((d) => d.dueCount > 0).length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 p-8 text-center">
                  <p className="text-3xl">🎉</p>
                  <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">Alles gelernt!</p>
                  <p className="mt-1 text-sm text-muted-foreground">Du hast alle Karten gemeistert. Komm morgen wieder.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {decksWithDue.filter((d) => d.dueCount > 0).map((deck) => (
                    <div
                      key={deck.id}
                      className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span className="text-2xl shrink-0">{deck.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{deck.title}</p>
                          <span className="ml-3 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary tabular-nums">
                            {deck.dueCount} offen
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full ${deck.color} transition-all`}
                            style={{ width: `${Math.round((deck.masteredCount / deck.cards.length) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button asChild size="sm">
                          <Link href={`/study/${deck.id}`}>Lernen</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/quiz/${deck.id}`}>Quiz</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Gemeistert ── */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Gemeistert</h3>
                <span className="text-sm text-muted-foreground">
                  {totalMastered} / {totalCards} Karten
                </span>
              </div>

              {/* Overall progress bar */}
              <div className="mb-4 rounded-2xl border bg-card p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">Gesamtfortschritt</span>
                  <span className="font-bold text-primary tabular-nums">
                    {totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-700"
                    style={{ width: `${totalCards > 0 ? (totalMastered / totalCards) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {totalMastered} gemeistert · {totalDue} noch offen · {totalCards} gesamt
                </p>
              </div>

              {/* Per-deck breakdown for mastered decks */}
              <div className="space-y-2">
                {decksWithDue.filter((d) => d.masteredCount > 0).map((deck) => {
                  const pct = Math.round((deck.masteredCount / deck.cards.length) * 100);
                  return (
                    <div key={deck.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                      <span className="text-xl shrink-0">{deck.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{deck.title}</p>
                          <p className="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                            {deck.masteredCount}/{deck.cards.length}
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full ${deck.color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        );
      })()}

      {/* ── Tab: Aktivität ── */}
      {activeTab === "aktivitaet" && (
        <div className="space-y-6">

          {/* Streak card */}
          <Card className="overflow-hidden border">
            <CardContent className="p-0">
              <div className="flex items-stretch gap-0 border-b">
                <div className="flex flex-col items-center justify-center gap-1 border-r px-8 py-5">
                  <div className="relative">
                    <Flame className="h-12 w-12 text-orange-500 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" fill="currentColor" />
                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                      <span className="text-sm font-black text-white">{currentStreak}</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Tage Streak</p>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-3 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Nächster Meilenstein</p>
                      <p className="text-xs text-muted-foreground">
                        {nextMilestone.emoji} {nextMilestone.label} — noch {nextMilestone.days - currentStreak} Tage
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {streakMilestones.map((m) => (
                        <div key={m.days} title={`${m.label}: ${m.days} Tage`}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all ${
                            currentStreak >= m.days
                              ? "bg-orange-100 dark:bg-orange-900/40 ring-2 ring-orange-400"
                              : "bg-muted opacity-40"
                          }`}>
                          {m.emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{currentStreak} / {nextMilestone.days} Tage</span>
                      <span>{progressToNext}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                        style={{ width: `${progressToNext}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    <span>Streak-Schutz: <span className="font-medium text-foreground">1 verfügbar</span></span>
                  </div>
                </div>
              </div>

              {/* Heatmap */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Lernaktivität</p>
                  <p className="text-xs text-muted-foreground">Letzte 16 Wochen</p>
                </div>
                {selectedCell ? (
                  <div className="mb-4 flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className={`h-8 w-8 shrink-0 rounded-lg ${heatColors[selectedCell.level].split(" ")[0]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{selectedCell.fullDate}</p>
                      <p className="text-xs text-muted-foreground">{levelLabels[selectedCell.level]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {selectedCell.cards > 0 ? (
                        <><p className="text-lg font-bold text-primary leading-none">{selectedCell.cards}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Karten gelernt</p></>
                      ) : <p className="text-sm text-muted-foreground">Kein Lernen</p>}
                    </div>
                    <button onClick={() => setSelectedCell(null)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors">✕</button>
                  </div>
                ) : (
                  <p className="mb-4 text-xs text-muted-foreground">Klicke auf einen Tag für Details.</p>
                )}
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    <div className="mb-1 flex gap-1 pl-8">
                      {weeks.map((_, wi) => {
                        const label = monthLabels.find((m) => m.col === wi);
                        return (
                          <div key={wi} className={`w-3 leading-none ${wi > 0 && label ? "ml-2" : ""} ${label ? "text-[9px] font-semibold text-foreground" : "text-[9px] text-muted-foreground"}`}>
                            {label ? label.label : ""}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-1">
                      <div className="flex flex-col gap-1 pr-1">
                        {DAYS.map((d, i) => (
                          <div key={d} className={`flex h-3 items-center text-[9px] text-muted-foreground ${i % 2 === 0 ? "opacity-100" : "opacity-0"}`}>{d}</div>
                        ))}
                      </div>
                      {weeks.map((week, wi) => {
                        const isNewMonth = wi > 0 && monthLabels.some((m) => m.col === wi);
                        return (
                          <div key={wi} className={`flex flex-col gap-1${isNewMonth ? " ml-2" : ""}`}>
                            {week.map((cell, di) => {
                              const isSelected = selectedCell?.date === cell.date && selectedCell?.level === cell.level;
                              return (
                                <button key={di} onClick={() => setSelectedCell(isSelected ? null : cell)}
                                  className={`h-3 w-3 rounded-sm transition-all hover:scale-125 cursor-pointer ${heatColors[cell.level]} ${isSelected ? "ring-2 ring-primary ring-offset-1 scale-125" : ""}`}
                                  aria-label={`${cell.fullDate}: ${cell.cards} Karten`} />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>Weniger</span>
                      {[0,1,2,3,4].map((i) => <div key={i} className={`h-3 w-3 rounded-sm ${heatColors[i].split(" ")[0]}`} />)}
                      <span>Mehr</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fortschritt nach Deck */}
          <Card className="border">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Fortschritt pro Deck</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>{totalMastered} / {totalCards} gemeistert</span>
                </div>
              </div>
              <div className="space-y-3">
                {allDecks.map((deck) => {
                  const pct = Math.round((deck.masteredCount / deck.cards.length) * 100);
                  return (
                    <div key={deck.id} className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{deck.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{deck.title}</p>
                          <p className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">{deck.masteredCount}/{deck.cards.length}</p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={`h-1.5 rounded-full ${deck.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-8 text-right text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Weitermachen */}
          {recentDecks.length > 0 && (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Zuletzt gelernt</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentDecks.slice(0, 3).map((deck) => (
                  <Card key={deck.id} className="group overflow-hidden border hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className={`${deck.color} flex h-2 w-full`} />
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{deck.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{deck.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{deck.cards.length} Karten · {deck.lastStudied}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button asChild size="sm" className="flex-1"><Link href={`/study/${deck.id}`}>Lernen</Link></Button>
                          <Button asChild size="sm" variant="outline" className="flex-1"><Link href={`/quiz/${deck.id}`}>Quiz</Link></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Tab: Meine Decks ── */}
      {activeTab === "decks" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {allDecks.length} Decks · {allDecks.reduce((s, d) => s + d.cards.length, 0)} Karten insgesamt
            </p>
            <Button asChild size="sm">
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" />
                Neues Deck
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDecks.map((deck) => (
              <Card key={deck.id} className="group overflow-hidden border hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className={`${deck.color} h-1.5 w-full`} />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{deck.emoji}</span>
                      <div>
                        <p className="font-semibold leading-tight">{deck.title}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {deck.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{deck.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {deck.cards.length} Karten
                      </span>
                      {deck.lastStudied && <span>· Zuletzt: {deck.lastStudied}</span>}
                    </div>
                    <div className="mt-3">
                      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>{deck.masteredCount} / {deck.cards.length} gemeistert</span>
                        <span className="font-medium">
                          {Math.round((deck.masteredCount / deck.cards.length) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${deck.color} transition-all duration-500`}
                          style={{ width: `${(deck.masteredCount / deck.cards.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button asChild className="flex-1" size="sm">
                        <Link href={`/study/${deck.id}`}>Lernen</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1" size="sm">
                        <Link href={`/quiz/${deck.id}`}>Quiz</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Link href="/create">
              <Card className="group flex h-full min-h-[200px] items-center justify-center border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    Neues Deck erstellen
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* ── Tab: Kalender ── */}
      {activeTab === "kalender" && <KalenderTab />}

      {/* ── Tab: To-Do ── */}
      {activeTab === "todo" && <TodoTab />}

      {/* ── Tab: Retro ── */}
      {activeTab === "retro" && <RetroTab />}

      {/* ── Tab: 4000 Wochen ── */}
      {activeTab === "wochen" && <WeeksOfLife />}
    </div>
  );
}
