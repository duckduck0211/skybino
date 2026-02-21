"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Zap, Target, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decks, getTotalCards, getTotalMastered } from "@/lib/data";

const categories = ["Alle", ...Array.from(new Set(decks.map((d) => d.category)))];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "decks">("overview");
  const [selectedCategory, setSelectedCategory] = useState("Alle");

  const recentDecks = decks.filter((d) => d.lastStudied);
  const totalCards = getTotalCards();
  const totalMastered = getTotalMastered();

  const filteredDecks =
    selectedCategory === "Alle"
      ? decks
      : decks.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-violet-400 p-6 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Guten Morgen,</p>
        <h2 className="mt-0.5 text-3xl font-bold">Mert! 👋</h2>
        <p className="mt-1 text-sm opacity-75">Du hast heute noch nicht gelernt. Leg los!</p>

        <div className="mt-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-lg font-bold leading-none">3</p>
              <p className="text-xs opacity-80">Tage Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <BookOpen className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{decks.length}</p>
              <p className="text-xs opacity-80">Decks</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <Zap className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{totalCards}</p>
              <p className="text-xs opacity-80">Karten</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2">
            <Target className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{totalMastered}</p>
              <p className="text-xs opacity-80">Gemeistert</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab("decks")}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === "decks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Meine Decks
            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {decks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab: Übersicht */}
      {activeTab === "overview" && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Weitermachen</h3>
            <button
              onClick={() => setActiveTab("decks")}
              className="text-sm text-primary hover:underline"
            >
              Alle Decks →
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentDecks.slice(0, 3).map((deck) => (
              <Card key={deck.id} className="group overflow-hidden border hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className={`${deck.color} flex h-2 w-full`} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{deck.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{deck.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {deck.cards.length} Karten · {deck.lastStudied}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{deck.masteredCount} gemeistert</span>
                        <span>{Math.round((deck.masteredCount / deck.cards.length) * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className={`h-1.5 rounded-full ${deck.color} transition-all`}
                          style={{ width: `${(deck.masteredCount / deck.cards.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/study/${deck.id}`}>Lernen</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/quiz/${deck.id}`}>Quiz</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Meine Decks */}
      {activeTab === "decks" && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {decks.length} Decks · {decks.reduce((s, d) => s + d.cards.length, 0)} Karten insgesamt
            </p>
            <Button asChild size="sm">
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" />
                Neues Deck
              </Link>
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Decks Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDecks.map((deck) => (
              <Card key={deck.id} className="group overflow-hidden border hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className={`${deck.color} h-1.5 w-full`} />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{deck.emoji}</span>
                      <div>
                        <p className="font-semibold leading-tight">{deck.title}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {deck.category}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{deck.description}</p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {deck.cards.length} Karten
                      </span>
                      {deck.lastStudied && <span>· Zuletzt: {deck.lastStudied}</span>}
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>{deck.masteredCount} / {deck.cards.length} gemeistert</span>
                        <span className="font-medium">
                          {Math.round((deck.masteredCount / deck.cards.length) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${deck.color} transition-all duration-500`}
                          style={{ width: `${(deck.masteredCount / deck.cards.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button asChild className="flex-1" size="sm">
                        <Link href={`/study/${deck.id}`}>Lernen</Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1" size="sm">
                        <Link href={`/quiz/${deck.id}`}>Quiz</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Deck Card */}
            <Link href="/create">
              <Card className="group flex h-full min-h-[200px] items-center justify-center border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    Neues Deck erstellen
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
