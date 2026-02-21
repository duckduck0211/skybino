"use client";

import { useState, useEffect } from "react";
import { Plus, X, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Confidence = "rot" | "gelb" | "gruen";

interface RetroTopic {
  id: string;
  name: string;
  confidence: Confidence;
  sessions: string[]; // ISO date strings
}

interface RetroSubject {
  id: string;
  name: string;
  topics: RetroTopic[];
  expanded: boolean;
}

const STORAGE_KEY = "synapze-retro";

const CONFIDENCE_CONFIG: Record<Confidence, { emoji: string; label: string; bg: string; text: string; border: string; order: number }> = {
  rot:   { emoji: "🔴", label: "Unsicher",  bg: "bg-rose-500/15",    text: "text-rose-400",    border: "border-rose-500/30",    order: 0 },
  gelb:  { emoji: "🟡", label: "Okay",      bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/30",   order: 1 },
  gruen: { emoji: "🟢", label: "Gut",       bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", order: 2 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso);
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}

function formatSessionDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function lastStudiedLabel(sessions: string[]): string {
  if (sessions.length === 0) return "Noch nie";
  const last = [...sessions].sort().at(-1)!;
  const days = daysSince(last);
  if (days === 0) return "Heute";
  if (days === 1) return "Gestern";
  return `vor ${days} Tagen`;
}

function needsAttention(topic: RetroTopic): boolean {
  if (topic.confidence === "rot") return true;
  if (topic.sessions.length === 0) return true;
  const last = [...topic.sessions].sort().at(-1)!;
  return daysSince(last) >= 3;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RetroTab() {
  const [subjects, setSubjects] = useState<RetroSubject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");

  // Load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSubjects(JSON.parse(raw));
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  function addSubject() {
    if (!newSubjectName.trim()) return;
    setSubjects((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newSubjectName.trim(), topics: [], expanded: true },
    ]);
    setNewSubjectName("");
    setShowAddSubject(false);
  }

  function removeSubject(id: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleExpanded(id: string) {
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, expanded: !s.expanded } : s));
  }

  function addTopic(subjectId: string) {
    if (!newTopicName.trim()) return;
    setSubjects((prev) => prev.map((s) =>
      s.id !== subjectId ? s : {
        ...s,
        topics: [
          ...s.topics,
          { id: crypto.randomUUID(), name: newTopicName.trim(), confidence: "rot", sessions: [] },
        ],
      }
    ));
    setNewTopicName("");
    setAddingTopicFor(null);
  }

  function removeTopic(subjectId: string, topicId: string) {
    setSubjects((prev) => prev.map((s) =>
      s.id !== subjectId ? s : { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
    ));
  }

  function setConfidence(subjectId: string, topicId: string, confidence: Confidence) {
    setSubjects((prev) => prev.map((s) =>
      s.id !== subjectId ? s : {
        ...s,
        topics: s.topics.map((t) => t.id !== topicId ? t : { ...t, confidence }),
      }
    ));
  }

  function logSession(subjectId: string, topicId: string) {
    const today = todayIso();
    setSubjects((prev) => prev.map((s) =>
      s.id !== subjectId ? s : {
        ...s,
        topics: s.topics.map((t) => {
          if (t.id !== topicId) return t;
          // Don't duplicate today's date
          if (t.sessions.includes(today)) return t;
          return { ...t, sessions: [...t.sessions, today] };
        }),
      }
    ));
  }

  // Stats
  const allTopics = subjects.flatMap((s) => s.topics);
  const attentionTopics = allTopics.filter(needsAttention);

  // Suggested topics for today (first 3 needing attention)
  const todaySuggestions = attentionTopics
    .map((t) => {
      const subjectName = subjects.find((s) => s.topics.some((tp) => tp.id === t.id))?.name ?? "";
      return { topic: t, subjectName };
    })
    .slice(0, 3);

  return (
    <div className="space-y-5">

      {/* ── Summary bar ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-rose-500/5 border-rose-500/20 p-3 text-center">
          <p className="text-2xl font-black text-rose-400">{attentionTopics.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">brauchen Aufmerksamkeit</p>
        </div>
        <div className="rounded-xl border p-3 text-center">
          <p className="text-2xl font-black">{allTopics.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Themen gesamt</p>
        </div>
        <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-3 text-center">
          <p className="text-2xl font-black text-emerald-400">
            {allTopics.filter((t) => t.confidence === "gruen").length}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">sicher gemeistert</p>
        </div>
      </div>

      {/* ── Today's suggestions ── */}
      {todaySuggestions.length > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="mb-3 text-sm font-semibold text-violet-400">⚡ Heute empfohlen</p>
          <div className="space-y-2">
            {todaySuggestions.map(({ topic, subjectName }) => {
              const subjectId = subjects.find((s) => s.topics.some((t) => t.id === topic.id))?.id!;
              const alreadyToday = topic.sessions.includes(todayIso());
              return (
                <div key={topic.id} className="flex items-center justify-between gap-3 rounded-lg bg-background/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{topic.name}</p>
                    <p className="text-xs text-muted-foreground">{subjectName} · {lastStudiedLabel(topic.sessions)}</p>
                  </div>
                  <button
                    onClick={() => logSession(subjectId, topic.id)}
                    disabled={alreadyToday}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      alreadyToday
                        ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {alreadyToday ? <><Check className="h-3 w-3" /> Heute gelernt</> : "✓ Gelernt"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subject list ── */}
      <div className="space-y-3">
        {subjects.length === 0 && !showAddSubject && (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">Noch kein Fach angelegt.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Füge deine Fächer hinzu und tracke deine Themen mit Confidence-Bewertung.
            </p>
          </div>
        )}

        {subjects.map((subject) => {
          // Sort topics: red first, then by days since last study
          const sortedTopics = [...subject.topics].sort((a, b) => {
            const confOrder = CONFIDENCE_CONFIG[a.confidence].order - CONFIDENCE_CONFIG[b.confidence].order;
            if (confOrder !== 0) return confOrder;
            const lastA = a.sessions.length ? daysSince([...a.sessions].sort().at(-1)!) : 9999;
            const lastB = b.sessions.length ? daysSince([...b.sessions].sort().at(-1)!) : 9999;
            return lastB - lastA;
          });

          const attentionCount = subject.topics.filter(needsAttention).length;

          return (
            <div key={subject.id} className="rounded-xl border overflow-hidden">
              {/* Subject header */}
              <div
                className="flex cursor-pointer items-center gap-3 bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpanded(subject.id)}
              >
                {subject.expanded
                  ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                }
                <span className="flex-1 font-semibold">{subject.name}</span>
                <span className="text-xs text-muted-foreground">{subject.topics.length} Themen</span>
                {attentionCount > 0 && (
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-400">
                    🔴 {attentionCount}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeSubject(subject.id); }}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Topics */}
              {subject.expanded && (
                <div className="divide-y">
                  {sortedTopics.map((topic) => {
                    const recentSessions = [...topic.sessions].sort().slice(-3);
                    const alreadyToday = topic.sessions.includes(todayIso());
                    const cfg = CONFIDENCE_CONFIG[topic.confidence];

                    return (
                      <div key={topic.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                        {/* Topic name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{topic.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", cfg.bg, cfg.text, cfg.border)}>
                              {cfg.emoji} {cfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">{lastStudiedLabel(topic.sessions)}</span>
                            {recentSessions.map((d) => (
                              <span key={d} className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {formatSessionDate(d)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Confidence selector */}
                        <div className="flex gap-1 shrink-0">
                          {(["rot", "gelb", "gruen"] as Confidence[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => setConfidence(subject.id, topic.id, c)}
                              title={CONFIDENCE_CONFIG[c].label}
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg border text-sm transition-all",
                                topic.confidence === c
                                  ? `${CONFIDENCE_CONFIG[c].bg} ${CONFIDENCE_CONFIG[c].border} ring-1 ring-offset-1 ring-current`
                                  : "border-border opacity-40 hover:opacity-70"
                              )}
                            >
                              {CONFIDENCE_CONFIG[c].emoji}
                            </button>
                          ))}
                        </div>

                        {/* Gelernt button */}
                        <button
                          onClick={() => logSession(subject.id, topic.id)}
                          disabled={alreadyToday}
                          className={cn(
                            "shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                            alreadyToday
                              ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                              : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                          )}
                        >
                          {alreadyToday ? <><Check className="h-3 w-3" /> Heute</> : "✓ Gelernt"}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => removeTopic(subject.id, topic.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add topic */}
                  {addingTopicFor === subject.id ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/20">
                      <input
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addTopic(subject.id); if (e.key === "Escape") setAddingTopicFor(null); }}
                        placeholder="Thema hinzufügen…"
                        className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => addTopic(subject.id)} disabled={!newTopicName.trim()}>
                        Hinzufügen
                      </Button>
                      <button onClick={() => setAddingTopicFor(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTopicFor(subject.id); setNewTopicName(""); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thema hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add subject ── */}
      {showAddSubject ? (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3">
          <input
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addSubject(); if (e.key === "Escape") setShowAddSubject(false); }}
            placeholder="Fachname (z.B. Biologie)"
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
          <Button size="sm" onClick={addSubject} disabled={!newSubjectName.trim()}>
            Erstellen
          </Button>
          <button onClick={() => setShowAddSubject(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSubject(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" />
          Fach hinzufügen
        </button>
      )}

      {/* How-to hint */}
      {subjects.length === 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-400/80 space-y-1">
          <p className="font-semibold text-blue-400">💡 So funktioniert Retrospective Timetabling</p>
          <p>1. Lege alle Fächer und Themen an</p>
          <p>2. Bewerte jedes Thema: 🔴 Unsicher · 🟡 Okay · 🟢 Gut</p>
          <p>3. Klicke jeden Tag auf <strong>„✓ Gelernt"</strong> nach einer Lerneinheit</p>
          <p>4. Konzentriere dich auf 🔴 Themen und solche, die du lange nicht wiederholt hast</p>
          <p className="italic text-blue-400/60">Methode: Ali Abdaal – Retrospective Revision Timetable</p>
        </div>
      )}
    </div>
  );
}
