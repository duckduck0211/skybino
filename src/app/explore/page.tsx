"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Calendar,
  Clock,
  Zap,
  Shuffle,
  HelpCircle,
  ImageIcon,
  Timer,
  ArrowRight,
  BookOpen,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/aurora-background";

// ─── Data ─────────────────────────────────────────────────────────────────────

const autoFeatures = [
  {
    icon: Brain,
    color: "text-violet-500",
    bg: "bg-violet-50",
    title: "Active Recall",
    desc: "Jede Karteikarte zwingt dich, die Antwort abzurufen — kein passives Lesen.",
  },
  {
    icon: Calendar,
    color: "text-blue-500",
    bg: "bg-blue-50",
    title: "Spaced Repetition",
    desc: "Schwierige Karten kommen früher zurück. Bekannte Karten in längeren Abständen.",
  },
  {
    icon: HelpCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    title: "Feynman-Technik",
    desc: "Bald: KI erklärt dir jeden Begriff auf Level 1, 2 oder 3 — auf Knopfdruck.",
  },
  {
    icon: Timer,
    color: "text-rose-500",
    bg: "bg-rose-50",
    title: "Pomodoro",
    desc: "Klare Lernsessions mit Fokus-Timer — Pausen sind Teil des Systems.",
  },
  {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Parkinsons Gesetz",
    desc: "Setze dir ein Ziel pro Session: '20 Karten in 15 Minuten.' und ziehe es durch.",
  },
  {
    icon: Shuffle,
    color: "text-teal-500",
    bg: "bg-teal-50",
    title: "Interleaved Practice",
    desc: "Wechsle zwischen verschiedenen Decks in einer Session — das ist besser als du denkst.",
  },
];

const techniques = [
  {
    id: "active-recall",
    icon: Brain,
    emoji: "🧠",
    title: "Active Recall",
    accentBg: "bg-violet-50",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200",
    tagBg: "bg-violet-100 text-violet-700",
    effectiveness: 5,
    tag: "Höchste Evidenz",
    oneLiner: "Sich selbst testen ist 2× effektiver als nochmal lesen.",
    detail:
      "Beim passiven Lesen glaubt das Gehirn, es habe etwas gelernt — aber das ist eine Illusion. Erst wenn du versuchst, etwas aus dem Gedächtnis abzurufen, werden Synapsen wirklich gestärkt. Genau das passiert bei jeder Karteikarte.",
    howItWorks: [
      "Lerne den Stoff einmal aktiv",
      "Klappe das Buch zu — schreibe auf, was du noch weißt",
      "Vergleiche mit dem Original, identifiziere Lücken",
      "Erstelle Karteikarten für jede Lücke",
    ],
    studies: [
      { authors: "Roediger & Karpicke", year: 2006, finding: "Testing-Gruppe erinnerte sich nach 1 Woche an 50% mehr als die Wiederholungs-Gruppe" },
      { authors: "Dunlosky et al.", year: 2013, finding: "Practice Testing ist eine der zwei Techniken mit 'High Utility' in der gesamten Forschungsliteratur" },
    ],
  },
  {
    id: "spaced-repetition",
    icon: Calendar,
    emoji: "📅",
    title: "Spaced Repetition",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    accentBorder: "border-blue-200",
    tagBg: "bg-blue-100 text-blue-700",
    effectiveness: 5,
    tag: "Höchste Evidenz",
    oneLiner: "Kurz vor dem Vergessen wiederholen — das macht den Unterschied.",
    detail:
      "Das Gehirn vergisst exponentiell. Aber jede Wiederholung setzt die Kurve zurück und verlängert die Zeit bis zum nächsten Vergessen. Mit der richtigen Planung brauchst du deutlich weniger Wiederholungen für dasselbe Ergebnis.",
    howItWorks: [
      "Tag 1: Neues Material lernen",
      "Tag 3: Erste Wiederholung (kurz vor dem Vergessen)",
      "Tag 7, Tag 21, Tag 60 — Abstände wachsen",
      "Schwierige Karten: kürzere Abstände. Leichte: längere.",
    ],
    studies: [
      { authors: "Ebbinghaus", year: 1885, finding: "Entdeckte die Vergessenskurve: ~70% Verlust in 24h ohne Wiederholung" },
      { authors: "Dunlosky et al.", year: 2013, finding: "Distributed Practice: zweite Technik mit 'High Utility' — wirksam über alle Fächer und Altersgruppen" },
    ],
  },
  {
    id: "feynman",
    icon: HelpCircle,
    emoji: "🧑‍🏫",
    title: "Feynman-Technik",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    tagBg: "bg-emerald-100 text-emerald-700",
    effectiveness: 4,
    tag: "Tiefes Verstehen",
    oneLiner: "Wenn du etwas nicht einfach erklären kannst, hast du es nicht verstanden.",
    detail:
      "Richard Feynman, Physik-Nobelpreisträger, hatte eine Regel: Erkläre alles, als würdest du es einem Kind erklären. Sobald du auf Fachbegriffe angewiesen bist, hast du eine Lücke. Genau diese Lücke schließen — das ist echtes Lernen. In Synapze kommt bald: KI erklärt dir jeden Begriff auf Level 1 (einfach), 2 (Student) oder 3 (Experte).",
    howItWorks: [
      "Lerne ein Konzept",
      "Erkläre es schriftlich, als würdest du es einem 12-Jährigen erklären",
      "Identifiziere, wo du ins Stocken kommst oder Fachbegriffe brauchst",
      "Gehe zurück und erkläre diese Stellen nochmals — einfacher",
    ],
    studies: [
      { authors: "Flavell", year: 1979, finding: "Metakognition (Wissen über das eigene Wissen) ist ein starker Prädiktor für Lernerfolg" },
      { authors: "Chi et al.", year: 1989, finding: "Selbsterklärungen während des Lernens führen zu deutlich besserem Verständnis" },
    ],
  },
  {
    id: "pomodoro",
    icon: Timer,
    emoji: "🍅",
    title: "Pomodoro-Technik",
    accentBg: "bg-rose-50",
    accentText: "text-rose-700",
    accentBorder: "border-rose-200",
    tagBg: "bg-rose-100 text-rose-700",
    effectiveness: 4,
    tag: "Fokus & Energie",
    oneLiner: "25 Minuten Fokus, 5 Minuten Pause — und wiederholen.",
    detail:
      "Das Gehirn kann sich nicht unbegrenzt konzentrieren. Wer stundenlang durcharbeitet, verliert die Aufmerksamkeit schleichend — ohne es zu merken. Strukturierte Pausen halten das Konzentrations-Niveau konstant hoch.",
    howItWorks: [
      "Timer auf 25 Minuten — fokussiert lernen, kein Handy",
      "Timer klingelt → 5 Minuten echte Pause (aufstehen, bewegen)",
      "Nach 4 Runden: 15–30 Minuten lange Erholungspause",
      "Eine klare Aufgabe pro Pomodoro — kein Multitasking",
    ],
    studies: [
      { authors: "Ariga & Lleras", year: 2011, finding: "Kurze mentale Pausen verhindern den Abfall der Aufmerksamkeit bei längerem Arbeiten signifikant" },
      { authors: "Cirillo", year: 1992, finding: "Ursprüngliche Entwicklung als Student — heute in der Produktivitätsforschung weit verbreitet" },
    ],
  },
  {
    id: "parkinsons",
    icon: Clock,
    emoji: "⏰",
    title: "Parkinsons Gesetz",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200",
    tagBg: "bg-amber-100 text-amber-700",
    effectiveness: 3,
    tag: "Zeitmanagement",
    oneLiner: "Arbeit dehnt sich auf die Zeit aus, die du ihr gibst — also gib weniger.",
    detail:
      "Wenn du dir 3 Stunden nimmst, um 30 Karteikarten zu lernen, dauert es 3 Stunden. Wenn du dir 30 Minuten nimmst, schaffst du es in 30 Minuten — und lernst genauso viel. Der leichte Zeitdruck erzeugt genau den richtigen Fokus.",
    howItWorks: [
      "Schätze, wie lange eine Aufgabe dauern würde",
      "Setze dir 60–70% dieser Zeit als harte Deadline",
      "Arbeite mit diesem leichten Zeitdruck",
      "Du wirst überrascht sein, was möglich ist",
    ],
    studies: [
      { authors: "Locke & Latham", year: 2002, finding: "Spezifische, herausfordernde Ziele führen zu 16% besserer Leistung als vage oder keine Ziele" },
      { authors: "Parkinson, C. N.", year: 1955, finding: "'Work expands so as to fill the time available' — The Economist" },
    ],
  },
  {
    id: "interleaving",
    icon: Shuffle,
    emoji: "🔀",
    title: "Interleaved Practice",
    accentBg: "bg-teal-50",
    accentText: "text-teal-700",
    accentBorder: "border-teal-200",
    tagBg: "bg-teal-100 text-teal-700",
    effectiveness: 4,
    tag: "Überraschend wirksam",
    oneLiner: "Themen mischen fühlt sich schwerer an — ist aber deutlich besser.",
    detail:
      "Wenn du Thema A vollständig lernst, dann B, dann C (geblockt), fühlt es sich flüssig an. Aber beim Test erkennst du nicht, wann du welche Methode anwenden sollst. Beim gemischten Lernen baut das Gehirn genau diese Unterscheidungsfähigkeit auf.",
    howItWorks: [
      "Lerne nicht ein Thema komplett, dann das nächste",
      "Wechsle: 10 Biologie, 10 Chemie, 10 Geschichte, zurück zu Biologie",
      "Akzeptiere, dass es sich anstrengender anfühlt — das ist gewollt",
      "Teste dich regelmäßig über alle Themen gleichzeitig",
    ],
    studies: [
      { authors: "Rohrer & Taylor", year: 2007, finding: "Interleaved Practice führte zu 43% besseren Testergebnissen als geblockte Praxis" },
      { authors: "Kornell & Bjork", year: 2008, finding: "Probanden bevorzugten geblockte Praxis — aber interleaved war objektiv 2× effektiver" },
    ],
  },
  {
    id: "elaboration",
    icon: FlaskConical,
    emoji: "🔬",
    title: "Elaborative Interrogation",
    accentBg: "bg-orange-50",
    accentText: "text-orange-700",
    accentBorder: "border-orange-200",
    tagBg: "bg-orange-100 text-orange-700",
    effectiveness: 3,
    tag: "Tiefenverarbeitung",
    oneLiner: "Frage bei allem: Warum ist das so?",
    detail:
      "Fakten ohne Kontext sind schwer zu behalten. Wenn du fragst, warum etwas wahr ist, und die Antwort mit vorhandenem Wissen verknüpfst, entsteht ein Gedächtnis-Netzwerk — das viel robuster ist als isolierte Einzelinfos.",
    howItWorks: [
      "Lies eine Aussage oder ein Faktum",
      "Frage: 'Warum ist das wahr?' und 'Wie hängt das zusammen?'",
      "Schreibe eine eigene Erklärung ohne Vorlage",
      "Verknüpfe es bewusst mit bereits bekanntem Wissen",
    ],
    studies: [
      { authors: "Dunlosky et al.", year: 2013, finding: "Mittlere Evidenz — wirkt besonders stark bei Fakten-basiertem Lernmaterial" },
      { authors: "Pressley et al.", year: 1987, finding: "Elaborations verbessern das Erinnern von Fakten um bis zu 72%" },
    ],
  },
  {
    id: "dual-coding",
    icon: ImageIcon,
    emoji: "🖼️",
    title: "Dual Coding",
    accentBg: "bg-pink-50",
    accentText: "text-pink-700",
    accentBorder: "border-pink-200",
    tagBg: "bg-pink-100 text-pink-700",
    effectiveness: 4,
    tag: "Visuelles Lernen",
    oneLiner: "Text + Bild zusammen — zwei Abrufwege statt einem.",
    detail:
      "Das Gehirn hat getrennte Systeme für Sprache und Bilder. Wenn du beides kombinierst, hast du zwei unabhängige Abruf-Wege — einer davon reicht, um das andere zu reaktivieren. Eine simple Skizze reicht — kein Kunsttalent nötig.",
    howItWorks: [
      "Lese einen Text und verstehe ihn",
      "Zeichne eine Skizze oder ein Diagramm dazu",
      "Beim Wiederholen: nur die Skizze ansehen, Text rekonstruieren",
      "Besonders effektiv für Prozesse, Strukturen, Zeitlinien",
    ],
    studies: [
      { authors: "Paivio", year: 1986, finding: "Dual Coding Theory: Verbale + bildliche Enkodierung erzeugen doppelte Abrufmöglichkeiten" },
      { authors: "Mayer & Moreno", year: 2003, finding: "Multimedia-Lernen ist signifikant effektiver als Text allein — kognitive Theorie des multimedialen Lernens" },
    ],
  },
];

// ─── Forgetting Curve ─────────────────────────────────────────────────────────

function ForgettingCurveChart() {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">📉</span>
        <h3 className="font-bold text-lg">Die Vergessenskurve</h3>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">Ebbinghaus, 1885 — und wie Spaced Repetition sie überwindet</p>

      <svg viewBox="0 0 300 110" className="w-full" style={{ height: 180 }}>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="278" y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        {[{ y: 10, l: "100%" }, { y: 35, l: "75%" }, { y: 60, l: "50%" }, { y: 85, l: "25%" }].map(({ y, l }) => (
          <text key={l} x="282" y={y + 3} fontSize="7" fill="#9ca3af">{l}</text>
        ))}
        {[{ x: 0, l: "Jetzt" }, { x: 40, l: "20m" }, { x: 70, l: "1h" }, { x: 105, l: "1d" }, { x: 148, l: "1W" }, { x: 200, l: "1M" }, { x: 250, l: "6M" }].map(({ x, l }) => (
          <text key={l} x={x} y="107" fontSize="6.5" fill="#9ca3af" textAnchor="middle">{l}</text>
        ))}
        {/* Without repetition — steep decay */}
        <path d="M 0,10 C 30,10 40,50 60,70 S 90,90 150,93 S 210,96 280,97" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        {/* With spaced repetition — sawtooth pattern */}
        <path d="M 0,10 C 15,10 25,25 40,35 L 40,10 C 50,10 55,20 70,30 L 70,10 C 82,10 88,18 105,25 L 105,10 C 120,10 127,16 148,21 L 148,10 C 165,10 173,14 200,18 L 200,10 C 220,10 230,13 280,15" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
        {/* Review dots */}
        {[40, 70, 105, 148, 200].map((x, i) => (
          <circle key={i} cx={x} cy="10" r="3" fill="#818cf8" />
        ))}
        <line x1="0" y1="100" x2="278" y2="100" stroke="#d1d5db" strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2="100" stroke="#d1d5db" strokeWidth="1" />
      </svg>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded-full bg-red-400" />
          <span className="text-muted-foreground">Ohne Wiederholung</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded-full bg-violet-400" />
          <span className="text-muted-foreground">Mit Spaced Repetition</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-violet-400" />
          <span className="text-muted-foreground">Wiederholungspunkte</span>
        </div>
      </div>
    </div>
  );
}

// ─── Spaced Repetition Timeline ───────────────────────────────────────────────

function SpacedRepetitionTimeline() {
  const reviews = [
    { day: "Tag 1", note: "Erstes Lernen", color: "bg-violet-500", confidence: 1 },
    { day: "Tag 3", note: "+2 Tage seit letzter Wiederholung", color: "bg-violet-500", confidence: 2 },
    { day: "Tag 7", note: "+4 Tage", color: "bg-blue-500", confidence: 3 },
    { day: "Tag 16", note: "+9 Tage", color: "bg-blue-400", confidence: 4 },
    { day: "Tag 35", note: "+19 Tage", color: "bg-teal-500", confidence: 5 },
    { day: "Tag 75", note: "+40 Tage — Langzeitgedächtnis", color: "bg-emerald-500", confidence: 5 },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">📅</span>
        <h3 className="font-bold text-lg">Spaced Repetition: Wie es aussieht</h3>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">6 kurze Wiederholungen — und es sitzt für Monate</p>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted" />
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="flex items-center gap-4 pl-2">
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.color} text-white text-xs font-bold`}>
                {i + 1}
              </div>
              <div className="flex flex-1 items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{r.day}</p>
                  <p className="text-xs text-muted-foreground">{r.note}</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className={`h-2 w-2 rounded-full ${j < r.confidence ? r.color : "bg-muted"}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Technique Accordion ──────────────────────────────────────────────────────

function TechniqueCard({ t, isOpen, onToggle }: {
  t: typeof techniques[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = t.icon;
  return (
    <div className={`overflow-hidden rounded-2xl border-2 transition-all ${isOpen ? t.accentBorder : "border-border"}`}>
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-4 p-4 text-left transition-colors ${isOpen ? t.accentBg : "hover:bg-muted/40"}`}
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isOpen ? `${t.accentBg} ${t.accentBorder}` : "border-border bg-muted"}`}>
          <Icon className={`h-5 w-5 ${isOpen ? t.accentText : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{t.emoji} {t.title}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.tagBg}`}>{t.tag}</span>
          </div>
          <p className={`mt-0.5 text-sm ${isOpen ? t.accentText : "text-muted-foreground"}`}>{t.oneLiner}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-1.5 w-3 rounded-full ${i < t.effectiveness ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="space-y-4 border-t p-5">
          <p className="text-sm leading-relaxed">{t.detail}</p>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">So gehst du vor</p>
            <ol className="space-y-1.5">
              {t.howItWorks.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${t.accentBg} ${t.accentText} ${t.accentBorder}`}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className={`rounded-xl border p-4 ${t.accentBg} ${t.accentBorder}`}>
            <p className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${t.accentText}`}>
              <FlaskConical className="h-3 w-3" />
              Studien & Belege
            </p>
            <div className="space-y-2">
              {t.studies.map((s, i) => (
                <div key={i} className="rounded-lg bg-white/70 p-3">
                  <p className={`text-xs font-semibold ${t.accentText}`}>{s.authors} ({s.year})</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.finding}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" />
            <p className="text-xs font-medium text-primary">
              In Synapze automatisch integriert — du musst nicht aktiv daran denken.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [openTechnique, setOpenTechnique] = useState<string | null>(null);
  const toggle = (id: string) => setOpenTechnique((p) => (p === id ? null : id));

  return (
    <div className="space-y-10">
      {/* Aurora Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950" style={{ minHeight: 340 }}>
        <AuroraBackground className="absolute inset-0 h-full w-full" />
        {/* Gradient overlay — ensures text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-8" style={{ minHeight: 340 }}>
          <div className="max-w-xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-300">Lernwissenschaft</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Du lernst richtig.<br />Automatisch.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/70">
              Synapze implementiert 8 evidenzbasierte Lernprinzipien — du lernst einfach, und das System sorgt dafür, dass es sitzt.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {autoFeatures.slice(0, 5).map((f) => (
                <div key={f.title} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <f.icon className="h-3.5 w-3.5 text-white/80" />
                  <span className="text-xs font-medium text-white">{f.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-integrated features */}
      <section>
        <h3 className="mb-1 text-xl font-bold">Was Synapze automatisch macht</h3>
        <p className="mb-4 text-sm text-muted-foreground">Du musst nicht an Lernstrategien denken — wir bauen sie ein.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {autoFeatures.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visuals */}
      <section>
        <h3 className="mb-1 text-xl font-bold">Warum es funktioniert</h3>
        <p className="mb-4 text-sm text-muted-foreground">Die zwei zentralen Visualisierungen dahinter.</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <ForgettingCurveChart />
          <SpacedRepetitionTimeline />
        </div>
      </section>

      {/* Active Recall bar chart */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <div>
              <h3 className="font-bold text-lg">Active Recall vs. passives Lesen</h3>
              <p className="text-sm text-muted-foreground">Retention nach 1 Woche — was wirklich bleibt</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Nochmal lesen (4×)", pct: 39, color: "bg-rose-400", icon: "📖" },
              { label: "Markieren & Highlighten", pct: 41, color: "bg-orange-400", icon: "🖊️" },
              { label: "Zusammenfassung schreiben", pct: 55, color: "bg-yellow-400", icon: "✏️" },
              { label: "Karteikarten (Active Recall)", pct: 80, color: "bg-emerald-500", icon: "🃏" },
              { label: "Active Recall + Spaced Rep.", pct: 95, color: "bg-violet-500", icon: "⚡" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-base">{row.icon}</span>
                <span className="w-52 shrink-0 text-sm">{row.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-muted" style={{ height: 22 }}>
                  <div
                    className={`flex h-full items-center justify-end rounded-full pr-2 ${row.color}`}
                    style={{ width: `${row.pct}%` }}
                  >
                    <span className="text-[11px] font-bold text-white">{row.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Basierend auf: Roediger & Karpicke (2006), Dunlosky et al. (2013)</p>
        </CardContent>
      </Card>

      {/* Techniques accordion */}
      <section>
        <h3 className="mb-1 text-xl font-bold">Die 8 Prinzipien im Detail</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Tippe auf ein Prinzip — vollständige Erklärung und Originalstudien.
        </p>
        <div className="space-y-2">
          {techniques.map((t) => (
            <TechniqueCard key={t.id} t={t} isOpen={openTechnique === t.id} onToggle={() => toggle(t.id)} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gradient-to-r from-primary to-violet-400 p-8 text-center text-white">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-white/80" />
        <h3 className="text-2xl font-bold">Bereit, richtig zu lernen?</h3>
        <p className="mt-2 text-white/75">Alle Prinzipien sind eingebaut. Du musst nur lernen.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link href="/decks"><BookOpen className="mr-2 h-4 w-4" />Jetzt lernen</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
            <Link href="/create">Deck erstellen <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Sources */}
      <div className="space-y-1 pb-6 text-xs text-muted-foreground">
        <p className="font-semibold">Quellen:</p>
        <p>· Roediger & Karpicke (2006). The Power of Testing Memory. Psychological Science.</p>
        <p>· Dunlosky et al. (2013). Improving Students' Learning. Psychological Science in the Public Interest.</p>
        <p>· Ebbinghaus, H. (1885). Über das Gedächtnis. Duncker & Humblot.</p>
        <p>· Ariga & Lleras (2011). Brief mental breaks. Cognition.</p>
        <p>· Rohrer & Taylor (2007). The shuffling of mathematics problems. Instructional Science.</p>
        <p>· Paivio, A. (1986). Mental Representations: A Dual Coding Approach. Oxford University Press.</p>
      </div>
    </div>
  );
}
