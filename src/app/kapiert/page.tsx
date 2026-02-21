"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Zap,
  PlusCircle,
  Brain,
  Image,
  AlignLeft,
  CheckSquare,
  Compass,
  UserCircle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    id: "start",
    icon: Zap,
    emoji: "🚀",
    title: "Schnellstart",
    color: "bg-violet-500",
    colorLight: "bg-violet-50 dark:bg-violet-950/30",
    colorText: "text-violet-600 dark:text-violet-400",
    colorBorder: "border-violet-200 dark:border-violet-800",
    steps: [
      {
        number: "1",
        title: "Deck erstellen",
        desc: `Geh auf „Erstellen" und lege dein erstes Deck an – gib ihm einen Namen, eine Kategorie und ein Emoji.`,
      },
      {
        number: "2",
        title: "Karten hinzufügen",
        desc: "Wähle deinen Kartentyp: Basic (Vorderseite / Rückseite), Lückentext oder Bild-Okklusion.",
      },
      {
        number: "3",
        title: "Lernen & Quiz",
        desc: "Starte den Lernmodus oder teste dich mit dem Quiz-Modus – beides findest du auf jeder Deck-Karte.",
      },
      {
        number: "4",
        title: "Fortschritt verfolgen",
        desc: "Auf dem Dashboard siehst du deinen Streak, gemeisterte Karten und deine zuletzt geöffneten Decks.",
      },
    ],
  },
  {
    id: "cardtypes",
    icon: Brain,
    emoji: "🧠",
    title: "Kartentypen",
    color: "bg-blue-500",
    colorLight: "bg-blue-50 dark:bg-blue-950/30",
    colorText: "text-blue-600 dark:text-blue-400",
    colorBorder: "border-blue-200 dark:border-blue-800",
    steps: [],
  },
  {
    id: "study",
    icon: BookOpen,
    emoji: "📖",
    title: "Lernmodus",
    color: "bg-emerald-500",
    colorLight: "bg-emerald-50 dark:bg-emerald-950/30",
    colorText: "text-emerald-600 dark:text-emerald-400",
    colorBorder: "border-emerald-200 dark:border-emerald-800",
    steps: [
      {
        number: "→",
        title: "Karte anklicken = umdrehen",
        desc: "Klicke auf die Karte, um die Rückseite aufzudecken. Erst dann werden die Bewertungsknöpfe aktiv.",
      },
      {
        number: "→",
        title: `„Wusste ich" / „Nochmal"`,
        desc: "Bewerte ehrlich, ob du die Antwort kanntest. Karten die du nicht wusstest kommen wieder.",
      },
      {
        number: "→",
        title: "Ergebnisseite",
        desc: "Am Ende siehst du deine Score und kannst direkt ins Quiz wechseln oder neu starten.",
      },
    ],
  },
  {
    id: "quiz",
    icon: CheckSquare,
    emoji: "🎯",
    title: "Quiz-Modus",
    color: "bg-amber-500",
    colorLight: "bg-amber-50 dark:bg-amber-950/30",
    colorText: "text-amber-600 dark:text-amber-400",
    colorBorder: "border-amber-200 dark:border-amber-800",
    steps: [
      {
        number: "→",
        title: "Multiple Choice",
        desc: "Du bekommst 4 Antwortmöglichkeiten – eine ist richtig, die anderen werden zufällig aus dem Deck generiert.",
      },
      {
        number: "→",
        title: "Sofortiges Feedback",
        desc: "Grün = richtig, Rot = falsch. Die richtige Antwort wird immer angezeigt.",
      },
      {
        number: "→",
        title: "Stern-Bewertung",
        desc: "Am Ende bekommst du 1–5 Sterne je nach deiner Trefferquote.",
      },
    ],
  },
  {
    id: "explore",
    icon: Compass,
    emoji: "🔭",
    title: "Entdecken",
    color: "bg-rose-500",
    colorLight: "bg-rose-50 dark:bg-rose-950/30",
    colorText: "text-rose-600 dark:text-rose-400",
    colorBorder: "border-rose-200 dark:border-rose-800",
    steps: [
      {
        number: "→",
        title: "Lernwissenschaft verstehen",
        desc: "Die Entdecken-Seite erklärt Active Recall, Spaced Repetition, die Feynman-Technik und mehr – mit echten Studien.",
      },
      {
        number: "→",
        title: "Vergessenskurve",
        desc: "Sieh visuell, wie Wissen ohne Wiederholung verfällt – und wie Synapze es verlangsamt.",
      },
      {
        number: "→",
        title: "Techniken anklicken",
        desc: "Jede Lernmethode hat ein aufklappbares Kapitel mit konkreten Schritten und wie du sie in Synapze einsetzt.",
      },
    ],
  },
  {
    id: "profile",
    icon: UserCircle,
    emoji: "👤",
    title: "Profil",
    color: "bg-pink-500",
    colorLight: "bg-pink-50 dark:bg-pink-950/30",
    colorText: "text-pink-600 dark:text-pink-400",
    colorBorder: "border-pink-200 dark:border-pink-800",
    steps: [
      {
        number: "→",
        title: "Bundesland wählen",
        desc: "Wähle dein Bundesland, damit Synapze später Lehrplaninhalte anpassen kann.",
      },
      {
        number: "→",
        title: "Schuljahr & Abschluss",
        desc: "Gib deine aktuelle Klasse und deinen Zielabschluss an – inklusive Abschlussjahr.",
      },
      {
        number: "→",
        title: "Curriculum",
        desc: "Für ausgewählte Bundesländer und Klassen zeigt Synapze dir relevante Lehrplaninhalte an.",
      },
    ],
  },
];

const cardTypes = [
  {
    icon: AlignLeft,
    title: "Basic",
    badge: null,
    badgeColor: "",
    desc: "Klassische Karteikarte mit Vorderseite und Rückseite. Perfekt für Definitionen, Vokabeln und Fakten.",
    example: {
      front: "Was ist das Myokard?",
      back: "Die Herzmuskulatur",
    },
    tip: "Halte Vorder- und Rückseite kurz und präzise – ein Konzept pro Karte.",
  },
  {
    icon: Brain,
    title: "Lückentext",
    badge: "Cloze",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    desc: `Markiere ein Wort im Text und klicke „Als Lücke markieren" – Synapze wandelt es in eine {{c1::Lücke}} um.`,
    example: {
      front: "Das {{c1::Zwerchfell}} ist der wichtigste Atemmuskel.",
      back: "→ Lücke: Zwerchfell",
    },
    tip: "Ideal für Fließtexte, Satzergänzungen und medizinische Definitionen.",
  },
  {
    icon: Image,
    title: "Bild-Okklusion",
    badge: "Image",
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    desc: "Lade ein Bild hoch und zeichne Rechtecke über Bereiche, die du ausblenden möchtest.",
    example: {
      front: "Bild mit verdeckten Beschriftungen",
      back: "→ Beschriftungen werden aufgedeckt",
    },
    tip: "Perfekt für anatomische Abbildungen, Landkarten, Schaltpläne und Diagramme.",
  },
];

const tips = [
  { emoji: "🔥", title: "Streak aufrechterhalten", desc: "Jeden Tag lernen – auch nur 10 Minuten – hält deinen Streak am Leben und verankert Wissen langfristig." },
  { emoji: "📦", title: "Kleine Decks bevorzugen", desc: "Decks mit 10–20 Karten sind effektiver als riesige Sammlungen. Teile große Themen in Unterkapitel." },
  { emoji: "🎯", title: "Quiz nach dem Lernen", desc: "Mach direkt nach dem Lernmodus einen Quiz-Durchgang. Das Testing-Effekt verdoppelt die Behaltensleistung." },
  { emoji: "🧬", title: "Eigene Karten schreiben", desc: "Karten, die du selbst formuliert hast, bleiben besser hängen als kopierte Texte." },
];

export default function KapiertPage() {
  const [openSection, setOpenSection] = useState<string | null>("start");

  return (
    <div className="space-y-8 pb-10">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 p-8 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Hilfe & Anleitung</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">Kapiert? 🎉</h1>
        <p className="mt-2 max-w-lg text-sm opacity-80">
          Hier erfährst du alles, was du brauchst, um Synapze richtig zu nutzen – von den ersten Schritten bis zu
          fortgeschrittenen Lernmethoden.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold shadow">
            <Link href="/create">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Erstes Deck erstellen
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10">
            <Link href="/explore">
              <Compass className="mr-1.5 h-4 w-4" />
              Lernwissenschaft entdecken
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-xs font-medium leading-tight text-muted-foreground">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-all ${isOpen ? section.colorBorder : "border-border"}`}
            >
              {/* Header */}
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${section.color} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{section.title}</p>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Content */}
              {isOpen && (
                <div className={`border-t px-4 pb-5 pt-4 ${section.colorLight}`}>
                  {/* Kartentypen – special layout */}
                  {section.id === "cardtypes" ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      {cardTypes.map((ct) => {
                        const CIcon = ct.icon;
                        return (
                          <div key={ct.title} className="rounded-xl border bg-background p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                              <CIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-sm">{ct.title}</span>
                              {ct.badge && (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ct.badgeColor}`}>
                                  {ct.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">{ct.desc}</p>
                            <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs font-mono">
                              <p className="text-foreground/70">Vorne: <span className="text-foreground">{ct.example.front}</span></p>
                              <p className="mt-1 text-foreground/70">Hinten: <span className="text-foreground">{ct.example.back}</span></p>
                            </div>
                            <p className={`mt-2.5 text-xs font-medium ${section.colorText}`}>
                              💡 {ct.tip}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${section.colorText} bg-background border`}
                          >
                            {step.number}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{step.title}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Top-Tipps für effektives Lernen</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip) => (
            <Card key={tip.title} className="border hover:shadow-sm transition-shadow">
              <CardContent className="flex gap-3 p-4">
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{tip.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{tip.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border bg-muted/40 p-6 text-center">
        <p className="text-lg font-bold">Bereit loszulegen?</p>
        <p className="mt-1 text-sm text-muted-foreground">Erstelle dein erstes Deck und starte noch heute.</p>
        <Button asChild className="mt-4">
          <Link href="/create">
            Deck erstellen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
