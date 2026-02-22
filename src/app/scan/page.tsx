"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  RefreshCcw,
  Sparkles,
  Loader2,
  BookOpen,
  Share2,
  MessageSquare,
  CheckCircle2,
  X,
  ChevronRight,
  Copy,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllDecks, addCardsToDeck, createUserDeck } from "@/lib/store";
import type { Deck } from "@/lib/data";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stage = "idle" | "preview" | "analyzing" | "result";

interface GeneratedCard {
  front: string;
  back: string;
}

// ─── Streaming helper ──────────────────────────────────────────────────────────

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
    const err = await res.json() as { error?: string };
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
        // skip malformed chunks
      }
    }
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [mimeType, setMimeType]       = useState<string>("image/jpeg");
  const [previewUrl, setPreviewUrl]   = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [error, setError]             = useState<string | null>(null);

  // Follow-up
  const [followUpText, setFollowUpText]   = useState("");
  const [showFollowUp, setShowFollowUp]   = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Save to deck
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [allDecks, setAllDecks]           = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [savingCards, setSavingCards]       = useState(false);
  const [cardsSaved, setCardsSaved]         = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);

  // Copy
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Strip the data URL prefix to get raw base64
      const base64 = dataUrl.split(",")[1] ?? "";
      setImageBase64(base64);
      setMimeType(file.type || "image/jpeg");
      setPreviewUrl(dataUrl);
      setStage("preview");
      setError(null);
      setExplanation("");
      setCardsSaved(false);
      setGeneratedCards([]);
      setShowSavePanel(false);
      setShowFollowUp(false);
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

  // ── Analyse ──────────────────────────────────────────────────────────────

  const analyse = useCallback(async (followUp?: string) => {
    if (!imageBase64) return;
    setStage("analyzing");
    setExplanation("");
    setError(null);
    setGeneratedCards([]);
    setCardsSaved(false);

    try {
      let result = "";
      await streamScanResponse(imageBase64, mimeType, followUp, (chunk) => {
        result += chunk;
        setExplanation((prev) => prev + chunk);
        if (followUp) setStage("result");
        else setStage("result");
      });
      setExplanation(result);
      setStage("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setStage("preview");
    }
  }, [imageBase64, mimeType]);

  // ── Follow-up ────────────────────────────────────────────────────────────

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

  // ── Copy ─────────────────────────────────────────────────────────────────

  const copyExplanation = () => {
    navigator.clipboard.writeText(explanation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Share ─────────────────────────────────────────────────────────────────

  const shareExplanation = () => {
    if (navigator.share) {
      navigator.share({
        title: "Synapze Erklärung",
        text: explanation,
      });
    } else {
      copyExplanation();
    }
  };

  // ── Generate + Save cards ─────────────────────────────────────────────────

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
        const data = await res.json() as { cards?: GeneratedCard[]; error?: string };
        if (data.cards) setGeneratedCards(data.cards);
      } catch {
        // silently ignore — user can still save manually
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
      // Create new deck with scan content
      const newDeck: Deck = {
        id: `scan-deck-${Date.now()}`,
        title: "Scan-Karten",
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

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Bild scannen</h2>
          <p className="text-sm text-muted-foreground">Lade ein Bild hoch — Thaura.ai erklärt es nach Feynman.</p>
        </div>
      </div>

      {/* ── Stage: Idle ── */}
      {stage === "idle" && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted py-20 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/40 transition-colors">
            <Camera className="h-8 w-8 text-violet-500" />
          </div>
          <div>
            <p className="text-lg font-semibold">Bild hierher ziehen</p>
            <p className="mt-1 text-sm text-muted-foreground">oder klicken zum Auswählen · JPG, PNG, HEIC</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-100/50 dark:bg-violet-900/20 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-300">Analysiert von Thaura.ai — EU-basiert, DSGVO-konform</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      )}

      {/* ── Stage: Preview ── */}
      {(stage === "preview" || stage === "analyzing") && (
        <Card className="overflow-hidden border">
          <CardContent className="p-0">
            {/* Image preview */}
            <div className="relative bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Vorschau"
                className="mx-auto max-h-[420px] w-auto object-contain"
              />
              {stage === "analyzing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                  <p className="text-sm font-semibold text-white">Thaura.ai analysiert…</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {stage === "preview" && (
              <div className="flex items-center justify-between gap-3 border-t bg-card px-5 py-4">
                {/* Left: Wechseln */}
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setStage("idle");
                    setPreviewUrl("");
                    setImageBase64("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Wechseln
                </Button>

                {/* Right: Analysieren */}
                <Button
                  className="gap-2 bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-violet-500/30 hover:opacity-90"
                  onClick={() => analyse()}
                >
                  <Sparkles className="h-4 w-4" />
                  Analysieren ✨
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Stage: Result ── */}
      {stage === "result" && (
        <>
          {/* Thumbnail + change button */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Gescanntes Bild"
              className="h-16 w-16 shrink-0 rounded-xl object-cover border"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Analysiertes Bild</p>
              <p className="text-xs text-muted-foreground">Erklärt von Thaura.ai · Feynman-Methode</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => {
                setStage("idle");
                setPreviewUrl("");
                setImageBase64("");
                setExplanation("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              Neues Bild
            </Button>
          </div>

          {/* Explanation card */}
          <Card className="border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">Feynman-Erklärung</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyExplanation}
                    title="Kopieren"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
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

              {/* Explanation text */}
              <div className="px-5 py-5">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {explanation.split("\n").map((line, i) => {
                    if (!line.trim()) return <br key={i} />;
                    if (line.startsWith("# "))   return <h1 key={i} className="text-xl font-bold mb-2">{line.slice(2)}</h1>;
                    if (line.startsWith("## "))  return <h2 key={i} className="text-lg font-bold mb-1.5">{line.slice(3)}</h2>;
                    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mb-1">{line.slice(4)}</h3>;
                    if (line.startsWith("- ") || line.startsWith("* "))
                      return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>;
                    if (/^\d+\./.test(line))
                      return <li key={i} className="ml-4 list-decimal text-sm">{line.replace(/^\d+\.\s*/, "")}</li>;
                    return <p key={i} className="mb-1.5 text-sm leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Action bar: Save / Share / Follow-up ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* Save */}
            <button
              onClick={openSavePanel}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 text-center transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Speichern</p>
                <p className="text-xs text-muted-foreground mt-0.5">Als Lernkarten sichern</p>
              </div>
            </button>

            {/* Share */}
            <button
              onClick={shareExplanation}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 text-center transition-all hover:border-blue-400/40 hover:bg-blue-500/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Teilen</p>
                <p className="text-xs text-muted-foreground mt-0.5">Erklärung weiterschicken</p>
              </div>
            </button>

            {/* Follow-up */}
            <button
              onClick={() => setShowFollowUp((p) => !p)}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 text-center transition-all hover:border-violet-400/40 hover:bg-violet-500/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nachfragen</p>
                <p className="text-xs text-muted-foreground mt-0.5">Konkrete Frage stellen</p>
              </div>
            </button>
          </div>

          {/* ── Follow-up input ── */}
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
                    {followUpLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <ChevronRight className="h-4 w-4" />
                    }
                    Fragen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Save panel ── */}
          {showSavePanel && (
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Als Lernkarten speichern</p>
                  <button onClick={() => setShowSavePanel(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Generated cards preview */}
                {generatingCards ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Karten werden generiert…
                  </div>
                ) : generatedCards.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {generatedCards.length} Karten generiert
                    </p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {generatedCards.map((c, i) => (
                        <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2.5">
                          <p className="text-xs font-semibold text-foreground">{c.front}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{c.back}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Deck picker */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Deck auswählen</label>
                  {allDecks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Noch kein Deck vorhanden —{" "}
                      <Link href="/create" className="text-primary underline">Deck erstellen</Link>
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

                {/* Save button */}
                {cardsSaved ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Karten gespeichert!{" "}
                    <Link href="/dashboard" className="ml-auto font-bold underline underline-offset-2 hover:opacity-80">
                      Dashboard →
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={saveCards}
                      disabled={savingCards || generatedCards.length === 0 || !selectedDeckId}
                      className="flex-1 gap-2"
                    >
                      {savingCards
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <BookOpen className="h-4 w-4" />
                      }
                      {generatedCards.length > 0
                        ? `${generatedCards.length} Karten speichern`
                        : "Speichern"
                      }
                    </Button>
                    <Button variant="outline" onClick={() => setShowSavePanel(false)}>
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
