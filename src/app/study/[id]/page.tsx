"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, X, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeckById } from "@/lib/data";

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const deck = getDeckById(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [learning, setLearning] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium">Deck nicht gefunden.</p>
        <Button asChild variant="outline">
          <Link href="/decks">Zurück zu Decks</Link>
        </Button>
      </div>
    );
  }

  const cards = deck.cards;
  const currentCard = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  const handleFlip = () => setIsFlipped((f) => !f);

  const handleKnow = () => {
    setKnown((prev) => [...prev, currentCard.id]);
    advance();
  };

  const handleLearn = () => {
    setLearning((prev) => [...prev, currentCard.id]);
    advance();
  };

  const advance = () => {
    setIsFlipped(false);
    if (currentIndex + 1 >= cards.length) {
      setIsDone(true);
    } else {
      setTimeout(() => setCurrentIndex((i) => i + 1), 150);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown([]);
    setLearning([]);
    setIsDone(false);
  };

  if (isDone) {
    const score = known.length;
    const pct = Math.round((score / cards.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
        <div>
          <div className="text-6xl mb-4">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}</div>
          <h2 className="text-3xl font-bold">Runde beendet!</h2>
          <p className="mt-2 text-muted-foreground">Du hast alle {cards.length} Karten durchgelernt.</p>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 px-8 py-5 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
            <p className="text-3xl font-bold">{known.length}</p>
            <p className="text-sm font-medium">Kann ich!</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-rose-50 px-8 py-5 text-rose-600">
            <XCircle className="h-6 w-6" />
            <p className="text-3xl font-bold">{learning.length}</p>
            <p className="text-sm font-medium">Nochmal lernen</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-5xl font-bold text-primary">{pct}%</p>
          <p className="text-sm text-muted-foreground mt-1">Trefferquote</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={handleRestart} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />
            Nochmal von vorne
          </Button>
          <Button asChild size="lg">
            <Link href={`/quiz/${deck.id}`}>
              Zum Quiz →
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/decks">Zurück zu Decks</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/decks">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {deck.emoji} {deck.title}
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 text-sm">
        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {known.length} Kann ich
        </span>
        <span className="flex items-center gap-1.5 text-rose-500 font-medium">
          <XCircle className="h-4 w-4" />
          {learning.length} Nochmal
        </span>
      </div>

      {/* Flashcard */}
      <div
        className="flip-card-container cursor-pointer"
        style={{ height: "320px" }}
        onClick={handleFlip}
      >
        <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front */}
          <div className="flip-card-face flip-card-front">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 bg-card p-8 shadow-lg hover:shadow-xl transition-shadow">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Frage
              </p>
              <p className="text-center text-2xl font-semibold leading-snug">
                {currentCard.front}
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Tippe zum Umdrehen
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-face flip-card-back">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 shadow-lg">
              <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Lightbulb className="h-3.5 w-3.5" />
                Antwort
              </div>
              <p className="text-center text-2xl font-semibold leading-snug">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`grid gap-3 transition-all duration-300 ${isFlipped ? "grid-cols-2 opacity-100" : "grid-cols-1 opacity-40 pointer-events-none"}`}>
        <Button
          onClick={handleLearn}
          variant="outline"
          size="lg"
          className="h-14 border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-400"
        >
          <XCircle className="mr-2 h-5 w-5" />
          Nochmal lernen
        </Button>
        <Button
          onClick={handleKnow}
          size="lg"
          className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Kann ich das!
        </Button>
      </div>

      {!isFlipped && (
        <p className="text-center text-xs text-muted-foreground">
          Drehe die Karte um, um die Antwort zu sehen
        </p>
      )}
    </div>
  );
}
