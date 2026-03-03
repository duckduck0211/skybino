"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RotateCcw, Lightbulb, Clock,
  CalendarDays, Sparkles, MessageSquare, Send, ChevronDown, ChevronUp, BookOpen, PenLine, X, ImagePlus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDecks, getStudyQueue, getStudyQueueForDecks, getSRSState, setSRSState, getDeckSRSSettings, getStudyMode, updateCard } from "@/lib/store";
import type { QueueItem } from "@/lib/store";
import { schedule, previewIntervals } from "@/lib/srs";
import type { Rating } from "@/lib/srs";
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

// ─── Rating button config ─────────────────────────────────────────────────────

const RATING_CONFIG = [
  { rating: 1 as Rating, label: "Nochmal", bg: "bg-rose-500/10 hover:bg-rose-500/20",   text: "text-rose-600 dark:text-rose-400",   border: "border-rose-500/20" },
  { rating: 2 as Rating, label: "Schwer",  bg: "bg-amber-500/10 hover:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  { rating: 3 as Rating, label: "Gut",     bg: "bg-emerald-500/10 hover:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  { rating: 4 as Rating, label: "Leicht",  bg: "bg-blue-500/10 hover:bg-blue-500/20",   text: "text-blue-600 dark:text-blue-400",   border: "border-blue-500/20" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudyPage() {
  const params = useParams();
  const deckId = params.id as string;

  const studyMode = getStudyMode();

  // Deck meta (title, emoji, category)
  const deck = getAllDecks().find((d) => d.id === deckId) ?? null;

  // ── Session queue ──────────────────────────────────────────────────────────
  const [queue, setQueue]       = useState<QueueItem[]>([]);
  const [pos, setPos]           = useState(0);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());
  const [isDone, setIsDone]     = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [lapses, setLapses]     = useState(0);

  const includeSubDecks = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("includeSubDecks") === "true"
    : false;

  const buildQueue = () => {
    if (includeSubDecks) {
      const subIds = getAllDecks().filter((d) => d.parentId === deckId).map((d) => d.id);
      return getStudyQueueForDecks([deckId, ...subIds]);
    }
    return getStudyQueue(deckId);
  };

  useEffect(() => {
    const q = buildQueue();
    setQueue(q);
    if (q.length === 0) setIsDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const currentItem = queue[pos] ?? null;
  const currentCard = currentItem?.card ?? null;
  const currentSRS  = currentItem ? getSRSState(currentItem.deckId, currentItem.card.id) : null;
  const deckSettings = getDeckSRSSettings(currentItem?.deckId ?? deckId);
  const previews    = previewIntervals(currentSRS, deckSettings);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isFlipped, setIsFlipped] = useState(false);

  // 20s auto-reveal
  const [autoRevealSecs, setAutoRevealSecs]     = useState(20);
  const [autoRevealActive, setAutoRevealActive] = useState(true);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parkinson
  const [upcomingExam, setUpcomingExam] = useState<CalendarEvent | null>(null);

  // AI explanation
  const [aiLevel, setAiLevel]   = useState<Level | null>(null);
  const [aiText, setAiText]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);

  // Chat
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatInput, setChatInput]     = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatEndRef   = useRef<HTMLDivElement>(null);

  // Retro
  const [retroAdded, setRetroAdded] = useState(false);

  // Card edit modal
  const [editOpen, setEditOpen]           = useState(false);
  const [editFront, setEditFront]         = useState("");
  const [editBack, setEditBack]           = useState("");
  const [editFrontImage, setEditFrontImage] = useState<string | null>(null);
  const [editBackImage, setEditBackImage]   = useState<string | null>(null);
  const frontImgRef = useRef<HTMLInputElement>(null);
  const backImgRef  = useRef<HTMLInputElement>(null);

  function openEdit() {
    if (!currentCard) return;
    setEditFront(currentCard.front);
    setEditBack(currentCard.back);
    setEditFrontImage(currentCard.frontImageUrl ?? null);
    setEditBackImage(currentCard.backImageUrl ?? null);
    setEditOpen(true);
  }

  function saveEdit() {
    if (!currentItem) return;
    const front = editFront.trim() || currentCard!.front;
    const back  = editBack.trim()  || currentCard!.back;
    // store accepts null (= explicitly removed)
    updateCard(currentItem.deckId, currentItem.card.id, {
      front, back,
      frontImageUrl: editFrontImage,
      backImageUrl:  editBackImage,
    });
    // Card type only accepts string | undefined, so null → undefined
    setQueue(q => q.map((item, i) =>
      i === pos
        ? { ...item, card: { ...item.card, front, back,
            frontImageUrl: editFrontImage ?? undefined,
            backImageUrl:  editBackImage  ?? undefined } }
        : item,
    ));
    setEditOpen(false);
  }

  function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (side === "front") setEditFrontImage(url);
      else setEditBackImage(url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Load calendar events ───────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("synapze-calendar-events");
    if (!raw || !deck) return;
    const events: CalendarEvent[] = JSON.parse(raw);
    const keywords = deck.title.toLowerCase().split(" ");
    const relevant = events
      .filter(e => {
        const diff = daysFromNow(e.date);
        if (diff < 0) return false;
        return keywords.some(kw => kw.length > 2 && e.title.toLowerCase().includes(kw));
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    setUpcomingExam(relevant[0] ?? null);
  }, [deck]);

  // ── 20s auto-reveal countdown ─────────────────────────────────────────────
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
  }, [pos, autoRevealActive, isFlipped]);

  // ── Reset AI/chat on card change ───────────────────────────────────────────
  useEffect(() => {
    setAiLevel(null);
    setAiText("");
    setAiLoading(false);
    setChatOpen(false);
    setChatMessages([]);
    setChatInput("");
    aiAbortRef.current?.abort();
  }, [pos]);

  // ── Fetch AI explanation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!aiLevel || !currentCard) return;
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    setAiText("");
    setAiLoading(true);
    streamExplain(
      { front: currentCard.front, back: currentCard.back, level: aiLevel },
      chunk => setAiText(prev => prev + chunk),
      ctrl.signal,
    ).finally(() => setAiLoading(false));
  }, [aiLevel, pos]);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    if (isDone || !currentCard) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!isFlipped) setIsFlipped(true);
        else rate(3); // Space after flip = Good
      }
      if (isFlipped) {
        if (studyMode === "simple") {
          if (e.key === "1") { e.preventDefault(); rate(1); }
        } else {
          if (e.key === "1") { e.preventDefault(); rate(1); }
          if (e.key === "2") { e.preventDefault(); rate(2); }
          if (e.key === "3") { e.preventDefault(); rate(3); }
          if (e.key === "4") { e.preventDefault(); rate(4); }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, isDone, pos, currentCard]);

  // ── Core rating handler ────────────────────────────────────────────────────
  const rate = useCallback((r: Rating) => {
    if (!currentItem) return;
    const { card, deckId: cardDeckId } = currentItem;
    const prevSRS = getSRSState(cardDeckId, card.id);
    const cardSettings = getDeckSRSSettings(cardDeckId);
    const newSRS  = schedule(prevSRS, r, cardSettings);
    setSRSState(cardDeckId, card.id, newSRS);

    setReviewed(n => n + 1);
    if (r === 1) setLapses(n => n + 1);

    if (r === 1 && !requeued.has(card.id)) {
      // Requeue once at the end of the session
      setRequeued(s => new Set([...s, card.id]));
      setQueue(q => [...q, { ...currentItem, srs: newSRS }]);
    }

    setIsFlipped(false);
    setTimeout(() => {
      setPos(p => {
        const next = p + 1;
        if (next >= queue.length + (r === 1 && !requeued.has(card.id) ? 1 : 0)) {
          setIsDone(true);
          return p;
        }
        return next;
      });
    }, 150);
  }, [currentItem, deckId, queue.length, requeued]);

  // ── Chat ──────────────────────────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !currentCard) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: question }]);
    chatAbortRef.current?.abort();
    const ctrl = new AbortController();
    chatAbortRef.current = ctrl;
    setChatLoading(true);
    setChatMessages(prev => [...prev, { role: "ai", text: "" }]);
    await streamExplain(
      { front: currentCard.front, back: currentCard.back, mode: "chat", userQuestion: question },
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

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium">Deck nicht gefunden.</p>
        <Button asChild variant="outline"><Link href="/decks">Zurück zu Decks</Link></Button>
      </div>
    );
  }

  // ── Empty queue ────────────────────────────────────────────────────────────
  if (isDone && reviewed === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-20 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold">Keine fälligen Karten</h2>
        <p className="text-muted-foreground">
          {deck.emoji} {deck.title} — alle Karten sind für heute erledigt!
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Zurück zum Dashboard</Link>
        </Button>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (isDone) {
    const pct = reviewed > 0 ? Math.round(((reviewed - lapses) / reviewed) * 100) : 0;
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-16 text-center">
        <div>
          <div className="text-6xl mb-4">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}</div>
          <h2 className="text-3xl font-bold">Lernrunde beendet!</h2>
          <p className="mt-1 text-muted-foreground">{deck.emoji} {deck.title}</p>
        </div>

        <div className="w-full rounded-2xl border bg-card p-6 space-y-4">
          <p className="text-5xl font-bold text-primary tabular-nums">{pct}%</p>
          <p className="text-muted-foreground">{reviewed - lapses} von {reviewed} Karten gewusst</p>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-3 rounded-full transition-all duration-700",
                pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-center gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-emerald-700 dark:text-emerald-400">
              <span className="font-bold">{reviewed - lapses}</span>&nbsp;Gewusst
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-rose-600 dark:text-rose-400">
              <span className="font-bold">{lapses}</span>&nbsp;Nochmal
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-3 text-muted-foreground">
              <span className="font-bold">{reviewed}</span>&nbsp;Gesamt
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
              ✓ Zum Retro-Timetable hinzugefügt!
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
          <Button onClick={() => { setPos(0); setReviewed(0); setLapses(0); setIsDone(false); setRetroAdded(false); setQueue(buildQueue()); setRequeued(new Set()); }} variant="outline" size="lg">
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

  if (!currentCard) return null;

  // ── Queue stats for top bar ────────────────────────────────────────────────
  const remaining = queue.length - pos;
  const newCount  = queue.slice(pos).filter(i => !i.srs).length;
  const revCount  = queue.slice(pos).filter(i => i.srs && i.srs.cardState === "review").length;
  const lrnCount  = remaining - newCount - revCount;

  // ── Study view ─────────────────────────────────────────────────────────────
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
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground text-center">{deck.emoji} {deck.title}</p>
        </div>
        <button
          onClick={() => setAutoRevealActive(a => !a)}
          title="20s Auto-Aufdecken"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all shrink-0",
            autoRevealActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {autoRevealActive && !isFlipped ? `${autoRevealSecs}s` : "20s"}
        </button>
        <button
          onClick={openEdit}
          title="Karte bearbeiten"
          className="flex items-center justify-center rounded-lg bg-muted px-2.5 py-1.5 text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground shrink-0"
        >
          <PenLine className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Queue progress */}
      <div className="flex items-center gap-3">
        {studyMode === "expert" && (
          <div className="flex h-8 shrink-0 items-center gap-2 rounded-full bg-muted px-3 text-xs font-medium">
            {newCount > 0 && <span className="text-blue-500 font-bold">{newCount} Neu</span>}
            {revCount > 0 && <span className="text-emerald-600 font-bold">{revCount} Wdh.</span>}
            {lrnCount > 0 && <span className="text-amber-500 font-bold">{lrnCount} Lernen</span>}
          </div>
        )}
        <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${queue.length > 0 ? (pos / queue.length) * 100 : 0}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
          {pos + 1} / {queue.length}
        </span>
      </div>

      {/* Flashcard */}
      <div
        className="flip-card-container cursor-pointer"
        style={{ height: "280px" }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
          <div className="flip-card-face flip-card-front">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 bg-card p-8 shadow-lg transition-shadow hover:shadow-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frage</p>
              <p className="text-center text-2xl font-semibold leading-snug">{currentCard.front}</p>
              {currentCard.frontImageUrl && (
                <div className="mt-5 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentCard.frontImageUrl} alt="Fragenbild" className="max-h-28 max-w-full rounded-xl object-contain shadow-sm" />
                </div>
              )}
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

      {/* AI Erklärung Panel */}
      {isFlipped && studyMode === "expert" && (
        <div className="overflow-hidden rounded-xl border border-violet-500/20 bg-violet-500/5">
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
          {(aiLevel || aiText) && (
            <div className="border-t border-violet-500/10 px-4 py-3">
              {aiLoading && !aiText ? (
                <div className="flex animate-pulse items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />Analysiere…
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground">
                  {aiText}
                  {aiLoading && <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-violet-500 align-middle" />}
                </p>
              )}
            </div>
          )}
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
                <div className="max-h-48 overflow-y-auto space-y-2 px-4 py-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Stelle eine Frage zu dieser Karte…</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-xs",
                          msg.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                      >
                        {msg.text || (chatLoading && msg.role === "ai" ? "…" : "")}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
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

      {/* ── Rating buttons ── */}
      {studyMode === "simple" ? (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 transition-all duration-300",
            isFlipped ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <button
            onClick={() => rate(1)}
            className="flex flex-col items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 py-5 px-4 transition-all active:scale-95 hover:bg-rose-500/20"
          >
            <span className="text-2xl mb-1">✗</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400">Nochmal</span>
          </button>
          <button
            onClick={() => rate(3)}
            className="flex flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 py-5 px-4 transition-all active:scale-95 hover:bg-emerald-500/20"
          >
            <span className="text-2xl mb-1">✓</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">Wusste ich</span>
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-4 gap-2 transition-all duration-300",
            isFlipped ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {RATING_CONFIG.map(({ rating, label, bg, text, border }, i) => (
            <button
              key={rating}
              onClick={() => rate(rating)}
              className={cn(
                "flex flex-col items-center rounded-xl border py-3 px-2 transition-all active:scale-95",
                bg, text, border,
              )}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="mt-0.5 text-[11px] opacity-60">{previews[i]}</span>
            </button>
          ))}
        </div>
      )}

      {!isFlipped && (
        <p className="text-center text-xs text-muted-foreground">
          {studyMode === "simple"
            ? <>Tippe die Karte um · dann <kbd className="rounded border px-1 font-mono text-[10px]">Leertaste</kbd></>
            : <>Tippe die Karte um · dann <kbd className="rounded border px-1 font-mono text-[10px]">1</kbd>–<kbd className="rounded border px-1 font-mono text-[10px]">4</kbd> oder <kbd className="rounded border px-1 font-mono text-[10px]">Leertaste</kbd></>
          }
        </p>
      )}

      {/* ── Card edit modal ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Karte bearbeiten</span>
              </div>
              <button onClick={() => setEditOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5">
              {/* Vorderseite */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vorderseite</label>
                <textarea
                  value={editFront}
                  onChange={e => setEditFront(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  placeholder="Vorderseite…"
                />
                {editFrontImage ? (
                  <div className="relative inline-flex">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editFrontImage} alt="Vorderseitenbild" className="h-24 rounded-xl object-contain border" />
                    <button
                      onClick={() => setEditFrontImage(null)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => frontImgRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />Bild hinzufügen
                  </button>
                )}
                <input ref={frontImgRef} type="file" accept="image/*" className="hidden" onChange={e => handleImgUpload(e, "front")} />
              </div>

              {/* Rückseite */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rückseite</label>
                <textarea
                  value={editBack}
                  onChange={e => setEditBack(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  placeholder="Rückseite…"
                />
                {editBackImage ? (
                  <div className="relative inline-flex">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editBackImage} alt="Rückseitenbild" className="h-24 rounded-xl object-contain border" />
                    <button
                      onClick={() => setEditBackImage(null)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => backImgRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />Bild hinzufügen
                  </button>
                )}
                <input ref={backImgRef} type="file" accept="image/*" className="hidden" onChange={e => handleImgUpload(e, "back")} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={saveEdit}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
