"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  BookOpen,
  Share2,
  MessageSquare,
  CheckCircle2,
  X,
  ChevronRight,
  Copy,
  ImagePlus,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAllDecks, addCardsToDeck, createUserDeck } from "@/lib/store";
import type { Deck } from "@/lib/data";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stage = "form" | "analyzing" | "result";
type Level = "leicht" | "mittel" | "schwer";
type CaptureTab = "neu" | "gespeichert";

interface GeneratedCard {
  front: string;
  back: string;
}

// ─── Streaming helpers ─────────────────────────────────────────────────────────

async function streamScanResponse(
  imageBase64: string,
  mimeType: string,
  followUp: string | undefined,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType, followUp }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Unbekannter Fehler");
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) onChunk(chunk);
      } catch {
        /* skip */
      }
    }
  }
}

async function streamExplainResponse(
  text: string,
  level: Level,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ front: text, level, mode: "analyze" }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Unbekannter Fehler");
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) onChunk(chunk);
      } catch {
        /* skip */
      }
    }
  }
}

// ─── Level config ──────────────────────────────────────────────────────────────

const LEVELS = [
  {
    value: "leicht" as Level,
    label: "Leicht",
    dot: "bg-emerald-500",
    description: "Einfache Sprache, Alltagsbeispiele",
    activeBorder: "border-emerald-400 dark:border-emerald-600",
    activeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    activeLabel: "text-emerald-700 dark:text-emerald-300",
  },
  {
    value: "mittel" as Level,
    label: "Mittel",
    dot: "bg-amber-500",
    description: "Verständlich mit etwas Kontext",
    activeBorder: "border-amber-400 dark:border-amber-600",
    activeBg: "bg-amber-50 dark:bg-amber-950/40",
    activeLabel: "text-amber-700 dark:text-amber-300",
  },
  {
    value: "schwer" as Level,
    label: "Schwer",
    dot: "bg-rose-500",
    description: "Ausführliche Fachanalyse",
    activeBorder: "border-rose-400 dark:border-rose-600",
    activeBg: "bg-rose-50 dark:bg-rose-950/40",
    activeLabel: "text-rose-700 dark:text-rose-300",
  },
] as const;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const [stage, setStage] = useState<Stage>("form");
  const [captureTab, setCaptureTab] = useState<CaptureTab>("neu");
  const [title, setTitle] = useState("");
  const [textInput, setTextInput] = useState("");
  const [level, setLevel] = useState<Level>("mittel");
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [previewUrl, setPreviewUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Follow-up
  const [followUpText, setFollowUpText] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Save to deck
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [savingCards, setSavingCards] = useState(false);
  const [cardsSaved, setCardsSaved] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);

  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload ────────────────────────────────────────────────────────────

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageBase64(dataUrl.split(",")[1] ?? "");
      setMimeType(file.type || "image/jpeg");
      setPreviewUrl(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const clearImage = () => {
    setImageBase64("");
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Analyse ─────────────────────────────────────────────────────────────────

  const canAnalyse = !!(imageBase64 || textInput.trim());

  const analyse = useCallback(
    async (followUp?: string) => {
      if (!imageBase64 && !textInput.trim() && !followUp) return;
      setStage("analyzing");
      setExplanation("");
      setError(null);
      setGeneratedCards([]);
      setCardsSaved(false);

      try {
        if (imageBase64) {
          await streamScanResponse(imageBase64, mimeType, followUp, (chunk) => {
            setExplanation((prev) => prev + chunk);
          });
        } else {
          await streamExplainResponse(
            followUp ?? textInput,
            level,
            (chunk) => {
              setExplanation((prev) => prev + chunk);
            }
          );
        }
        setStage("result");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        setStage("form");
      }
    },
    [imageBase64, mimeType, textInput, level]
  );

  // ── Follow-up ────────────────────────────────────────────────────────────────

  const sendFollowUp = async () => {
    if (!followUpText.trim()) return;
    setFollowUpLoading(true);
    setShowFollowUp(false);
    const question = followUpText;
    setFollowUpText("");
    setExplanation("");
    await analyse(question);
    setFollowUpLoading(false);
  };

  // ── Copy / Share ─────────────────────────────────────────────────────────────

  const copyExplanation = () => {
    navigator.clipboard.writeText(explanation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareExplanation = () => {
    if (navigator.share) {
      navigator.share({ title: "Synapze Erklärung", text: explanation });
    } else {
      copyExplanation();
    }
  };

  // ── Save panel ───────────────────────────────────────────────────────────────

  const openSavePanel = async () => {
    const decks = getAllDecks();
    setAllDecks(decks);
    if (decks.length > 0) setSelectedDeckId(decks[0].id);
    setShowSavePanel(true);

    if (generatedCards.length === 0) {
      setGeneratingCards(true);
      try {
        const res = await fetch("/api/scan-to-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ explanation }),
        });
        const data = (await res.json()) as {
          cards?: GeneratedCard[];
          error?: string;
        };
        if (data.cards) setGeneratedCards(data.cards);
      } catch {
        /* silent */
      } finally {
        setGeneratingCards(false);
      }
    }
  };

  const saveCards = () => {
    if (!selectedDeckId || generatedCards.length === 0) return;
    setSavingCards(true);
    const cards = generatedCards.map((c, i) => ({
      id: `scan_${Date.now()}_${i}`,
      type: "basic" as const,
      front: c.front,
      back: c.back,
      status: "new" as const,
    }));
    const existing = allDecks.find((d) => d.id === selectedDeckId);
    if (existing) {
      addCardsToDeck(selectedDeckId, cards);
    } else {
      const newDeck: Deck = {
        id: `scan-deck-${Date.now()}`,
        title: title || "Scan-Karten",
        description: "Automatisch aus einem Scan erstellt",
        category: "Andere",
        color: "bg-violet-500",
        emoji: "📸",
        masteredCount: 0,
        cards,
      };
      createUserDeck(newDeck);
    }
    setSavingCards(false);
    setCardsSaved(true);
    setTimeout(() => setCardsSaved(false), 4000);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const levelCfg = LEVELS.find((l) => l.value === level)!;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Erfassen &amp; Lernen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lade ein Bild hoch oder beschreibe ein Thema — Thaura.ai erklärt es
          auf Deutsch.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(["neu", "gespeichert"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCaptureTab(tab)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              captureTab === tab
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "neu" ? "Neu erfassen" : "Gespeichert (0)"}
          </button>
        ))}
      </div>

      {/* ── Analyzing spinner ── */}
      {stage === "analyzing" && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-card py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-semibold">Thaura.ai analysiert…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Erklärung wird generiert
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-100/50 dark:bg-violet-900/20 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-300">
              EU-basiert · DSGVO-konform
            </span>
          </div>
        </div>
      )}

      {/* ── Neu erfassen form ── */}
      {captureTab === "neu" && stage === "form" && (
        <div className="space-y-5">
          {/* THEMA / TITEL */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thema / Titel
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Pythagoreischer Lehrsatz, Photosynthese…"
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>

          {/* Image dropzone */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bild / Aufgabe
            </label>
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vorschau"
                  className="mx-auto max-h-72 w-auto object-contain"
                />
                <button
                  onClick={clearImage}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  title="Bild entfernen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted py-12 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                  <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bild hierher ziehen</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    oder klicken · JPG, PNG, HEIC
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* TEXT / AUFGABE */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Text / Aufgabe
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Füge Text, eine Aufgabenstellung oder ein Thema ein, das erklärt werden soll…"
              rows={5}
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>

          {/* ERKLÄRUNGSNIVEAU */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Erklärungsniveau
            </label>
            <div className="grid grid-cols-3 gap-3">
              {LEVELS.map(
                ({
                  value,
                  label,
                  dot,
                  description,
                  activeBorder,
                  activeBg,
                  activeLabel,
                }) => (
                  <button
                    key={value}
                    onClick={() => setLevel(value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all",
                      level === value
                        ? cn(activeBorder, activeBg)
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", dot)} />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          level === value ? activeLabel : ""
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {description}
                    </p>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={() => analyse()}
            disabled={!canAnalyse}
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-violet-500/30 hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            Analysieren
          </Button>
        </div>
      )}

      {/* ── Gespeichert tab ── */}
      {captureTab === "gespeichert" && stage !== "analyzing" && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Bookmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Keine gespeicherten Scans</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Analysierte Inhalte erscheinen hier
            </p>
          </div>
        </div>
      )}

      {/* ── Result stage ── */}
      {stage === "result" && (
        <>
          {/* Back to form */}
          <button
            onClick={() => {
              setStage("form");
              setExplanation("");
              setShowSavePanel(false);
              setShowFollowUp(false);
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Neu erfassen
          </button>

          {/* Context pill */}
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg object-cover border"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {title || (previewUrl ? "Gescanntes Bild" : "Text-Analyse")}
              </p>
              <p className="text-xs text-muted-foreground">
                Erklärt von Thaura.ai
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                levelCfg.activeBg,
                levelCfg.activeLabel
              )}
            >
              <div className={cn("h-1.5 w-1.5 rounded-full", levelCfg.dot)} />
              {levelCfg.label}
            </div>
          </div>

          {/* Explanation card */}
          <Card className="border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">Erklärung</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyExplanation}
                    title="Kopieren"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={shareExplanation}
                    title="Teilen"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {explanation.split("\n").map((line, i) => {
                    if (!line.trim()) return <br key={i} />;
                    if (line.startsWith("# "))
                      return (
                        <h1 key={i} className="text-xl font-bold mb-2">
                          {line.slice(2)}
                        </h1>
                      );
                    if (line.startsWith("## "))
                      return (
                        <h2 key={i} className="text-lg font-bold mb-1.5">
                          {line.slice(3)}
                        </h2>
                      );
                    if (line.startsWith("### "))
                      return (
                        <h3 key={i} className="text-base font-semibold mb-1">
                          {line.slice(4)}
                        </h3>
                      );
                    if (line.startsWith("- ") || line.startsWith("* "))
                      return (
                        <li key={i} className="ml-4 list-disc text-sm">
                          {line.slice(2)}
                        </li>
                      );
                    if (/^\d+\./.test(line))
                      return (
                        <li key={i} className="ml-4 list-decimal text-sm">
                          {line.replace(/^\d+\.\s*/, "")}
                        </li>
                      );
                    return (
                      <p key={i} className="mb-1.5 text-sm leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action bar */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={openSavePanel}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 text-center transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Speichern</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Als Lernkarten
                </p>
              </div>
            </button>

            <button
              onClick={shareExplanation}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 text-center transition-all hover:border-blue-400/40 hover:bg-blue-500/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Teilen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Weiterschicken
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowFollowUp((p) => !p)}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 text-center transition-all hover:border-violet-400/40 hover:bg-violet-500/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nachfragen</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Konkrete Frage
                </p>
              </div>
            </button>
          </div>

          {/* Follow-up input */}
          {showFollowUp && (
            <Card className="border-2 border-violet-200 dark:border-violet-800">
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-semibold">Nachfrage stellen</p>
                <div className="flex gap-2">
                  <input
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendFollowUp()}
                    placeholder="z.B. Erkläre Schritt 2 genauer…"
                    className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    autoFocus
                  />
                  <Button
                    onClick={sendFollowUp}
                    disabled={!followUpText.trim() || followUpLoading}
                    className="gap-2 shrink-0"
                  >
                    {followUpLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Fragen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save panel */}
          {showSavePanel && (
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Als Lernkarten speichern</p>
                  <button
                    onClick={() => setShowSavePanel(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {generatingCards ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Karten werden generiert…
                  </div>
                ) : generatedCards.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {generatedCards.length} Karten generiert
                    </p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {generatedCards.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-lg border bg-muted/30 px-3 py-2.5"
                        >
                          <p className="text-xs font-semibold">{c.front}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {c.back}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Deck auswählen
                  </label>
                  {allDecks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Noch kein Deck —{" "}
                      <Link href="/create" className="text-primary underline">
                        Erstellen
                      </Link>
                    </p>
                  ) : (
                    <select
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    >
                      {allDecks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.emoji} {d.title} ({d.cards.length} Karten)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {cardsSaved ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Gespeichert!{" "}
                    <Link
                      href="/dashboard"
                      className="ml-auto font-bold underline underline-offset-2 hover:opacity-80"
                    >
                      Dashboard →
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={saveCards}
                      disabled={
                        savingCards ||
                        generatedCards.length === 0 ||
                        !selectedDeckId
                      }
                      className="flex-1 gap-2"
                    >
                      {savingCards ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                      {generatedCards.length > 0
                        ? `${generatedCards.length} Karten speichern`
                        : "Speichern"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSavePanel(false)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
