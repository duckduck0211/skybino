"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera, Upload, Sparkles, Save, BookOpen, Trash2, Plus,
  ChevronDown, ChevronUp, X, FileText, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createUserDeck } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "leicht" | "mittel" | "schwer";

interface GeneratedCard {
  front: string;
  back: string;
}

interface Capture {
  id: string;
  title: string;
  content: string;
  imageBase64?: string;
  level: Level;
  explanation: string;
  cards: GeneratedCard[];
  deckCreated: boolean;
  createdAt: string;
}

const STORAGE_KEY = "synapze-captures";

// ─── SSE stream helper ────────────────────────────────────────────────────────

async function streamExplain(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
        if (delta) onChunk(delta);
      } catch { /* skip */ }
    }
  }
}

function parseCards(text: string): GeneratedCard[] {
  const blocks = text.split("---").map(b => b.trim()).filter(Boolean);
  return blocks
    .map(block => {
      const front = block.match(/VORNE:\s*(.+)/i)?.[1]?.trim() ?? "";
      const back = block.match(/HINTEN:\s*([\s\S]+)/i)?.[1]?.trim() ?? "";
      return { front, back };
    })
    .filter(c => c.front && c.back);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CapturePage() {
  const [tab, setTab] = useState<"erfassen" | "gespeichert">("erfassen");
  const [captures, setCaptures] = useState<Capture[]>([]);

  // Input state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<Level>("mittel");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI state
  const [explanation, setExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Drag-over state
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load captures from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setCaptures(JSON.parse(raw));
  }, []);

  function persist(updated: Capture[]) {
    setCaptures(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Handle image file
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Extract base64 part (remove "data:image/...;base64,")
      const base64 = result.split(",")[1] ?? null;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function clearImage() {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function analyse() {
    if (!content.trim() && !imageBase64) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setExplanation("");
    setGeneratedCards([]);
    setAiLoading(true);

    const body: Record<string, unknown> = {
      front: content || "Analysiere und erkläre den Bildinhalt.",
      mode: "analyze",
      level,
    };
    if (imageBase64) body.imageBase64 = imageBase64;

    await streamExplain(body, chunk => setExplanation(prev => prev + chunk), ctrl.signal);
    setAiLoading(false);
  }

  async function generateCards() {
    const input = content || explanation;
    if (!input.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGeneratedCards([]);
    setCardsLoading(true);

    let fullText = "";
    const prompt =
      (content ? `Inhalt: ${content}\n` : "") +
      (explanation ? `Erklärung: ${explanation}\n` : "") +
      `\nTitel/Thema: ${title || "Unbekannt"}`;

    await streamExplain(
      { front: prompt, mode: "cards" },
      chunk => { fullText += chunk; },
      ctrl.signal,
    );

    setGeneratedCards(parseCards(fullText));
    setCardsLoading(false);
  }

  function saveCapture() {
    if (!explanation && generatedCards.length === 0) return;
    const capture: Capture = {
      id: crypto.randomUUID(),
      title: title.trim() || "Unbenanntes Capture",
      content,
      imageBase64: imageBase64 ?? undefined,
      level,
      explanation,
      cards: generatedCards,
      deckCreated: false,
      createdAt: new Date().toISOString(),
    };
    persist([capture, ...captures]);
    // Reset form
    setContent("");
    setTitle("");
    setExplanation("");
    setGeneratedCards([]);
    clearImage();
    setTab("gespeichert");
  }

  function deleteCapture(id: string) {
    persist(captures.filter(c => c.id !== id));
  }

  function createDeckFromCapture(capture: Capture) {
    if (capture.cards.length === 0) return;
    const deck = {
      id: crypto.randomUUID(),
      title: capture.title,
      description: `Erstellt aus Capture vom ${new Date(capture.createdAt).toLocaleDateString("de-DE")}`,
      emoji: "📸",
      color: "bg-violet-500",
      category: "Capture",
      masteredCount: 0,
      lastStudied: undefined,
      cards: capture.cards.map((c, i) => ({
        id: `${Date.now()}_${i}`,
        front: c.front,
        back: c.back,
      })),
    };
    createUserDeck(deck as Parameters<typeof createUserDeck>[0]);
    persist(captures.map(c => c.id === capture.id ? { ...c, deckCreated: true } : c));
  }

  const canAnalyse = (content.trim().length > 0 || !!imageBase64) && !aiLoading;
  const canGenerateCards = (content.trim().length > 0 || explanation.trim().length > 0) && !cardsLoading;
  const canSave = (explanation.trim().length > 0 || generatedCards.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Erfassen & Lernen</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Lade ein Bild oder füge Text ein — die KI erklärt, generiert Karten und erstellt ein Deck.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {[
            { id: "erfassen", label: "Neu erfassen", icon: Camera },
            { id: "gespeichert", label: `Gespeichert (${captures.length})`, icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "erfassen" | "gespeichert")}
              className={cn(
                "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-all",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Erfassen ── */}
      {tab === "erfassen" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* Left: Input */}
          <div className="space-y-4">
            {/* Title */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titel / Thema (z.B. Photosynthese, Mathe-Aufgabe…)"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

            {/* Image drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 border-dashed transition-all",
                dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40",
                !imagePreview ? "cursor-pointer" : "",
              )}
            >
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Vorschau"
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); clearImage(); }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground/60" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Bild hierher ziehen oder klicken
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      PNG, JPG, WEBP • Aufgaben, Fotos, Screenshots
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Text input */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Text / Aufgabe
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={"Füge hier Text, eine Aufgabe oder Notizen ein…\n\nBeispiel: «Erkläre die Zellteilung» oder kopiere einen Lerntext."}
                rows={5}
                className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Level selector */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Erklärungsniveau
              </p>
              <div className="flex gap-2">
                {([
                  { id: "leicht", label: "🟢 Leicht", desc: "Einfach & mit Beispiel" },
                  { id: "mittel", label: "🟡 Mittel", desc: "Oberstufen-Niveau" },
                  { id: "schwer", label: "🔴 Schwer", desc: "Universitätsniveau" },
                ] as const).map(lvl => (
                  <button
                    key={lvl.id}
                    onClick={() => setLevel(lvl.id)}
                    title={lvl.desc}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                      level === lvl.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {lvl.label}
                    <p className="mt-0.5 font-normal opacity-60">{lvl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={analyse}
                disabled={!canAnalyse}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading ? "Analysiere…" : "KI analysieren"}
              </button>
              <button
                onClick={generateCards}
                disabled={!canGenerateCards}
                className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-600 transition-all hover:bg-violet-500/20 disabled:opacity-40 dark:text-violet-400"
              >
                <Layers className="h-4 w-4" />
                {cardsLoading ? "Generiere…" : "Karten generieren"}
              </button>
              {canSave && (
                <button
                  onClick={saveCapture}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-500/20 dark:text-emerald-400"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </button>
              )}
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {/* AI Explanation */}
            {(explanation || aiLoading) && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    thaura.ai Erklärung
                  </p>
                </div>
                {aiLoading && !explanation ? (
                  <div className="flex animate-pulse items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />Analysiere…
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground">
                    {explanation}
                    {aiLoading && (
                      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-violet-500 align-middle" />
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Generated Cards */}
            {(generatedCards.length > 0 || cardsLoading) && (
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-violet-500" />
                    <p className="text-sm font-semibold">Generierte Karten</p>
                  </div>
                  {generatedCards.length > 0 && (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                      {generatedCards.length} Karten
                    </span>
                  )}
                </div>

                {cardsLoading && generatedCards.length === 0 ? (
                  <div className="flex animate-pulse items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />Generiere Lernkarten…
                  </div>
                ) : (
                  <div className="space-y-2">
                    {generatedCards.map((card, i) => (
                      <div key={i} className="rounded-lg border bg-background p-3 text-sm">
                        <p className="font-medium">{card.front}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{card.back}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!explanation && !aiLoading && generatedCards.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 py-12 text-center">
                <Camera className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Bild hochladen oder Text eingeben,<br />dann auf „KI analysieren" klicken.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Gespeichert ── */}
      {tab === "gespeichert" && (
        <div>
          {captures.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/20" />
              <p className="text-muted-foreground">Noch keine Captures gespeichert.</p>
              <button
                onClick={() => setTab("erfassen")}
                className="text-sm text-primary hover:underline"
              >
                Ersten Capture erstellen →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {captures.map(capture => (
                <div key={capture.id} className="flex flex-col rounded-xl border bg-card overflow-hidden">
                  {/* Image preview */}
                  {capture.imageBase64 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/jpeg;base64,${capture.imageBase64}`}
                      alt={capture.title}
                      className="h-32 w-full object-cover"
                    />
                  )}

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="font-semibold truncate">{capture.title}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(capture.createdAt).toLocaleDateString("de-DE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {" · "}
                        {capture.level === "leicht" ? "🟢 Leicht" : capture.level === "mittel" ? "🟡 Mittel" : "🔴 Schwer"}
                        {capture.cards.length > 0 && ` · ${capture.cards.length} Karten`}
                      </p>
                    </div>

                    {/* Explanation preview */}
                    {capture.explanation && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {capture.explanation}
                      </p>
                    )}

                    {/* Cards preview toggle */}
                    {capture.cards.length > 0 && (
                      <div className="rounded-lg border bg-muted/20">
                        <button
                          onClick={() => setExpandedCardId(expandedCardId === capture.id ? null : capture.id)}
                          className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold"
                        >
                          <span className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-violet-500" />
                            {capture.cards.length} Lernkarten
                          </span>
                          {expandedCardId === capture.id
                            ? <ChevronUp className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {expandedCardId === capture.id && (
                          <div className="border-t divide-y px-3 py-1">
                            {capture.cards.map((card, i) => (
                              <div key={i} className="py-2">
                                <p className="text-xs font-medium">{card.front}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{card.back}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex gap-2">
                      {capture.cards.length > 0 && (
                        <button
                          onClick={() => createDeckFromCapture(capture)}
                          disabled={capture.deckCreated}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                            capture.deckCreated
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-default"
                              : "border-violet-500/30 bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 dark:text-violet-400",
                          )}
                        >
                          {capture.deckCreated
                            ? <><BookOpen className="h-3.5 w-3.5" />Deck erstellt!</>
                            : <><Plus className="h-3.5 w-3.5" />Als Deck speichern</>}
                        </button>
                      )}
                      <button
                        onClick={() => deleteCapture(capture.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
