"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb, Clock,
  CalendarDays, Sparkles, MessageSquare, Send, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeckById } from "@/lib/data";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "leicht" | "mittel" | "schwer";
type RetroConfidence = "rot" | "gelb" | "gruen";

interface CalendarEvent { id: string; date: string; title: string; type: string; }
interface RetroTopic { id: string; name: string; confidence: RetroConfidence; sessions: string[]; }
interface RetroSubject { id: string; name: string; topics: RetroTopic[]; expanded: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(iso: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  return Math.ceil((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
}

function addToRetro(deckTitle: string, category: string, pct: number) {
  const confidence: RetroConfidence = pct >= 80 ? "gruen" : pct >= 50 ? "gelb" : "rot";
  const stored = localStorage.getItem("synapze-retro");
  const subjects: RetroSubject[] = stored ? JSON.parse(stored) : [];
  let subject = subjects.find(s => s.name.toLowerCase() === category.toLowerCase());
  if (!subject) {
    subject = { id: crypto.randomUUID(), name: category, topics: [], expanded: true };
    subjects.push(subject);
  }
  const existing = subject.topics.find(t => t.name === deckTitle);
  if (existing) {
    existing.confidence = confidence;
  } else {
    subject.topics.push({ id: crypto.randomUUID(), name: deckTitle, confidence, sessions: [] });
  }
  localStorage.setItem("synapze-retro", JSON.stringify(subjects));
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const params = useParams();
  const id = params.id as string;
  const deck = getDeckById(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [learning, setLearning] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  // 20s auto-reveal
  const [autoRevealSecs, setAutoRevealSecs] = useState(20);
  const [autoRevealActive, setAutoRevealActive] = useState(true);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parkinson
  const [upcomingExam, setUpcomingExam] = useState<CalendarEvent | null>(null);

  // AI explanation
  const [aiLevel, setAiLevel] = useState<Level | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Retro
  const [retroAdded, setRetroAdded] = useState(false);

  // Load calendar events
  useEffect(() => {
    const raw = localStorage.getItem("synapze-calendar-events");
    if (!raw || !deck) return;
    const events: CalendarEvent[] = JSON.parse(raw);
    const deckKeywords = deck.title.toLowerCase().split(" ");
    const relevant = events
      .filter(e => {
        const diff = daysFromNow(e.date);
        if (diff < 0) return false;
        return deckKeywords.some(kw => kw.length > 2 && e.title.toLowerCase().includes(kw));
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    setUpcomingExam(relevant[0] ?? null);
  }, [deck]);

  // 20s countdown — resets on each new card
  useEffect(() => {
    if (!autoRevealActive || isFlipped) {
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);
      return;
    }
    setAutoRevealSecs(20);
    revealTimerRef.current = setInterval(() => {
      setAutoRevealSecs(prev => {
        if (prev <= 1) {
          clearInterval(revealTimerRef.current!);
          setIsFlipped(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (revealTimerRef.current) clearInterval(revealTimerRef.current); };
  }, [currentIndex, autoRevealActive, isFlipped]);

  // Keyboard shortcuts: Space = flip / Kann ich · 1 / Backspace / Delete = Nochmal
  useEffect(() => {
    if (isDone) return;
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const cardId = deck?.cards[currentIndex]?.id;
      if (!cardId) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          setKnown(p => [...p, cardId]);
          advance();
        }
      }
      if ((e.code === "Digit1" || e.key === "1" || e.key === "Backspace" || e.key === "Delete") && isFlipped) {
        e.preventDefault();
        setLearning(p => [...p, cardId]);
        advance();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, isDone, currentIndex, deck]);

  // Reset AI state when card changes
  useEffect(() => {
    setAiLevel(null);
    setAiText("");
    setAiLoading(false);
    setChatOpen(false);
    setChatMessages([]);
    setChatInput("");
    aiAbortRef.current?.abort();
  }, [currentIndex]);

  // Fetch AI explanation when level is selected
  useEffect(() => {
    if (!aiLevel || !deck) return;
    const card = deck.cards[currentIndex];
    if (!card) return;
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    setAiText("");
    setAiLoading(true);
    streamExplain(
      { front: card.front, back: card.back, level: aiLevel },
      chunk => setAiText(prev => prev + chunk),
      ctrl.signal,
    ).finally(() => setAiLoading(false));
  }, [aiLevel, currentIndex]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium">Deck nicht gefunden.</p>
        <Button asChild variant="outline"><Link href="/decks">Zurück zu Decks</Link></Button>
      </div>
    );
  }

  const cards = deck.cards;
  const currentCard = cards[currentIndex];
  const handleFlip = () => setIsFlipped(f => !f);

  const handleKnow = () => { setKnown(p => [...p, currentCard.id]); advance(); };
  const handleLearn = () => { setLearning(p => [...p, currentCard.id]); advance(); };

  function advance() {
    setIsFlipped(false);
    if (currentIndex + 1 >= cards.length) {
      setIsDone(true);
    } else {
      setTimeout(() => setCurrentIndex(i => i + 1), 150);
    }
  }

  function handleRestart() {
    setCurrentIndex(0); setIsFlipped(false);
    setKnown([]); setLearning([]); setIsDone(false); setRetroAdded(false);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !deck) return;
    const card = deck.cards[currentIndex];
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: question }]);
    chatAbortRef.current?.abort();
    const ctrl = new AbortController();
    chatAbortRef.current = ctrl;
    setChatLoading(true);
    setChatMessages(prev => [...prev, { role: "ai", text: "" }]);
    await streamExplain(
      { front: card.front, back: card.back, mode: "chat", userQuestion: question },
      chunk => setChatMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "ai") copy[copy.length - 1] = { ...last, text: last.text + chunk };
        return copy;
      }),
      ctrl.signal,
    );
    setChatLoading(false);
  }

  // ── Auswertung (Results Screen) ────────────────────────────────────────────
  if (isDone) {
    const score = known.length;
    const pct = Math.round((score / cards.length) * 100);
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-16 text-center">
        <div>
          <div className="text-6xl mb-4">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}</div>
          <h2 className="text-3xl font-bold">Lernrunde beendet!</h2>
          <p className="mt-1 text-muted-foreground">{deck.emoji} {deck.title}</p>
        </div>

        {/* Score card */}
        <div className="w-full rounded-2xl border bg-card p-6 space-y-4">
          <p className="text-5xl font-bold text-primary tabular-nums">{pct}%</p>
          <p className="text-muted-foreground">{score} von {cards.length} Karten gewusst</p>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-3 rounded-full transition-all duration-700",
                pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-bold">{known.length}</span>&nbsp;Kann ich!
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
              <span className="font-bold">{learning.length}</span>&nbsp;Nochmal
            </div>
          </div>
        </div>

        {/* Retro-Timetable */}
        <div className="w-full rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-left">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Retro-Timetable</p>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {pct < 70
              ? `Du hattest ${100 - pct}% Fehlerquote. Soll "${deck.title}" als schwaches Thema markiert werden?`
              : `Gute Leistung! Möchtest du "${deck.title}" im Retro-Timetable als ${pct >= 80 ? "gut (🟢)" : "okay (🟡)"} markieren?`}
          </p>
          {retroAdded ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Zum Retro-Timetable hinzugefügt!
            </div>
          ) : (
            <button
              onClick={() => { addToRetro(deck.title, deck.category, pct); setRetroAdded(true); }}
              className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-500/20 dark:text-violet-400"
            >
              Zu Retro-Timetable hinzufügen →
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={handleRestart} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />Nochmal
          </Button>
          <Button asChild size="lg">
            <Link href={`/quiz/${deck.id}`}>Zum Prüfungsmodus →</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Study View ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">

      {/* Parkinson's Law Banner */}
      {upcomingExam && (() => {
        const diff = daysFromNow(upcomingExam.date);
        const urgency = diff <= 3
          ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
          : diff <= 7
            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400";
        return (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${urgency}`}>
            <CalendarDays className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{upcomingExam.title}</p>
              <p className="text-xs opacity-80">Parkinson-Gesetz: Nutze den Druck!</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-black tabular-nums leading-none">{diff}</p>
              <p className="text-[10px] opacity-70">Tage</p>
            </div>
          </div>
        );
      })()}

      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">{deck.emoji} {deck.title}</p>
        </div>
        <button
          onClick={() => setAutoRevealActive(a => !a)}
          title="20s Auto-Aufdecken"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            autoRevealActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {autoRevealActive && !isFlipped ? `${autoRevealSecs}s` : "20s"}
        </button>
        <p className="text-sm font-semibold tabular-nums">{currentIndex + 1} / {cards.length}</p>
      </div>

      {/* Quizlet-style progress */}
      {(() => {
        const answered = known.length + learning.length;
        const pct = cards.length > 0 ? (answered / cards.length) * 100 : 0;
        return (
          <div className="flex items-center gap-3">
            {/* Left: answered count */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white tabular-nums shadow-sm">
              {answered}
            </div>
            {/* Bar */}
            <div className="relative flex-1 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Right: total count */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground tabular-nums">
              {cards.length}
            </div>
          </div>
        );
      })()}

      {/* Flashcard */}
      <div
        className="flip-card-container cursor-pointer"
        style={{ height: "280px" }}
        onClick={handleFlip}
      >
        <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
          <div className="flip-card-face flip-card-front">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 bg-card p-8 shadow-lg transition-shadow hover:shadow-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frage</p>
              <p className="text-center text-2xl font-semibold leading-snug">{currentCard.front}</p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />Tippe zum Umdrehen
              </div>
            </div>
          </div>
          <div className="flip-card-face flip-card-back">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 shadow-lg">
              <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Lightbulb className="h-3.5 w-3.5" />Antwort
              </div>
              <p className="text-center text-2xl font-semibold leading-snug">{currentCard.back}</p>
              {currentCard.backImageUrl && (
                <div className="mt-5 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentCard.backImageUrl}
                    alt="Antwortbild"
                    className="max-h-28 max-w-full rounded-xl object-contain shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Erklärung Panel (visible after flip) ── */}
      {isFlipped && (
        <div className="overflow-hidden rounded-xl border border-violet-500/20 bg-violet-500/5">
          {/* Header + Level buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">thaura.ai Erklärung</span>
            </div>
            <div className="flex gap-1.5">
              {(["leicht", "mittel", "schwer"] as Level[]).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setAiLevel(aiLevel === lvl ? null : lvl)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-all",
                    aiLevel === lvl
                      ? lvl === "leicht"
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : lvl === "mittel"
                          ? "border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-400"
                          : "border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-400"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {lvl === "leicht" ? "🟢 Leicht" : lvl === "mittel" ? "🟡 Mittel" : "🔴 Schwer"}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation text */}
          {(aiLevel || aiText) && (
            <div className="border-t border-violet-500/10 px-4 py-3">
              {aiLoading && !aiText ? (
                <div className="flex animate-pulse items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />Analysiere…
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground">
                  {aiText}
                  {aiLoading && (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-violet-500 align-middle" />
                  )}
                </p>
              )}
            </div>
          )}

          {/* Chat toggle */}
          <div className="border-t border-violet-500/10">
            <button
              onClick={() => setChatOpen(o => !o)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              KI fragen…
              {chatOpen ? <ChevronUp className="ml-auto h-3.5 w-3.5" /> : <ChevronDown className="ml-auto h-3.5 w-3.5" />}
            </button>

            {chatOpen && (
              <div className="border-t border-violet-500/10 bg-background/50">
                {/* Messages */}
                <div className="max-h-48 overflow-y-auto space-y-2 px-4 py-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Stelle eine Frage zu dieser Karte…</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-xs",
                          msg.role === "user"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {msg.text || (chatLoading && msg.role === "ai" ? "…" : "")}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                {/* Input */}
                <div className="flex items-center gap-2 border-t border-violet-500/10 px-3 py-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder="Frage eingeben… (Enter)"
                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons — icon only */}
      <div
        className={cn(
          "flex justify-center gap-5 transition-all duration-300",
          isFlipped ? "opacity-100" : "opacity-40 pointer-events-none",
        )}
      >
        <button
          onClick={handleLearn}
          title="Kann ich nicht"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition-all hover:bg-rose-600 hover:scale-105 active:scale-95"
        >
          <XCircle className="h-8 w-8" />
        </button>
        <button
          onClick={handleKnow}
          title="Kann ich!"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95"
        >
          <CheckCircle2 className="h-8 w-8" />
        </button>
      </div>

      {!isFlipped && (
        <p className="text-center text-xs text-muted-foreground">
          Drehe die Karte um, um die Antwort zu sehen
        </p>
      )}
    </div>
  );
}
