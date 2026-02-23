"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ScanLine,
  ChevronRight,
  GraduationCap,
  Sigma,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Level = "Alle" | "Grundschule" | "Mittelstufe" | "Oberstufe" | "Studium";

interface Course {
  id: string;
  title: string;
  emoji: string;
  level: Exclude<Level, "Alle">;
  levelLabel: string;
  description: string;
  topics: string[];
  color: string;
  badge?: string;
}

const courses: Course[] = [
  // ── Grundschule ────────────────────────────────────────────────────────────
  {
    id: "gs-zahlen",
    title: "Zahlen & Zählen",
    emoji: "🔢",
    level: "Grundschule",
    levelLabel: "Klasse 1–2",
    description: "Von Zählen bis zu großen Zahlen — das Fundament der Mathematik.",
    color: "bg-sky-500",
    topics: [
      "Zählen bis 100",
      "Zählen bis 1.000.000",
      "Ordinalzahlen",
      "Zahlen vergleichen & ordnen",
      "Gerade & ungerade Zahlen",
      "Stellenwerte (Einer, Zehner, Hunderter)",
      "Zahlen an der Zahlengerade",
    ],
  },
  {
    id: "gs-addition",
    title: "Addition & Subtraktion",
    emoji: "➕",
    level: "Grundschule",
    levelLabel: "Klasse 1–3",
    description: "Rechnen im Kopf, schriftlich und mit Textaufgaben.",
    color: "bg-emerald-500",
    topics: [
      "Addieren im Kopf bis 20",
      "Addieren bis 100",
      "Schriftliche Addition",
      "Subtrahieren im Kopf",
      "Schriftliche Subtraktion",
      "Zusammenhang + und −",
      "Textaufgaben lösen",
    ],
  },
  {
    id: "gs-malteilen",
    title: "Multiplikation & Division",
    emoji: "✖️",
    level: "Grundschule",
    levelLabel: "Klasse 2–4",
    description: "Das kleine Einmaleins bis zur schriftlichen Division.",
    color: "bg-violet-500",
    topics: [
      "Kleines Einmaleins (1×1)",
      "Großes Einmaleins",
      "Schriftliche Multiplikation",
      "Division mit Rest",
      "Schriftliche Division",
      "Umkehraufgaben",
      "Textaufgaben",
    ],
  },
  {
    id: "gs-geometrie",
    title: "Geometrie Grundlagen",
    emoji: "📐",
    level: "Grundschule",
    levelLabel: "Klasse 1–4",
    description: "Formen, Symmetrie und erste räumliche Vorstellungen.",
    color: "bg-pink-500",
    topics: [
      "Grundlegende Formen (Kreis, Dreieck, Viereck)",
      "Achsensymmetrie",
      "Körper (Würfel, Quader, Kugel)",
      "Muster & Ornamente",
      "Winkel erkennen",
      "Fläche & Umfang (einfach)",
    ],
  },
  {
    id: "gs-masse",
    title: "Maße & Größen",
    emoji: "📏",
    level: "Grundschule",
    levelLabel: "Klasse 1–4",
    description: "Länge, Gewicht, Volumen, Zeit und Geld im Alltag.",
    color: "bg-amber-500",
    topics: [
      "Längen (mm, cm, m, km)",
      "Gewichte (g, kg)",
      "Volumen (ml, l)",
      "Zeitrechnung (Uhr, Minuten)",
      "Kalender & Datum",
      "Geldrechnung",
      "Umrechnen von Einheiten",
    ],
  },

  // ── Mittelstufe 5–7 ────────────────────────────────────────────────────────
  {
    id: "ms-brueche",
    title: "Bruchrechnung",
    emoji: "½",
    level: "Mittelstufe",
    levelLabel: "Klasse 5–6",
    description: "Brüche verstehen, kürzen, erweitern und rechnen.",
    color: "bg-orange-500",
    topics: [
      "Brüche darstellen & verstehen",
      "Kürzen & Erweitern",
      "Gemischte Zahlen",
      "Brüche vergleichen",
      "Addition & Subtraktion von Brüchen",
      "Multiplikation von Brüchen",
      "Division von Brüchen",
      "Brüche im Alltag",
    ],
  },
  {
    id: "ms-dezimal",
    title: "Dezimalzahlen",
    emoji: "🔟",
    level: "Mittelstufe",
    levelLabel: "Klasse 5–6",
    description: "Dezimalschreibweise, Rechnen und Runden.",
    color: "bg-teal-500",
    topics: [
      "Dezimalschreibweise",
      "Dezimalzahlen am Zahlenstrahl",
      "Runden",
      "Addition & Subtraktion",
      "Multiplikation mit Dezimalzahlen",
      "Division mit Dezimalzahlen",
      "Umwandlung Brüche ↔ Dezimal",
    ],
  },
  {
    id: "ms-prozent",
    title: "Prozent- & Verhältnisrechnung",
    emoji: "💯",
    level: "Mittelstufe",
    levelLabel: "Klasse 6–7",
    description: "Prozentsatz, Dreisatz und Proportionalität.",
    color: "bg-rose-500",
    topics: [
      "Prozentbegriff & Grundformel",
      "Prozentwert berechnen",
      "Grundwert berechnen",
      "Prozentsatz berechnen",
      "Gewinn & Verlust",
      "Einfacher Dreisatz",
      "Proportionale Zuordnungen",
      "Umgekehrt proportionale Zuordnungen",
    ],
  },
  {
    id: "ms-negativ",
    title: "Negative Zahlen",
    emoji: "−",
    level: "Mittelstufe",
    levelLabel: "Klasse 6",
    description: "Ganze Zahlen, Zahlengerade und Rechnen mit negativen Zahlen.",
    color: "bg-indigo-500",
    topics: [
      "Ganze Zahlen & Zahlengerade",
      "Betrag einer Zahl",
      "Addition mit negativen Zahlen",
      "Subtraktion mit negativen Zahlen",
      "Multiplikation (Vorzeichenregel)",
      "Division mit negativen Zahlen",
      "Klammern auflösen",
    ],
  },
  {
    id: "ms-flaechen",
    title: "Flächen & Volumen",
    emoji: "📦",
    level: "Mittelstufe",
    levelLabel: "Klasse 5–7",
    description: "Umfang, Flächeninhalt und Volumen geometrischer Körper.",
    color: "bg-cyan-500",
    topics: [
      "Umfang von Vierecken",
      "Flächeninhalt: Rechteck & Quadrat",
      "Flächeninhalt: Dreieck",
      "Flächeninhalt: Parallelogramm & Trapez",
      "Umfang & Fläche des Kreises",
      "Volumen: Quader",
      "Volumen: Prisma & Zylinder",
      "Oberflächen berechnen",
    ],
  },
  {
    id: "ms-algebra-ein",
    title: "Algebra – Einführung",
    emoji: "🔣",
    level: "Mittelstufe",
    levelLabel: "Klasse 6–7",
    description: "Terme, Variablen und erste Gleichungen.",
    color: "bg-violet-500",
    topics: [
      "Terme & Variablen",
      "Terme auswerten",
      "Terme vereinfachen",
      "Klammern ausmultiplizieren",
      "Einfache Gleichungen lösen",
      "Äquivalenzumformungen",
      "Gleichungen aufstellen",
    ],
  },

  // ── Mittelstufe 8–10 ───────────────────────────────────────────────────────
  {
    id: "ms-lingl",
    title: "Lineare Gleichungen",
    emoji: "⚖️",
    level: "Mittelstufe",
    levelLabel: "Klasse 7–8",
    description: "Gleichungen mit einer Unbekannten und lineare Gleichungssysteme.",
    color: "bg-blue-500",
    topics: [
      "Lineare Gleichungen lösen",
      "Gleichungen mit Brüchen",
      "Textaufgaben → Gleichungen",
      "Lineare Ungleichungen",
      "Gleichungssysteme (Einsetzverfahren)",
      "Gleichungssysteme (Additionsverfahren)",
      "Gleichungssysteme (Grafisch)",
      "Anwendungsaufgaben",
    ],
  },
  {
    id: "ms-quadgl",
    title: "Quadratische Gleichungen",
    emoji: "x²",
    level: "Mittelstufe",
    levelLabel: "Klasse 9–10",
    description: "pq-Formel, Mitternachtsformel und quadratische Ergänzung.",
    color: "bg-fuchsia-500",
    topics: [
      "Quadratische Gleichungen – Grundform",
      "Lösung durch Wurzelziehen",
      "pq-Formel",
      "abc-Formel (Mitternachtsformel)",
      "Quadratische Ergänzung",
      "Diskriminante & Lösungsfälle",
      "Textaufgaben",
    ],
  },
  {
    id: "ms-linfkt",
    title: "Lineare Funktionen",
    emoji: "📈",
    level: "Mittelstufe",
    levelLabel: "Klasse 8–9",
    description: "Steigung, Schnittpunkte und Graphen linearer Funktionen.",
    color: "bg-emerald-500",
    topics: [
      "Funktion & Zuordnung",
      "Wertetabelle & Graph",
      "Steigung m berechnen",
      "y-Achsenabschnitt",
      "Geradengleichung aufstellen",
      "Schnittpunkt mit Achsen",
      "Schnittpunkt zweier Geraden",
      "Parallele & senkrechte Geraden",
    ],
  },
  {
    id: "ms-quadfkt",
    title: "Quadratische Funktionen",
    emoji: "∪",
    level: "Mittelstufe",
    levelLabel: "Klasse 9–10",
    description: "Parabelform, Scheitelpunkt und Nullstellen.",
    color: "bg-amber-500",
    topics: [
      "Normalparabel y = x²",
      "Streckung & Stauchung",
      "Verschiebung der Parabel",
      "Scheitelpunktform",
      "Normalform → Scheitelpunktform",
      "Nullstellen der Parabel",
      "Parabel & Gerade – Schnittpunkte",
    ],
  },
  {
    id: "ms-pythagoras",
    title: "Satz des Pythagoras",
    emoji: "📐",
    level: "Mittelstufe",
    levelLabel: "Klasse 9",
    description: "Der wichtigste Satz der Geometrie – und seine Anwendungen.",
    color: "bg-rose-500",
    topics: [
      "Der Satz des Pythagoras",
      "Hypotenuse berechnen",
      "Kathete berechnen",
      "Umkehrung des Satzes",
      "Anwendungen in der Ebene",
      "Raumdiagonalen (3D)",
      "Trigonometrie-Vorbereitung",
    ],
  },
  {
    id: "ms-trig",
    title: "Trigonometrie – Grundlagen",
    emoji: "📐",
    level: "Mittelstufe",
    levelLabel: "Klasse 9–10",
    description: "Sinus, Kosinus, Tangens im rechtwinkligen Dreieck.",
    color: "bg-teal-500",
    topics: [
      "Sinus, Kosinus, Tangens",
      "Winkel berechnen",
      "Seite berechnen",
      "Merkhilfe: SOH-CAH-TOA",
      "Anwendungsaufgaben",
      "Sinussatz",
      "Kosinussatz",
    ],
  },
  {
    id: "ms-potenzen",
    title: "Potenzen & Wurzeln",
    emoji: "√",
    level: "Mittelstufe",
    levelLabel: "Klasse 8–9",
    description: "Potenzgesetze, Wurzeln und wissenschaftliche Notation.",
    color: "bg-indigo-500",
    topics: [
      "Potenzschreibweise",
      "Potenzgesetze",
      "Negative & gebrochene Exponenten",
      "Quadrat- & Kubikwurzeln",
      "Wurzeln vereinfachen",
      "Wissenschaftliche Notation",
      "Logarithmus-Einführung",
    ],
  },
  {
    id: "ms-stoch",
    title: "Statistik & Wahrscheinlichkeit",
    emoji: "🎲",
    level: "Mittelstufe",
    levelLabel: "Klasse 8–10",
    description: "Häufigkeiten, Mittelwerte, Diagramme und Grundwahrscheinlichkeit.",
    color: "bg-pink-500",
    topics: [
      "Absolute & relative Häufigkeit",
      "Mittelwert, Median, Modus",
      "Streuung & Spannweite",
      "Säulen-, Kreis- & Liniendiagramm",
      "Laplace-Experiment",
      "Baumdiagramme",
      "Bedingte Wahrscheinlichkeit",
    ],
  },

  // ── Oberstufe ──────────────────────────────────────────────────────────────
  {
    id: "ob-diff",
    title: "Differentialrechnung",
    emoji: "𝑓′",
    level: "Oberstufe",
    levelLabel: "Klasse 11–12",
    description: "Grenzwerte, Ableitungsregeln und Kurvenuntersuchung.",
    color: "bg-violet-600",
    badge: "Analysis",
    topics: [
      "Grenzwert & Stetigkeit",
      "Differenzenquotient",
      "Ableitungsbegriff",
      "Potenzregel",
      "Summen- & Faktorregel",
      "Produktregel",
      "Quotientenregel",
      "Kettenregel",
      "Kurvenuntersuchung (Monotonie)",
      "Extremstellen & Wendepunkte",
      "Newtonverfahren",
    ],
  },
  {
    id: "ob-int",
    title: "Integralrechnung",
    emoji: "∫",
    level: "Oberstufe",
    levelLabel: "Klasse 12–13",
    description: "Stammfunktionen, bestimmtes Integral und Flächenberechnung.",
    color: "bg-blue-600",
    badge: "Analysis",
    topics: [
      "Stammfunktionen",
      "Unbestimmtes Integral",
      "Grundintegrale",
      "Integrationsregeln",
      "Bestimmtes Integral",
      "Hauptsatz der Differential- und Integralrechnung",
      "Flächeninhalt zwischen Kurven",
      "Rotationskörper",
      "Uneigentliche Integrale",
    ],
  },
  {
    id: "ob-exp",
    title: "Exponential- & Logarithmusfunktionen",
    emoji: "eˣ",
    level: "Oberstufe",
    levelLabel: "Klasse 11–12",
    description: "Natürliche Exponentialfunktion, Logarithmen und Wachstumsmodelle.",
    color: "bg-emerald-600",
    topics: [
      "Exponentialfunktion: Eigenschaften",
      "Die natürliche Zahl e",
      "e-Funktion: Ableitung & Integral",
      "Logarithmus: Definition",
      "Logarithmusgesetze",
      "Natürlicher Logarithmus ln",
      "Exponentialgleichungen lösen",
      "Exponentielles Wachstum & Zerfall",
      "Logistisches Wachstum",
    ],
  },
  {
    id: "ob-trig-adv",
    title: "Trigonometrie – Vertieft",
    emoji: "〜",
    level: "Oberstufe",
    levelLabel: "Klasse 11–12",
    description: "Bogenmaß, Additionstheoreme und trigonometrische Gleichungen.",
    color: "bg-cyan-600",
    topics: [
      "Bogenmaß & Gradmaß",
      "Einheitskreis",
      "sin, cos, tan: Allgemeine Definition",
      "Graphen: sin & cos",
      "Amplitude, Frequenz, Phase",
      "Additionstheoreme",
      "Doppelwinkelformeln",
      "Trigonometrische Gleichungen",
      "Inverse Funktionen: arcsin, arccos, arctan",
    ],
  },
  {
    id: "ob-vektor",
    title: "Vektorgeometrie",
    emoji: "→",
    level: "Oberstufe",
    levelLabel: "Klasse 11–12",
    description: "Vektoren, Geraden, Ebenen und Abstände im Raum.",
    color: "bg-orange-600",
    topics: [
      "Vektoren & Vektoroperationen",
      "Skalarprodukt",
      "Kreuzprodukt",
      "Betrag & Einheitsvektor",
      "Geraden im Raum",
      "Lagebeziehungen von Geraden",
      "Ebenengleichungen",
      "Lagebeziehungen Gerade/Ebene",
      "Abstände: Punkt–Gerade, Punkt–Ebene",
      "Schnittmengen",
    ],
  },
  {
    id: "ob-stoch",
    title: "Stochastik – Vertieft",
    emoji: "📊",
    level: "Oberstufe",
    levelLabel: "Klasse 12–13",
    description: "Kombinatorik, Binomial- und Normalverteilung.",
    color: "bg-rose-600",
    topics: [
      "Kombinatorik: Permutationen",
      "Kombinatorik: Kombinationen",
      "Binomialkoeffizient",
      "Binomialverteilung",
      "Erwartungswert & Varianz",
      "Normalverteilung",
      "Standardnormalverteilung",
      "Hypothesentest",
      "Konfidenzintervalle",
    ],
  },
  {
    id: "ob-komplex",
    title: "Komplexe Zahlen",
    emoji: "ℂ",
    level: "Oberstufe",
    levelLabel: "Klasse 13",
    description: "Imaginäre Einheit, Gauß'sche Zahlenebene und Polarform.",
    color: "bg-fuchsia-600",
    topics: [
      "Imaginäre Einheit i",
      "Komplexe Zahlen: Grundbegriffe",
      "Rechnen mit komplexen Zahlen",
      "Gauß'sche Zahlenebene",
      "Betrag & Argument",
      "Polarform",
      "Eulersche Formel",
      "Komplexe Gleichungen",
    ],
  },

  // ── Studium ────────────────────────────────────────────────────────────────
  {
    id: "uni-linalg1",
    title: "Lineare Algebra I",
    emoji: "🔲",
    level: "Studium",
    levelLabel: "1.–2. Semester",
    description: "Vektorräume, Matrizen, lineare Abbildungen und lineare Gleichungssysteme.",
    color: "bg-slate-600",
    badge: "Hochschule",
    topics: [
      "Mengen & Logik – Grundlagen",
      "Gruppen, Ringe, Körper",
      "Vektorräume",
      "Basis & Dimension",
      "Lineare Abbildungen",
      "Matrizen & Matrizenrechnung",
      "Gaußsches Eliminationsverfahren",
      "Determinanten",
      "Inverse Matrizen",
      "Kern & Bild einer Abbildung",
    ],
  },
  {
    id: "uni-linalg2",
    title: "Lineare Algebra II",
    emoji: "λ",
    level: "Studium",
    levelLabel: "2. Semester",
    description: "Eigenwerte, Eigenvektoren, Diagonalisierung und Skalarprodukte.",
    color: "bg-slate-700",
    badge: "Hochschule",
    topics: [
      "Eigenwerte & Eigenvektoren",
      "Charakteristisches Polynom",
      "Diagonalisierung",
      "Jordan-Normalform",
      "Skalarprodukte & Normen",
      "Gram-Schmidt-Verfahren",
      "Orthogonale Matrizen",
      "Quadratische Formen",
      "Positiv definite Matrizen",
      "Singulärwertzerlegung (SVD)",
    ],
  },
  {
    id: "uni-ana1",
    title: "Analysis I",
    emoji: "ℝ",
    level: "Studium",
    levelLabel: "1. Semester",
    description: "Folgen, Grenzwerte, Stetigkeit und Differenzierbarkeit.",
    color: "bg-blue-700",
    badge: "Hochschule",
    topics: [
      "Logik & Beweistechniken",
      "Reelle Zahlen & Axiome",
      "Folgen & Konvergenz",
      "Reihen",
      "Grenzwerte von Funktionen",
      "Stetige Funktionen",
      "Zwischenwertsatz",
      "Differenzierbarkeit",
      "Mittelwertsatz",
      "Taylor-Entwicklung",
      "Konvexität",
    ],
  },
  {
    id: "uni-ana2",
    title: "Analysis II",
    emoji: "∑",
    level: "Studium",
    levelLabel: "2. Semester",
    description: "Riemann-Integral, Potenzreihen und gleichmäßige Konvergenz.",
    color: "bg-blue-800",
    badge: "Hochschule",
    topics: [
      "Riemann-Integral",
      "Hauptsatz der Analysis",
      "Uneigentliche Integrale",
      "Funktionenfolgen",
      "Gleichmäßige Konvergenz",
      "Potenzreihen",
      "Analytische Funktionen",
      "Fourier-Reihen",
    ],
  },
  {
    id: "uni-ana3",
    title: "Analysis III – Mehrdimensional",
    emoji: "∇",
    level: "Studium",
    levelLabel: "3. Semester",
    description: "Partielle Ableitungen, Gradient, Mehrfachintegrale und Vektoranalysis.",
    color: "bg-indigo-700",
    badge: "Hochschule",
    topics: [
      "Topologie in ℝⁿ",
      "Partielle Ableitungen",
      "Gradient & Richtungsableitung",
      "Jacobi-Matrix",
      "Implizite Funktionen",
      "Extrema mit Nebenbedingungen (Lagrange)",
      "Mehrfachintegrale",
      "Transformationssatz",
      "Kurvenintegrale",
      "Oberflächenintegrale",
      "Integralsätze (Gauß, Stokes)",
    ],
  },
  {
    id: "uni-dgl",
    title: "Differentialgleichungen",
    emoji: "y′",
    level: "Studium",
    levelLabel: "2.–3. Semester",
    description: "Gewöhnliche und partielle Differentialgleichungen.",
    color: "bg-teal-700",
    badge: "Hochschule",
    topics: [
      "Einführung & Klassifikation",
      "Trennung der Variablen",
      "Lineare DGLs 1. Ordnung",
      "Exakte DGLs",
      "Lineare DGLs höherer Ordnung",
      "Konstante Koeffizienten",
      "Variation der Konstanten",
      "Laplace-Transformation",
      "Systeme von DGLs",
      "Partielle DGLs – Einführung",
    ],
  },
  {
    id: "uni-wt",
    title: "Wahrscheinlichkeitstheorie",
    emoji: "Ω",
    level: "Studium",
    levelLabel: "3. Semester",
    description: "Maßtheoretische Grundlagen, Zufallsvariablen und Verteilungen.",
    color: "bg-rose-700",
    badge: "Hochschule",
    topics: [
      "σ-Algebren & Maße",
      "Wahrscheinlichkeitsräume",
      "Zufallsvariablen",
      "Verteilungsfunktionen",
      "Wichtige Verteilungen",
      "Erwartungswert & Varianz",
      "Ungleichungen (Markov, Chebyshev)",
      "Konvergenzarten",
      "Grenzwertsätze (LLN, CLT)",
      "Bedingte Erwartung",
    ],
  },
  {
    id: "uni-statistik",
    title: "Mathematische Statistik",
    emoji: "📉",
    level: "Studium",
    levelLabel: "4. Semester",
    description: "Schätztheorie, Hypothesentests und Regression.",
    color: "bg-pink-700",
    badge: "Hochschule",
    topics: [
      "Statistische Modelle",
      "Punktschätzer (MLE, MOM)",
      "Konfidenzintervalle",
      "Hypothesentests",
      "t-Test, χ²-Test, F-Test",
      "Einfache lineare Regression",
      "Multiple Regression",
      "Nichtparametrische Methoden",
      "Bayes-Statistik – Einführung",
    ],
  },
  {
    id: "uni-diskret",
    title: "Diskrete Mathematik",
    emoji: "🕸️",
    level: "Studium",
    levelLabel: "1.–2. Semester",
    description: "Logik, Mengenlehre, Graphentheorie und Kombinatorik.",
    color: "bg-amber-700",
    badge: "Hochschule",
    topics: [
      "Aussagenlogik",
      "Prädikatenlogik",
      "Mengenlehre",
      "Relationen & Funktionen",
      "Beweistechniken",
      "Vollständige Induktion",
      "Kombinatorik",
      "Graphentheorie – Grundlagen",
      "Bäume & Wälder",
      "Algorithmen auf Graphen",
      "Kodierungstheorie",
    ],
  },
  {
    id: "uni-komplex",
    title: "Komplexe Analysis",
    emoji: "ℂ",
    level: "Studium",
    levelLabel: "3.–4. Semester",
    description: "Holomorphe Funktionen, Cauchy-Integralsatz und Residuensatz.",
    color: "bg-fuchsia-700",
    badge: "Hochschule",
    topics: [
      "Komplexe Zahlen – Wiederholung",
      "Holomorphe Funktionen",
      "Cauchy-Riemann-Gleichungen",
      "Komplexe Integration",
      "Cauchy-Integralsatz",
      "Cauchy-Integralformel",
      "Laurent-Reihen",
      "Singularitäten",
      "Residuensatz",
      "Konforme Abbildungen",
    ],
  },
  {
    id: "uni-numerik",
    title: "Numerische Mathematik",
    emoji: "💻",
    level: "Studium",
    levelLabel: "3. Semester",
    description: "Approximation, Newton-Verfahren und numerische Integration.",
    color: "bg-cyan-700",
    badge: "Hochschule",
    topics: [
      "Gleitkommazahlen & Fehleranalyse",
      "Iterationsverfahren",
      "Newton-Verfahren",
      "Polynominterpolation",
      "Spline-Interpolation",
      "Numerische Differentiation",
      "Numerische Integration (Quadratur)",
      "Lineare Gleichungssysteme numerisch",
      "LU-Zerlegung",
      "Eigenwert-Algorithmen",
    ],
  },
];

// ─── Level config ──────────────────────────────────────────────────────────────

const levelConfig: Record<Exclude<Level, "Alle">, { color: string; bg: string; icon: string }> = {
  Grundschule: { color: "text-sky-600 dark:text-sky-400",     bg: "bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800",     icon: "🏫" },
  Mittelstufe: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", icon: "📗" },
  Oberstufe:   { color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800", icon: "🎓" },
  Studium:     { color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800",     icon: "🏛️" },
};

const levels: Level[] = ["Alle", "Grundschule", "Mittelstufe", "Oberstufe", "Studium"];

// ─── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = levelConfig[course.level];
  const previewTopics = course.topics.slice(0, 4);
  const remainingTopics = course.topics.length - 4;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:border-primary/30 hover:shadow-md">
      {/* Color strip */}
      <div className={`h-1.5 w-full ${course.color}`} />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="mb-3 flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${course.color} text-2xl`}>
            {course.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold leading-tight">{course.title}</p>
              {course.badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {course.badge}
                </span>
              )}
            </div>
            <div className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
              {cfg.icon} {course.levelLabel}
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{course.description}</p>

        {/* Topic preview */}
        <div className="flex-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {course.topics.length} Themen
          </p>
          <ul className="space-y-1">
            {(expanded ? course.topics : previewTopics).map((topic) => (
              <li key={topic} className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                {topic}
              </li>
            ))}
          </ul>
          {!expanded && remainingTopics > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              + {remainingTopics} weitere Themen
            </button>
          )}
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-2 text-xs font-medium text-muted-foreground hover:underline"
            >
              Weniger anzeigen
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" className="flex-1 gap-1.5">
            <Link href={`/scan`}>
              <ScanLine className="h-3.5 w-3.5" />
              Aufgabe scannen
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5">
            <Link href={`/create`}>
              <Plus className="h-3.5 w-3.5" />
              Karten erstellen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LernenPage() {
  const [activeLevel, setActiveLevel] = useState<Level>("Alle");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return courses.filter((c) => {
      const matchesLevel = activeLevel === "Alle" || c.level === activeLevel;
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.topics.some((t) => t.toLowerCase().includes(q));
      return matchesLevel && matchesQuery;
    });
  }, [activeLevel, query]);

  const countByLevel = useMemo(
    () =>
      (Object.keys(levelConfig) as Exclude<Level, "Alle">[]).reduce(
        (acc, lvl) => ({ ...acc, [lvl]: courses.filter((c) => c.level === lvl).length }),
        {} as Record<string, number>
      ),
    []
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mathematik lernen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length} Kurse · von Grundschule bis Hochschule
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/scan">
              <ScanLine className="h-4 w-4" />
              Aufgabe scannen
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/create">
              <Plus className="h-4 w-4" />
              Eigenes Deck
            </Link>
          </Button>
        </div>
      </div>

      {/* Level stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.entries(levelConfig) as [Exclude<Level, "Alle">, typeof levelConfig[keyof typeof levelConfig]][]).map(([lvl, cfg]) => (
          <button
            key={lvl}
            onClick={() => setActiveLevel(lvl === activeLevel ? "Alle" : lvl)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all hover:shadow-sm",
              activeLevel === lvl ? `${cfg.bg} ring-2 ring-primary/30` : "bg-card hover:border-primary/20"
            )}
          >
            <span className="text-2xl">{cfg.icon}</span>
            <div>
              <p className={`text-sm font-bold ${activeLevel === lvl ? cfg.color : ""}`}>{lvl}</p>
              <p className="text-xs text-muted-foreground">{countByLevel[lvl]} Kurse</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search + filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kurs oder Thema suchen…"
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>

        {/* Level pills */}
        <div className="flex flex-wrap gap-1.5">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={cn(
                "rounded-full px-3.5 py-1 text-sm font-medium transition-all",
                activeLevel === lvl
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {lvl}
              {lvl !== "Alle" && (
                <span className="ml-1.5 opacity-60">
                  {countByLevel[lvl]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {query && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} Ergebnis{filtered.length !== 1 ? "se" : ""} für „{query}"
        </p>
      )}

      {/* Info banner (per level) */}
      {activeLevel !== "Alle" && (
        <div className={cn("flex items-start gap-3 rounded-2xl border p-4", levelConfig[activeLevel].bg)}>
          <div className="text-2xl">{levelConfig[activeLevel].icon}</div>
          <div>
            <p className={cn("font-bold", levelConfig[activeLevel].color)}>{activeLevel}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeLevel === "Grundschule" && "Klasse 1–4 · Grundlagen der Mathematik"}
              {activeLevel === "Mittelstufe" && "Klasse 5–10 · Algebra, Funktionen und Geometrie"}
              {activeLevel === "Oberstufe"   && "Klasse 11–13 · Analysis, Vektoren und Stochastik"}
              {activeLevel === "Studium"     && "Hochschule · Rigorose Mathematik und Beweise"}
            </p>
          </div>
        </div>
      )}

      {/* Course grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <Sigma className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">Kein Kurs gefunden</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Andere Suchbegriffe versuchen?</p>
        </div>
      )}

      {/* Footer hint */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border bg-muted/30 px-6 py-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-violet-500" />
          <span>Aufgabe fotografieren → KI erklärt sie Schritt für Schritt</span>
        </div>
        <ChevronRight className="h-4 w-4 opacity-30" />
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-500" />
          <span>Erklärung als Lernkarten speichern</span>
        </div>
        <ChevronRight className="h-4 w-4 opacity-30" />
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span>Mit Spaced Repetition dauerhaft lernen</span>
        </div>
      </div>

    </div>
  );
}
