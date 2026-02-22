"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TOTAL_WEEKS = 4000;

export function WeeksOfLife() {
  const currentYear = new Date().getFullYear();
  const currentWeek = Math.floor(
    (new Date().getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const [birthYear, setBirthYear] = useState(2000);
  const [birthMonth, setBirthMonth] = useState(1);

  const birthDate = new Date(birthYear, birthMonth - 1, 1);
  const now = new Date();
  const msLived = now.getTime() - birthDate.getTime();
  const weeksLived = Math.max(0, Math.floor(msLived / (7 * 24 * 60 * 60 * 1000)));
  const weeksRemaining = Math.max(0, TOTAL_WEEKS - weeksLived);
  const pctLived = Math.min(100, Math.round((weeksLived / TOTAL_WEEKS) * 100));

  const yearsLived = Math.floor(weeksLived / 52);

  // Split into rows of 52 (1 year per row)
  const rows: ("lived" | "remaining")[][] = [];
  for (let w = 0; w < TOTAL_WEEKS; w += 52) {
    const row: ("lived" | "remaining")[] = [];
    for (let col = 0; col < 52; col++) {
      const week = w + col;
      row.push(week < weeksLived ? "lived" : "remaining");
    }
    rows.push(row);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">4000 Wochen</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          Ein Menschenleben hat im Durchschnitt etwa 4000 Wochen. Jedes Kästchen ist eine Woche deines Lebens.
          Inspiriert von Oliver Burkemans <em>„Vier Tausend Wochen"</em>.
        </p>
      </div>

      {/* Birth date input */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Geburtsjahr:</label>
        <input
          type="number"
          value={birthYear}
          onChange={e => setBirthYear(Number(e.target.value))}
          min={1920} max={currentYear}
          className="w-24 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <label className="text-sm font-medium">Monat:</label>
        <select
          value={birthMonth}
          onChange={e => setBirthMonth(Number(e.target.value))}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          {["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: "Gelebte Wochen",     value: weeksLived.toLocaleString("de"),    color: "text-primary" },
          { label: "Verbleibende Wochen",value: weeksRemaining.toLocaleString("de"), color: "text-muted-foreground" },
          { label: "Gelebte Jahre",      value: yearsLived,                          color: "text-foreground" },
          { label: "Gelebt",             value: `${pctLived}%`,                      color: "text-violet-500" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card px-5 py-3">
            <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max space-y-0.5">
          {/* Year labels every 10 rows */}
          {rows.map((row, yi) => (
            <div key={yi} className="flex items-center gap-0.5">
              <span className={cn(
                "w-7 shrink-0 text-right text-[9px] tabular-nums",
                yi % 5 === 0 ? "text-muted-foreground" : "text-transparent"
              )}>
                {yi % 5 === 0 ? yi : ""}
              </span>
              {row.map((type, wi) => (
                <div
                  key={wi}
                  title={`Jahr ${yi + 1}, Woche ${wi + 1}`}
                  className={cn(
                    "h-2 w-2 rounded-[2px] transition-colors",
                    type === "lived"
                      ? "bg-primary"
                      : "bg-muted hover:bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          ))}
        </div>

        {/* X-axis: weeks */}
        <div className="mt-1 flex items-center gap-0.5 pl-7">
          {Array.from({ length: 52 }, (_, i) => (
            <div key={i} className={cn(
              "w-2 text-center text-[8px] text-muted-foreground",
              i % 13 === 0 ? "opacity-100" : "opacity-0"
            )}>
              {i % 13 === 0 ? i + 1 : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground italic">
          „Das Problem ist nicht, dass das Leben zu kurz ist. Das Problem ist, dass wir so tun, als hätten wir unbegrenzt Zeit."
        </p>
        <p className="mt-2 text-xs text-muted-foreground">— Oliver Burkeman, <em>Vier Tausend Wochen</em></p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-[2px] bg-primary" />
          Gelebt
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-[2px] bg-muted" />
          Noch vor dir
        </div>
      </div>
    </div>
  );
}
