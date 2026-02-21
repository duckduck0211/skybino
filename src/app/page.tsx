"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Zap, Target, Plus, Flame, Shield, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decks, getTotalCards, getTotalMastered } from "@/lib/data";

const categories = ["Alle", ...Array.from(new Set(decks.map((d) => d.category)))];

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "decks">("overview");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [selectedCell, setSelectedCell] = useState<HeatCell | null>(null);

  const recentDecks = decks.filter((d) => d.lastStudied);
  const totalCards = getTotalCards();
  const totalMastered = getTotalMastered();

  const filteredDecks =
    selectedCategory === "Alle"
      ? decks
      : decks.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
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
              <p className="text-lg font-bold leading-none">{decks.length}</p>
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
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab("decks")}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "decks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Meine Decks
            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {decks.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Tab: Übersicht ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* ── Streak + Heatmap ── */}
          <Card className="overflow-hidden border">
            <CardContent className="p-0">
              {/* Streak header */}
              <div className="flex items-stretch gap-0 border-b">
                {/* Flame section */}
                <div className="flex flex-col items-center justify-center gap-1 border-r px-8 py-5">
                  <div className="relative">
                    <Flame className="h-12 w-12 text-orange-500 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" fill="currentColor" />
                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                      <span className="text-sm font-black text-white">{currentStreak}</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Tage Streak</p>
                </div>

                {/* Streak info + milestones */}
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
                        <div
                          key={m.days}
                          title={`${m.label}: ${m.days} Tage`}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all ${
                            currentStreak >= m.days
                              ? "bg-orange-100 dark:bg-orange-900/40 ring-2 ring-orange-400"
                              : "bg-muted opacity-40"
                          }`}
                        >
                          {m.emoji}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar to next milestone */}
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{currentStreak} / {nextMilestone.days} Tage</span>
                      <span>{progressToNext}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                  </div>

                  {/* Streak shield */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    <span>Streak-Schutz: <span className="font-medium text-foreground">1 verfügbar</span></span>
                    <span className="text-muted-foreground/60">— schützt deinen Streak bei einem verpassten Tag</span>
                  </div>
                </div>
              </div>

              {/* ── Activity Heatmap ── */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Lernaktivität</p>
                  <p className="text-xs text-muted-foreground">Letzte 16 Wochen</p>
                </div>

                {/* ── Selected cell info panel ── */}
                {selectedCell ? (
                  <div className="mb-4 flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className={`h-8 w-8 shrink-0 rounded-lg ${heatColors[selectedCell.level].split(" ")[0]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{selectedCell.fullDate}</p>
                      <p className="text-xs text-muted-foreground">{levelLabels[selectedCell.level]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {selectedCell.cards > 0 ? (
                        <>
                          <p className="text-lg font-bold text-primary leading-none">{selectedCell.cards}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Karten gelernt</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Kein Lernen</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Schließen"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="mb-4 text-xs text-muted-foreground">
                    Klicke auf einen Tag, um Details zu sehen.
                  </p>
                )}

                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    {/* Month labels */}
                    <div className="mb-1 flex gap-1 pl-8">
                      {weeks.map((_, wi) => {
                        const label = monthLabels.find((m) => m.col === wi);
                        const isNewMonth = wi > 0 && label != null;
                        return (
                          <div
                            key={wi}
                            className={`w-3 leading-none ${isNewMonth ? "ml-2" : ""} ${label ? "text-[9px] font-semibold text-foreground" : "text-[9px] text-muted-foreground"}`}
                          >
                            {label ? label.label : ""}
                          </div>
                        );
                      })}
                    </div>

                    {/* Grid: rows = days of week, cols = weeks */}
                    <div className="flex gap-1">
                      {/* Day labels */}
                      <div className="flex flex-col gap-1 pr-1">
                        {DAYS.map((d, i) => (
                          <div key={d} className={`flex h-3 items-center text-[9px] text-muted-foreground ${i % 2 === 0 ? "opacity-100" : "opacity-0"}`}>
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Week columns */}
                      {weeks.map((week, wi) => {
                        const isNewMonth = wi > 0 && monthLabels.some((m) => m.col === wi);
                        return (
                        <div key={wi} className={`flex flex-col gap-1${isNewMonth ? " ml-2" : ""}`}>
                          {week.map((cell, di) => {
                            const isSelected = selectedCell?.date === cell.date && selectedCell?.level === cell.level;
                            return (
                              <button
                                key={di}
                                onClick={() => setSelectedCell(isSelected ? null : cell)}
                                className={`h-3 w-3 rounded-sm transition-all hover:scale-125 cursor-pointer ${heatColors[cell.level]} ${
                                  isSelected ? "ring-2 ring-primary ring-offset-1 scale-125" : ""
                                }`}
                                aria-label={`${cell.fullDate}: ${cell.cards} Karten`}
                              />
                            );
                          })}
                        </div>
                      );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>Weniger</span>
                      {[0,1,2,3,4].map((i) => (
                        <div key={i} className={`h-3 w-3 rounded-sm ${heatColors[i].split(" ")[0]}`} />
                      ))}
                      <span>Mehr</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Fortschritt nach Deck ── */}
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
                {decks.map((deck) => {
                  const pct = Math.round((deck.masteredCount / deck.cards.length) * 100);
                  return (
                    <div key={deck.id} className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{deck.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{deck.title}</p>
                          <p className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">
                            {deck.masteredCount}/{deck.cards.length}
                          </p>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full ${deck.color} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-8 text-right text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Weitermachen ── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Weitermachen</h3>
              <button
                onClick={() => setActiveTab("decks")}
                className="text-sm text-primary hover:underline"
              >
                Alle Decks →
              </button>
            </div>
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
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {deck.cards.length} Karten · {deck.lastStudied}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>{deck.masteredCount} gemeistert</span>
                          <span>{Math.round((deck.masteredCount / deck.cards.length) * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full ${deck.color} transition-all`}
                            style={{ width: `${(deck.masteredCount / deck.cards.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/study/${deck.id}`}>Lernen</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/quiz/${deck.id}`}>Quiz</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Tab: Meine Decks ── */}
      {activeTab === "decks" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {decks.length} Decks · {decks.reduce((s, d) => s + d.cards.length, 0)} Karten insgesamt
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
    </div>
  );
}
