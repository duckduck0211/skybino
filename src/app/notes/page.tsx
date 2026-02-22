"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText, ChevronLeft, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CornellNote {
  id: string;
  title: string;
  subject: string;
  cues: string;        // left column: keywords / questions
  notes: string;       // main area: detailed notes
  summary: string;     // bottom: summary
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "synapze-notes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newNote(): CornellNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Neue Notiz",
    subject: "",
    cues: "",
    notes: "",
    summary: "",
    createdAt: now,
    updatedAt: now,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const [notes, setNotes] = useState<CornellNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCards, setAiCards] = useState<{ front: string; back: string }[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CornellNote[];
      setNotes(parsed);
      if (parsed.length > 0) setActiveId(parsed[0].id);
    }
  }, []);

  function persist(updated: CornellNote[]) {
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function createNote() {
    const n = newNote();
    const updated = [n, ...notes];
    persist(updated);
    setActiveId(n.id);
    setAiCards([]);
  }

  function updateNote(id: string, patch: Partial<CornellNote>) {
    persist(notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    persist(updated);
    setActiveId(updated.length > 0 ? updated[0].id : null);
    setAiCards([]);
  }

  // Generate flashcards from note via thaura.ai
  async function generateCards() {
    if (!active) return;
    setAiLoading(true);
    setAiCards([]);
    try {
      const prompt =
        `Thema: ${active.title}\n` +
        `Stichworte/Fragen: ${active.cues}\n` +
        `Notizen: ${active.notes}\n` +
        `Zusammenfassung: ${active.summary}\n\n` +
        `Erstelle daraus 5 Lernkarten im Format:\n` +
        `VORNE: [Begriff oder Frage]\nHINTEN: [Antwort oder Erklärung]\n---\n` +
        `Antworte nur mit den Karten, kein weiterer Text.`;

      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: prompt, back: "" }),
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
            fullText += delta;
          } catch { /* skip */ }
        }
      }

      // Parse cards from response
      const blocks = fullText.split("---").map(b => b.trim()).filter(Boolean);
      const parsed = blocks.map(block => {
        const frontMatch = block.match(/VORNE:\s*(.+)/i);
        const backMatch  = block.match(/HINTEN:\s*([\s\S]+)/i);
        return {
          front: frontMatch?.[1]?.trim() ?? "",
          back:  backMatch?.[1]?.trim()  ?? "",
        };
      }).filter(c => c.front && c.back);

      setAiCards(parsed);
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  }

  const active = notes.find(n => n.id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/20">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notizen</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {notes.length}
            </span>
          </div>
          <button
            onClick={createNote}
            className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Neue Notiz"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {notes.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Noch keine Notizen.<br />
              <button onClick={createNote} className="mt-2 text-primary hover:underline">
                Erste Notiz erstellen →
              </button>
            </div>
          ) : notes.map(note => (
            <button
              key={note.id}
              onClick={() => { setActiveId(note.id); setAiCards([]); }}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                activeId === note.id && "bg-primary/5 border-r-2 border-primary"
              )}
            >
              <p className={cn("truncate text-sm font-medium", activeId === note.id ? "text-primary" : "text-foreground")}>
                {note.title || "Unbenannte Notiz"}
              </p>
              {note.subject && (
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{note.subject}</p>
              )}
              <p className="mt-0.5 text-[10px] text-muted-foreground/60">{formatDate(note.updatedAt)}</p>
            </button>
          ))}
        </div>

        {/* Cornell Method explainer */}
        <div className="border-t p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cornell-Methode</p>
          <div className="space-y-1 text-[10px] text-muted-foreground leading-relaxed">
            <p><span className="text-foreground font-medium">Stichworte:</span> Schlüsselbegriffe & Fragen</p>
            <p><span className="text-foreground font-medium">Notizen:</span> Ausführliche Mitschrift</p>
            <p><span className="text-foreground font-medium">Zusammenfassung:</span> Kernaussagen</p>
          </div>
        </div>
      </aside>

      {/* ── Main Editor ── */}
      {active ? (
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Title bar */}
          <div className="flex items-center gap-3 border-b px-6 py-3">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={active.title}
              onChange={e => updateNote(active.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
              placeholder="Titel…"
            />
            <input
              value={active.subject}
              onChange={e => updateNote(active.id, { subject: e.target.value })}
              placeholder="Fach / Thema"
              className="rounded-lg border bg-muted/30 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => generateCards()}
              disabled={aiLoading || !active.notes.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-40"
              title="Lernkarten via thaura.ai generieren"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading ? "Generiere…" : "Karten erstellen"}
            </button>
            <button
              onClick={() => deleteNote(active.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Notiz löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Cornell Layout */}
          <div className="flex flex-1 overflow-hidden">

            {/* Cue column (30%) */}
            <div className="flex w-[30%] shrink-0 flex-col border-r">
              <div className="border-b bg-muted/20 px-4 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Stichworte & Fragen
                </p>
              </div>
              <textarea
                value={active.cues}
                onChange={e => updateNote(active.id, { cues: e.target.value })}
                placeholder={"Schlüsselbegriffe\nFragen zur Prüfung\nHauptthemen…"}
                className="flex-1 resize-none bg-transparent p-4 text-sm outline-none placeholder:text-muted-foreground/50 leading-relaxed"
              />
            </div>

            {/* Main notes (70%) */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b bg-muted/20 px-4 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Notizen
                </p>
              </div>
              <textarea
                value={active.notes}
                onChange={e => updateNote(active.id, { notes: e.target.value })}
                placeholder={"Ausführliche Mitschrift hier…\n\nVersuche in eigenen Worten zu schreiben, nicht 1:1 abzuschreiben."}
                className="flex-1 resize-none bg-transparent p-4 text-sm outline-none placeholder:text-muted-foreground/50 leading-relaxed"
              />

              {/* Summary at bottom */}
              <div className="border-t">
                <div className="border-b bg-muted/20 px-4 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Zusammenfassung (in eigenen Worten)
                  </p>
                </div>
                <textarea
                  value={active.summary}
                  onChange={e => updateNote(active.id, { summary: e.target.value })}
                  placeholder="Fasse das Wichtigste in 2–3 Sätzen zusammen…"
                  rows={3}
                  className="w-full resize-none bg-transparent p-4 text-sm outline-none placeholder:text-muted-foreground/50 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* AI Generated Cards */}
          {aiCards.length > 0 && (
            <div className="border-t bg-violet-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-semibold text-violet-400">thaura.ai — Generierte Lernkarten</p>
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-400">{aiCards.length} Karten</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {aiCards.map((card, i) => (
                  <div key={i} className="rounded-xl border border-violet-500/20 bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 mb-1">Frage</p>
                    <p className="text-sm font-medium leading-snug">{card.front}</p>
                    <div className="my-2 border-t border-border" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Antwort</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.back}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p className="text-sm">Keine Notiz ausgewählt</p>
            <button onClick={createNote} className="mt-3 text-sm text-primary hover:underline">
              Erste Notiz erstellen →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
