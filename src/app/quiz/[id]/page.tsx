"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, BookOpen,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/lib/data";
import { getAllDecks } from "@/lib/store";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  card: Card;
  options: string[];
  correctAnswer: string;
}

type RetroConfidence = "rot" | "gelb" | "gruen";
interface RetroTopic { id: string; name: string; confidence: RetroConfidence; sessions: string[]; }
interface RetroSubject { id: string; name: string; topics: RetroTopic[]; expanded: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function generateQuestions(cards: Card[]): QuizQuestion[] {
  return cards.map(card => {
    const others = cards.filter(c => c.id !== card.id);
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    const wrong = shuffled.slice(0, Math.min(3, shuffled.length)).map(c => c.back);
    const options = [...wrong, card.back].sort(() => Math.random() - 0.5);
    return { card, options, correctAnswer: card.back };
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const params = useParams();
  const id = params.id as string;
  const [deck, setDeck] = useState(() => getAllDecks().find((d) => d.id === id) ?? null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [retroAdded, setRetroAdded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    const allDecks = getAllDecks();
    const foundDeck = allDecks.find((d) => d.id === id) ?? null;
    setDeck(foundDeck);
    if (!foundDeck) return;
    const includeSubDecks = new URLSearchParams(window.location.search).get("includeSubDecks") === "true";
    let allCards = [...foundDeck.cards];
    if (includeSubDecks) {
      allDecks.filter((d) => d.parentId === id).forEach((sub) => { allCards = [...allCards, ...sub.cards]; });
    }
    const qs = generateQuestions(allCards);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
  }, [id]);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium">Deck nicht gefunden.</p>
        <Button asChild variant="outline"><Link href="/dashboard">Zurück</Link></Button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;
  const answeredCount = answers.filter(a => a !== null).length;

  function handleAnswer(answer: string) {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const next = [...answers];
    next[currentIndex] = answer;
    setAnswers(next);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setIsDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
    }
  }

  function handleRestart() {
    const qs = generateQuestions(deck!.cards);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsDone(false);
    setRetroAdded(false);
    setReviewOpen(false);
  }

  // ── Auswertung (Results) ────────────────────────────────────────────────────
  if (isDone) {
    const score = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    const pct = Math.round((score / questions.length) * 100);
    const wrongQuestions = questions.filter((q, i) => answers[i] !== q.correctAnswer);
    const stars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;

    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-16 text-center">
        <div>
          <Trophy
            className={cn(
              "mx-auto mb-3 h-14 w-14",
              pct >= 80 ? "text-amber-500" : pct >= 50 ? "text-violet-500" : "text-rose-500",
            )}
          />
          <h2 className="text-3xl font-bold">Prüfungsmodus beendet!</h2>
          <p className="mt-1 text-muted-foreground">{deck.emoji} {deck.title}</p>
        </div>

        {/* Score card */}
        <div className="w-full rounded-2xl border bg-card p-6 space-y-4">
          <p className="text-6xl font-bold text-primary tabular-nums">{pct}%</p>
          <p className="text-muted-foreground">{score} von {questions.length} richtig</p>
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
              <CheckCircle2 className="h-4 w-4" /><span className="font-bold">{score}</span>&nbsp;Richtig
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" /><span className="font-bold">{wrongQuestions.length}</span>&nbsp;Falsch
            </div>
          </div>
          <div className="flex justify-center gap-1 text-2xl">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>{i < stars ? "⭐" : "☆"}</span>
            ))}
          </div>
        </div>

        {/* Wrong answers review */}
        {wrongQuestions.length > 0 && (
          <div className="w-full overflow-hidden rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/10">
            <button
              onClick={() => setReviewOpen(o => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-400"
            >
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {wrongQuestions.length} falsch beantwortete {wrongQuestions.length === 1 ? "Frage" : "Fragen"}
              </span>
              {reviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {reviewOpen && (
              <div className="divide-y divide-rose-100 border-t border-rose-200 dark:divide-rose-900/50 dark:border-rose-900">
                {wrongQuestions.map((q, i) => (
                  <div key={i} className="px-4 py-3 text-left space-y-1">
                    <p className="text-sm font-medium">{q.card.front}</p>
                    <p className="text-xs text-muted-foreground">
                      Deine Antwort:{" "}
                      <span className="text-rose-600 dark:text-rose-400">
                        {answers[questions.indexOf(q)] ?? "–"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Richtig:{" "}
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {q.correctAnswer}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Retro-Timetable */}
        <div className="w-full rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-left">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Retro-Timetable</p>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {pct < 70
              ? `Ergebnis: ${pct}% — "${deck.title}" braucht mehr Aufmerksamkeit.`
              : `Ergebnis: ${pct}% — "${deck.title}" sitzt ${pct >= 80 ? "gut (🟢)" : "okay (🟡)"}.`}
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
            <Link href={`/study/${deck.id}`}>Lernmodus →</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Exam View ──────────────────────────────────────────────────────────────
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">{deck.emoji} {deck.title}</p>
        </div>
        <div className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          🎓 Prüfungsmodus
        </div>
        <p className="text-sm font-semibold tabular-nums text-muted-foreground">
          {answeredCount}/{questions.length}
        </p>
      </div>

      {/* Progress */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Frage {currentIndex + 1} von {questions.length}</p>
        <p className="text-xs italic text-muted-foreground">Auswertung erst am Ende</p>
      </div>

      {/* Question */}
      <div className="rounded-2xl border-2 bg-card p-6 shadow-sm">
        <p className="text-center text-xl font-semibold leading-snug">{currentQuestion.card.front}</p>
      </div>

      {/* Options — no correct/wrong feedback during exam */}
      <div className="grid gap-3">
        {currentQuestion.options.map((option, i) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left text-sm font-medium transition-all",
              !selectedAnswer
                ? "cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                : option === selectedAnswer
                  ? "cursor-default border-primary bg-primary/10 text-foreground"
                  : "cursor-default border-border bg-muted/40 text-muted-foreground",
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {optionLabels[i]}
            </span>
            <span className="flex-1 leading-snug">{option}</span>
          </button>
        ))}
      </div>

      {/* Next button (shown after selecting) */}
      {selectedAnswer && (
        <div className="flex justify-end">
          <Button onClick={handleNext}>
            {currentIndex + 1 >= questions.length ? "Auswertung →" : "Nächste Frage →"}
          </Button>
        </div>
      )}
    </div>
  );
}
