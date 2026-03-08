"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText, ChevronRight, Sparkles, BookOpen, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToggleBlock {
  id: string;
  question: string;
  answer: string;
  answerImage?: string;
}

interface CornellNote {
  id: string;
  title: string;
  subject: string;
  summary: string;
  blocks: ToggleBlock[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "synapze-notes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newBlock(): ToggleBlock {
  return { id: crypto.randomUUID(), question: "", answer: "" };
}

function newNote(): CornellNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Neue Notiz",
    subject: "",
    summary: "",
    blocks: [newBlock()],
    createdAt: now,
    updatedAt: now,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

/** Migrate old cornell format (cues/notes/summary) to new block format */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateNote(raw: any): CornellNote {
  if (Array.isArray(raw.blocks)) return raw as CornellNote;
  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? "Notiz",
    subject: raw.subject ?? "",
    summary: raw.summary ?? "",
    blocks: (raw.cues || raw.notes)
      ? [{ id: crypto.randomUUID(), question: raw.cues ?? "", answer: raw.notes ?? "" }]
      : [newBlock()],
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const [notes, setNotes]     = useState<CornellNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCards, setAiCards]   = useState<{ front: string; back: string }[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = (JSON.parse(raw) as any[]).map(migrateNote);
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
    persist([n, ...notes]);
    setActiveId(n.id);
    setAiCards([]);
    setExpanded(new Set([n.blocks[0].id]));
  }

  function updateNote(id: string, patch: Partial<CornellNote>) {
    persist(notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)));
  }

  function updateBlock(noteId: string, blockId: string, patch: Partial<ToggleBlock>) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    updateNote(noteId, { blocks: note.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }

  function addBlock(noteId: string) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const nb = newBlock();
    updateNote(noteId, { blocks: [...note.blocks, nb] });
    setExpanded((prev) => new Set([...prev, nb.id]));
    setTimeout(() => document.getElementById(`q-${nb.id}`)?.focus(), 50);
  }

  function deleteBlock(noteId: string, blockId: string) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const blocks = note.blocks.filter((b) => b.id !== blockId);
    updateNote(noteId, { blocks: blocks.length > 0 ? blocks : [newBlock()] });
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    persist(updated);
    setActiveId(updated.length > 0 ? updated[0].id : null);
    setAiCards([]);
  }

  function toggleBlock(blockId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }

  async function generateCards() {
    if (!active) return;
    setAiLoading(true);
    setAiCards([]);
    try {
      const content = active.blocks
        .map((b) => `Frage: ${b.question}\nAntwort: ${b.answer}`)
        .join("\n\n");
      const prompt =
        `Thema: ${active.title}\n\n${content}\n\n` +
        `Erstelle 5 kompakte Lernkarten:\nVORNE: [Frage]\nHINTEN: [Antwort]\n---\nNur Karten, kein Text drum herum.`;

      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: prompt, back: "" }),
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let full = "";

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
          try { full += JSON.parse(data).choices?.[0]?.delta?.content ?? ""; } catch { /* skip */ }
        }
      }

      const blocks2 = full.split("---").map((b) => b.trim()).filter(Boolean);
      const parsed = blocks2.map((block) => ({
        front: block.match(/VORNE:\s*(.+)/i)?.[1]?.trim() ?? "",
        back:  block.match(/HINTEN:\s*([\s\S]+)/i)?.[1]?.trim() ?? "",
      })).filter((c) => c.front && c.back);
      setAiCards(parsed);
    } catch { /* silently fail */ } finally {
      setAiLoading(false);
    }
  }

  const active = notes.find((n) => n.id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/20">
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
            title="Neue Notiz"
            className="rounded-lg bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {notes.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Noch keine Notizen.<br />
              <button onClick={createNote} className="mt-2 text-primary hover:underline">
                Erste erstellen →
              </button>
            </div>
          ) : notes.map((note) => (
            <button
              key={note.id}
              onClick={() => { setActiveId(note.id); setAiCards([]); }}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                activeId === note.id && "bg-primary/5 border-r-2 border-primary"
              )}
            >
              <p className={cn(
                "truncate text-sm font-medium",
                activeId === note.id ? "text-primary" : "text-foreground"
              )}>
                {note.title || "Unbenannte Notiz"}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {note.subject && (
                  <span className="truncate text-[11px] text-muted-foreground">{note.subject}</span>
                )}
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">
                  {note.blocks.length} Fragen
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">{formatDate(note.updatedAt)}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      {active ? (
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Title bar */}
          <div className="flex items-center gap-3 border-b px-6 py-3">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={active.title}
              onChange={(e) => updateNote(active.id, { title: e.target.value })}
              placeholder="Titel…"
              className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
            />
            <input
              value={active.subject}
              onChange={(e) => updateNote(active.id, { subject: e.target.value })}
              placeholder="Fach"
              className="w-28 rounded-lg border bg-muted/30 px-3 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={generateCards}
              disabled={aiLoading || active.blocks.every((b) => !b.question.trim())}
              className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading ? "Generiere…" : "Karten"}
            </button>
            <button
              onClick={() => deleteNote(active.id)}
              title="Notiz löschen"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Toggle blocks ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-6 py-8">

              <div className="space-y-0.5">
                {active.blocks.map((block, i) => {
                  const isOpen = expanded.has(block.id);
                  return (
                    <div key={block.id} className="group rounded-lg hover:bg-muted/30 transition-colors">

                      {/* Question row */}
                      <div className="flex items-start gap-2 px-2 py-1.5">
                        {/* Triangle toggle */}
                        <button
                          onClick={() => toggleBlock(block.id)}
                          className="mt-[3px] shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                          title={isOpen ? "Einklappen" : "Ausklappen"}
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform duration-150",
                              isOpen && "rotate-90"
                            )}
                            strokeWidth={2.2}
                          />
                        </button>

                        {/* Question input */}
                        <textarea
                          id={`q-${block.id}`}
                          value={block.question}
                          onChange={(e) => updateBlock(active.id, block.id, { question: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (!isOpen) toggleBlock(block.id);
                              setTimeout(() => document.getElementById(`a-${block.id}`)?.focus(), 120);
                            }
                          }}
                          onInput={(e) => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = "auto";
                            t.style.height = `${t.scrollHeight}px`;
                          }}
                          placeholder={`Frage ${i + 1}…`}
                          rows={1}
                          className="flex-1 resize-none bg-transparent text-sm font-medium leading-relaxed outline-none placeholder:text-muted-foreground/40"
                          style={{ minHeight: "24px" }}
                        />

                        {/* Delete block */}
                        <button
                          onClick={() => deleteBlock(active.id, block.id)}
                          className="mt-[3px] shrink-0 opacity-0 transition-all group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Answer (collapsible) */}
                      {isOpen && (
                        <div className="mb-1.5 ml-8 mr-2 rounded-r-md border-l-2 border-primary/40 pl-3">
                          <textarea
                            id={`a-${block.id}`}
                            value={block.answer}
                            onChange={(e) => updateBlock(active.id, block.id, { answer: e.target.value })}
                            onInput={(e) => {
                              const t = e.target as HTMLTextAreaElement;
                              t.style.height = "auto";
                              t.style.height = `${t.scrollHeight}px`;
                            }}
                            placeholder="Antwort…"
                            rows={2}
                            className="w-full resize-none bg-transparent py-1.5 text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40"
                          />
                          {/* Answer image */}
                          {block.answerImage && (
                            <div className="relative mb-2 mt-1 inline-block">
                              <img
                                src={block.answerImage}
                                alt="Abbildung"
                                className="max-h-48 max-w-full rounded-md border object-contain"
                              />
                              <button
                                onClick={() => updateBlock(active.id, block.id, { answerImage: undefined })}
                                className="absolute -right-2 -top-2 rounded-full border bg-background p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                                title="Bild entfernen"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          {/* Image upload */}
                          <div className="pb-1">
                            <input
                              type="file"
                              accept="image/*"
                              id={`img-${block.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateBlock(active.id, block.id, { answerImage: ev.target?.result as string });
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }}
                            />
                            <button
                              onClick={() => document.getElementById(`img-${block.id}`)?.click()}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
                              title="Bild hinzufügen"
                            >
                              <ImageIcon className="h-3 w-3" />
                              Bild einfügen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add block */}
              <button
                onClick={() => addBlock(active.id)}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Frage hinzufügen
              </button>

              {/* Summary */}
              <div className="mt-8 rounded-xl border bg-muted/20 p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Zusammenfassung
                </p>
                <textarea
                  value={active.summary}
                  onChange={(e) => updateNote(active.id, { summary: e.target.value })}
                  placeholder="Kernaussagen in eigenen Worten…"
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          </div>

          {/* AI Cards */}
          {aiCards.length > 0 && (
            <div className="max-h-64 overflow-y-auto border-t bg-violet-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-semibold text-violet-400">Generierte Lernkarten</p>
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-400">
                  {aiCards.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {aiCards.map((card, i) => (
                  <div key={i} className="rounded-xl border border-violet-500/20 bg-background p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">Frage</p>
                    <p className="text-sm font-medium leading-snug">{card.front}</p>
                    <div className="my-2 border-t" />
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Antwort</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{card.back}</p>
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
