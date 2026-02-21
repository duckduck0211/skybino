"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, X, ChevronUp, ChevronDown, Flag, BookOpen,
  EyeOff, Eye, Trash2, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { decks, getAllCards, TODAY } from "@/lib/data";
import type { CardStatus, CardFlag } from "@/lib/data";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  new:       { label: "Neu",        badge: "bg-blue-500/15 text-blue-400",     dot: "bg-blue-400",    row: "" },
  learning:  { label: "Lernend",    badge: "bg-amber-500/15 text-amber-400",   dot: "bg-amber-400",   row: "bg-amber-500/[0.03]" },
  review:    { label: "Wiederholen",badge: "bg-violet-500/15 text-violet-400", dot: "bg-violet-400",  row: "" },
  suspended: { label: "Ausgesetzt", badge: "bg-yellow-500/15 text-yellow-500", dot: "bg-yellow-400",  row: "bg-yellow-500/[0.04]" },
  mastered:  { label: "Gemeistert",badge: "bg-emerald-500/15 text-emerald-400",dot: "bg-emerald-400", row: "" },
} as const;

const FLAG_DOT: Record<CardFlag, string> = {
  0: "", 1: "bg-red-500", 2: "bg-orange-500", 3: "bg-green-500", 4: "bg-blue-500",
};
const FLAG_LABEL: Record<CardFlag, string> = {
  0: "Kein Flag", 1: "Rot", 2: "Orange", 3: "Grün", 4: "Blau",
};

type SortCol = "front" | "deck" | "status" | "due" | "ease" | "interval" | "lapses";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDue(dueDate: string | undefined): { text: string; cls: string } {
  if (!dueDate) return { text: "–", cls: "text-muted-foreground" };
  if (dueDate < TODAY) return { text: "Überfällig", cls: "text-red-500 font-semibold" };
  if (dueDate === TODAY) return { text: "Heute", cls: "text-orange-500 font-semibold" };
  const days = Math.round((new Date(dueDate).getTime() - new Date(TODAY).getTime()) / 86_400_000);
  if (days === 1) return { text: "Morgen", cls: "text-amber-400" };
  return { text: `in ${days}d`, cls: "text-muted-foreground" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [query, setQuery]             = useState("");
  const [statusFilter, setStatus]     = useState<CardStatus | "all">("all");
  const [deckFilter, setDeck]         = useState("all");
  const [flagFilter, setFlag]         = useState<CardFlag | "all">("all");
  const [sortCol, setSortCol]         = useState<SortCol>("status");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [previewUid, setPreviewUid]   = useState<string | null>(null);

  // ── All cards flat ──
  const allCards = useMemo(() => getAllCards(), []);

  // ── Stats ──
  const stats = useMemo(() => ({
    total:     allCards.length,
    new:       allCards.filter(c => c.status === "new").length,
    learning:  allCards.filter(c => c.status === "learning").length,
    review:    allCards.filter(c => c.status === "review").length,
    suspended: allCards.filter(c => c.status === "suspended").length,
    mastered:  allCards.filter(c => c.status === "mastered").length,
    due:       allCards.filter(c => c.dueDate && c.dueDate <= TODAY).length,
  }), [allCards]);

  // ── Filter ──
  const filtered = useMemo(() => {
    let r = allCards;
    if (statusFilter !== "all") r = r.filter(c => c.status === statusFilter);
    if (deckFilter   !== "all") r = r.filter(c => c.deckId === deckFilter);
    if (flagFilter   !== "all") r = r.filter(c => c.flag === flagFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q));
    }
    return r;
  }, [allCards, statusFilter, deckFilter, flagFilter, query]);

  // ── Sort ──
  const sorted = useMemo(() => {
    const statusOrder: Record<CardStatus, number> = { suspended: 0, learning: 1, review: 2, new: 3, mastered: 4 };
    return [...filtered].sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      switch (sortCol) {
        case "front":    va = a.front;               vb = b.front;               break;
        case "deck":     va = a.deckTitle;            vb = b.deckTitle;           break;
        case "status":   va = statusOrder[a.status]; vb = statusOrder[b.status]; break;
        case "due":      va = a.dueDate ?? "9999";   vb = b.dueDate ?? "9999";   break;
        case "ease":     va = a.ease ?? 0;            vb = b.ease ?? 0;           break;
        case "interval": va = a.interval ?? 0;        vb = b.interval ?? 0;       break;
        case "lapses":   va = a.lapses ?? 0;          vb = b.lapses ?? 0;         break;
      }
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va - (vb as number));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const previewCard = previewUid ? allCards.find(c => c.uid === previewUid) ?? null : null;

  // ── Selection ──
  const toggleSelect = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  };
  const toggleAll = () =>
    setSelected(selected.size === sorted.length && sorted.length > 0 ? new Set() : new Set(sorted.map(c => c.uid)));

  // ── Sort header click ──
  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── Status filter pills ──
  const statusPills: { key: CardStatus | "all"; label: string; count: number }[] = [
    { key: "all",       label: "Alle",        count: allCards.length },
    { key: "new",       label: "Neu",         count: stats.new },
    { key: "learning",  label: "Lernend",     count: stats.learning },
    { key: "review",    label: "Wiederholen", count: stats.review },
    { key: "suspended", label: "Ausgesetzt",  count: stats.suspended },
    { key: "mastered",  label: "Gemeistert",  count: stats.mastered },
  ];

  // ── Sort icon ──
  const SortIcon = ({ col }: { col: SortCol }) =>
    sortCol === col ? (
      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    ) : null;

  const Th = ({ col, label }: { col: SortCol; label: string }) => (
    <th
      onClick={() => handleSort(col)}
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="flex items-center gap-1">{label}<SortIcon col={col} /></span>
    </th>
  );

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-xl font-bold">Karten-Browser</h1>
          <p className="text-sm text-muted-foreground">
            {allCards.length} Karten in {decks.length} Decks
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Karten suchen…"
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Deck selector */}
        <select
          value={deckFilter}
          onChange={e => setDeck(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Alle Decks</option>
          {decks.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.title}</option>)}
        </select>

        {/* Flag filter */}
        <select
          value={String(flagFilter)}
          onChange={e => setFlag(e.target.value === "all" ? "all" : Number(e.target.value) as CardFlag)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Alle Flags</option>
          {([1, 2, 3, 4] as CardFlag[]).map(f => <option key={f} value={f}>{FLAG_LABEL[f]}</option>)}
          <option value={0}>Kein Flag</option>
        </select>
      </div>

      {/* ── Stats strip ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Fällig heute", value: stats.due,       color: "text-orange-500" },
          { label: "Neu",          value: stats.new,        color: "text-blue-400"   },
          { label: "Lernend",      value: stats.learning,   color: "text-amber-400"  },
          { label: "Wiederholen",  value: stats.review,     color: "text-violet-400" },
          { label: "Ausgesetzt",   value: stats.suspended,  color: "text-yellow-500" },
          { label: "Gemeistert",   value: stats.mastered,   color: "text-emerald-400"},
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2">
            <span className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex flex-wrap gap-2">
        {statusPills.map(p => (
          <button
            key={p.key}
            onClick={() => setStatus(p.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all",
              statusFilter === p.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {p.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              statusFilter === p.key ? "bg-white/20" : "bg-muted"
            )}>{p.count}</span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === sorted.length}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < sorted.length; }}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="w-4 px-1 py-2.5" title="Flag" />
                <Th col="front"    label="Vorderseite" />
                <Th col="deck"     label="Deck" />
                <Th col="status"   label="Status" />
                <Th col="due"      label="Fällig" />
                <Th col="ease"     label="Ease" />
                <Th col="interval" label="Intervall" />
                <Th col="lapses"   label="Fehler" />
              </tr>
            </thead>

            <tbody>
              {sorted.map(card => {
                const isSelected = selected.has(card.uid);
                const isPreviewed = previewUid === card.uid;
                const sc = STATUS_CFG[card.status];
                const due = formatDue(card.dueDate);

                return (
                  <tr
                    key={card.uid}
                    onClick={() => setPreviewUid(isPreviewed ? null : card.uid)}
                    className={cn(
                      "cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40",
                      sc.row,
                      isPreviewed && "bg-primary/[0.04] ring-inset ring-1 ring-primary/20",
                      isSelected && !isPreviewed && "bg-primary/[0.03]"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5" onClick={e => toggleSelect(card.uid, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="pointer-events-none rounded"
                      />
                    </td>

                    {/* Flag dot */}
                    <td className="px-1 py-2.5">
                      {card.flag > 0 && (
                        <div className={cn("h-2 w-2 rounded-full", FLAG_DOT[card.flag])} title={FLAG_LABEL[card.flag]} />
                      )}
                    </td>

                    {/* Front */}
                    <td className="max-w-[260px] px-3 py-2.5">
                      <p className="truncate text-sm">{card.front}</p>
                    </td>

                    {/* Deck */}
                    <td className="px-3 py-2.5">
                      <span className="flex max-w-[120px] items-center gap-1.5 text-sm text-muted-foreground">
                        <span>{card.deckEmoji}</span>
                        <span className="truncate">{card.deckTitle}</span>
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", sc.badge)}>
                        {sc.label}
                      </span>
                    </td>

                    {/* Due */}
                    <td className={cn("px-3 py-2.5 text-sm tabular-nums", due.cls)}>{due.text}</td>

                    {/* Ease */}
                    <td className="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">
                      {card.ease !== undefined ? (
                        <span className={cn(
                          card.ease < 2.0 ? "font-semibold text-red-500" :
                          card.ease < 2.3 ? "text-amber-500" : "text-foreground"
                        )}>{card.ease.toFixed(1)}</span>
                      ) : "–"}
                    </td>

                    {/* Interval */}
                    <td className="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">
                      {card.interval !== undefined ? `${card.interval}d` : "–"}
                    </td>

                    {/* Lapses */}
                    <td className="px-3 py-2.5 text-sm tabular-nums">
                      {card.lapses !== undefined ? (
                        <span className={cn(
                          card.lapses >= 4 ? "font-bold text-red-500" :
                          card.lapses >= 2 ? "text-orange-500" : "text-muted-foreground"
                        )}>{card.lapses}</span>
                      ) : "–"}
                    </td>
                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                    Keine Karten gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          {sorted.length} von {allCards.length} Karten
          {selected.size > 0 && (
            <span className="ml-3 font-semibold text-primary">{selected.size} ausgewählt</span>
          )}
        </div>
      </div>

      {/* ── Preview panel ── */}
      {previewCard && (
        <div className="rounded-xl border bg-card p-5">
          {/* Deck + status */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-xl">{previewCard.deckEmoji}</span>
            <span className="text-sm font-medium text-muted-foreground">{previewCard.deckTitle}</span>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              STATUS_CFG[previewCard.status].badge
            )}>
              {STATUS_CFG[previewCard.status].label}
            </span>
            {previewCard.flag > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className={cn("h-2 w-2 rounded-full", FLAG_DOT[previewCard.flag])} />
                {FLAG_LABEL[previewCard.flag]}
              </span>
            )}
            <button
              onClick={() => setPreviewUid(null)}
              className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Card content */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vorderseite
              </p>
              <div className="min-h-[60px] rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
                {previewCard.front}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rückseite
              </p>
              <div className="min-h-[60px] rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
                {previewCard.back}
              </div>
            </div>
          </div>

          {/* SRS data */}
          {previewCard.status !== "new" && (
            <div className="mt-4 flex flex-wrap gap-6 border-t pt-4">
              {[
                { label: "Ease",          value: previewCard.ease?.toFixed(2) ?? "–",                                          highlight: previewCard.ease !== undefined && previewCard.ease < 2.0 ? "text-red-500" : undefined },
                { label: "Intervall",     value: previewCard.interval !== undefined ? `${previewCard.interval} Tage` : "–" },
                { label: "Fehler",        value: previewCard.lapses?.toString() ?? "–",                                         highlight: (previewCard.lapses ?? 0) >= 3 ? "text-red-500" : undefined },
                { label: "Wiederholungen",value: previewCard.reps?.toString() ?? "–" },
                { label: "Fällig",        value: formatDue(previewCard.dueDate).text,                                           highlight: formatDue(previewCard.dueDate).cls },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className={cn("mt-0.5 text-sm font-semibold", s.highlight)}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Link
              href={`/study/${previewCard.deckId}`}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Deck lernen
            </Link>
            <Link
              href={`/study/${previewCard.deckId}`}
              className="flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Deck öffnen
            </Link>
            <button className="flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
              {previewCard.status === "suspended"
                ? <><Eye className="h-3.5 w-3.5" /> Reaktivieren</>
                : <><EyeOff className="h-3.5 w-3.5" /> Aussetzen</>
              }
            </button>
            <div className="flex gap-1 ml-0.5">
              {([1, 2, 3, 4] as CardFlag[]).map(f => (
                <button
                  key={f}
                  title={FLAG_LABEL[f]}
                  className={cn(
                    "h-7 w-7 rounded-lg border flex items-center justify-center transition-colors hover:bg-muted",
                    previewCard.flag === f ? "ring-2 ring-offset-1 ring-primary" : ""
                  )}
                >
                  <div className={cn("h-2.5 w-2.5 rounded-full", FLAG_DOT[f])} />
                </button>
              ))}
            </div>
            <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3.5 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
              Löschen
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk action bar (floating) ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-popover px-5 py-3 shadow-2xl">
          <span className="text-sm font-semibold">{selected.size} Karten</span>
          <div className="h-4 w-px bg-border" />
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <EyeOff className="h-3.5 w-3.5" />Aussetzen
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Flag className="h-3.5 w-3.5" />Flag
          </button>
          <button className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />Löschen
          </button>
          <div className="h-4 w-px bg-border" />
          <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
