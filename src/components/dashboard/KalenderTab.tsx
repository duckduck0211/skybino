"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  type: "klausur" | "abgabe" | "sonstiges";
}

const STORAGE_KEY = "synapze-calendar-events";

const typeConfig = {
  klausur:   { label: "Klausur",  color: "bg-rose-500",  text: "text-rose-400",  border: "border-rose-500/40",  dot: "bg-rose-500" },
  abgabe:    { label: "Abgabe",   color: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/40", dot: "bg-amber-500" },
  sonstiges: { label: "Sonstiges",color: "bg-blue-500",  text: "text-blue-400",  border: "border-blue-500/40",  dot: "bg-blue-500" },
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Mo … 6=So for a JS day (0=Su…6=Sa) */
function jsToMo(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

function daysFromNow(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KalenderTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<CalendarEvent["type"]>("klausur");

  // Load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setEvents(JSON.parse(raw));
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  function addEvent() {
    if (!newTitle.trim() || !selectedDate) return;
    setEvents((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date: selectedDate, title: newTitle.trim(), type: newType },
    ]);
    setNewTitle("");
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); }

  // Build calendar grid
  const totalDays = daysInMonth(year, month);
  const firstDow = jsToMo(new Date(year, month, 1).getDay()); // 0=Mo
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = new Date(year, month).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const todayIso = toIso(today);

  function eventsOn(day: number) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === iso);
  }

  function getSelectedIso(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Upcoming events (next 30 days)
  const upcoming = events
    .filter((e) => {
      const diff = daysFromNow(e.date);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">

      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button onClick={goToday} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            Heute
          </button>
          <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div>
        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border bg-border">
          {cells.map((day, i) => {
            if (!day) {
              return <div key={i} className="bg-muted/20 min-h-[64px]" />;
            }
            const iso = getSelectedIso(day);
            const dayEvents = eventsOn(day);
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;
            return (
              <div
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : iso)}
                className={cn(
                  "bg-background min-h-[64px] cursor-pointer p-1.5 transition-colors hover:bg-muted/50",
                  isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/40"
                )}
              >
                <span className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                )}>
                  {day}
                </span>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      title={ev.title}
                      className={`h-1.5 w-1.5 rounded-full ${typeConfig[ev.type].dot}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                </div>
                {/* Event chips on day */}
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div key={ev.id} className={cn("flex items-center justify-between rounded px-1 py-0.5 text-[9px] font-medium leading-none", `bg-${typeConfig[ev.type].dot.replace("bg-","")}/15`, typeConfig[ev.type].text)}>
                      <span className="truncate max-w-[50px]">{ev.title}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeEvent(ev.id); }} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Inline add form (shows when a day is selected) ── */}
      {selectedDate && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">
            Termin für{" "}
            <span className="text-primary">{formatDate(selectedDate)}</span>
          </p>
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              placeholder="Titel (z.B. Mathe-Klausur)"
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["klausur", "abgabe", "sonstiges"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                  newType === t
                    ? `${typeConfig[t].color} text-white border-transparent`
                    : `border-border text-muted-foreground hover:bg-muted`
                )}
              >
                {typeConfig[t].label}
              </button>
            ))}
            <div className="flex-1" />
            <Button size="sm" onClick={addEvent} disabled={!newTitle.trim()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Hinzufügen
            </Button>
            <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Upcoming events ── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Anstehende Termine</h3>
          <span className="text-xs text-muted-foreground">(nächste 30 Tage)</span>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Termine eingetragen.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev) => {
              const diff = daysFromNow(ev.date);
              const cfg = typeConfig[ev.type];
              return (
                <div key={ev.id} className={cn("flex items-center gap-3 rounded-xl border p-3", cfg.border)}>
                  <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(ev.date)}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {diff === 0 ? "Heute" : diff === 1 ? "Morgen" : `in ${diff} Tagen`}
                  </Badge>
                  <button onClick={() => removeEvent(ev.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["klausur", "abgabe", "sonstiges"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${typeConfig[t].dot}`} />
            {typeConfig[t].label}
          </div>
        ))}
      </div>
    </div>
  );
}
