"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeckById, Card } from "@/lib/data";

interface QuizQuestion {
  card: Card;
  options: string[];
  correctAnswer: string;
}

function generateQuestions(cards: Card[]): QuizQuestion[] {
  return cards.map((card) => {
    const others = cards.filter((c) => c.id !== card.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const wrongAnswers = shuffledOthers.slice(0, Math.min(3, shuffledOthers.length)).map((c) => c.back);
    const options = [...wrongAnswers, card.back].sort(() => Math.random() - 0.5);
    return { card, options, correctAnswer: card.back };
  });
}

export default function QuizPage() {
  const params = useParams();
  const id = params.id as string;
  const deck = getDeckById(id);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (deck) {
      setQuestions(generateQuestions(deck.cards));
    }
  }, [deck]);

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

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === currentQuestion.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setIsDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    setQuestions(generateQuestions(deck.cards));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsDone(false);
  };

  const getOptionStyle = (option: string) => {
    if (!isAnswered) return "border-border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer";
    if (option === currentQuestion.correctAnswer) return "border-emerald-400 bg-emerald-50 text-emerald-800";
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer)
      return "border-rose-400 bg-rose-50 text-rose-800";
    return "border-border bg-muted/40 text-muted-foreground";
  };

  // Results Screen
  if (isDone) {
    const pct = Math.round((score / questions.length) * 100);
    const stars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 py-16 text-center">
        <div>
          <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-500" />
          <h2 className="text-3xl font-bold">Quiz beendet!</h2>
          <p className="mt-2 text-muted-foreground">
            {deck.emoji} {deck.title}
          </p>
        </div>

        <div className="w-full rounded-2xl bg-muted/50 p-6">
          <p className="text-6xl font-bold text-primary">{pct}%</p>
          <p className="mt-1 text-muted-foreground">
            {score} von {questions.length} richtig
          </p>
          <div className="mt-4 flex justify-center gap-1 text-2xl">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i}>{i < stars ? "⭐" : "☆"}</span>
            ))}
          </div>
        </div>

        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {score} richtig
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-3 text-rose-600">
            <XCircle className="h-4 w-4" />
            {questions.length - score} falsch
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={handleRestart} variant="outline" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />
            Nochmal
          </Button>
          <Button asChild size="lg">
            <Link href={`/study/${deck.id}`}>Karteikarten lernen</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/decks">Zurück zu Decks</Link>
          </Button>
        </div>
      </div>
    );
  }

  const optionLabels = ["A", "B", "C", "D"];

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
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-emerald-600">{score}</span>
          <span className="text-muted-foreground">/ {currentIndex + (isAnswered ? 1 : 0)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Frage {currentIndex + 1} von {questions.length}
      </p>

      {/* Question Card */}
      <div className="rounded-2xl border-2 bg-card p-6 shadow-sm">
        <p className="text-center text-xl font-semibold leading-snug">
          {currentQuestion.card.front}
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {currentQuestion.options.map((option, i) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${getOptionStyle(option)}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {optionLabels[i]}
            </span>
            <span className="flex-1 leading-snug">{option}</span>
            {isAnswered && option === currentQuestion.correctAnswer && (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            )}
            {isAnswered && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
              <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
            )}
          </button>
        ))}
      </div>

      {/* Feedback + Next */}
      {isAnswered && (
        <div className={`flex items-center justify-between rounded-xl p-4 ${
          selectedAnswer === currentQuestion.correctAnswer
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-rose-50 border border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Richtig!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-rose-600" />
                <span className="font-semibold text-rose-700">Fast! Die richtige Antwort war oben grün markiert.</span>
              </>
            )}
          </div>
          <Button onClick={handleNext} size="sm">
            {currentIndex + 1 >= questions.length ? "Ergebnis →" : "Weiter →"}
          </Button>
        </div>
      )}
    </div>
  );
}
