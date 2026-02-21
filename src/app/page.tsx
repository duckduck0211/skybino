"use client";

import Link from "next/link";
import {
  Brain,
  Calendar,
  Clock,
  Zap,
  Shuffle,
  HelpCircle,
  Timer,
  ArrowRight,
  BookOpen,
  Upload,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/aurora-background";
import { FeatureCard, featureTooltips } from "@/components/feature-card";

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "70%", label: "des Gelernten", sublabel: "vergessen nach 24h" },
  { value: "2×", label: "effektiver", sublabel: "als passives Lesen" },
  { value: "6×", label: "Wiederholungen", sublabel: "fürs Langzeitgedächtnis" },
];

const features = [
  {
    icon: Brain,
    bg: "bg-violet-500",
    glow: "shadow-violet-500/30",
    title: "Active Recall",
    desc: "Abrufen statt Lesen. Synapzen wachsen durch Erinnerung.",
  },
  {
    icon: Calendar,
    bg: "bg-blue-500",
    glow: "shadow-blue-500/30",
    title: "Spaced Repetition",
    desc: "Kurz vor dem Vergessen wiederholen — automatisch.",
  },
  {
    icon: HelpCircle,
    bg: "bg-emerald-500",
    glow: "shadow-emerald-500/30",
    title: "Feynman-Technik",
    desc: "KI erklärt jeden Begriff auf Level 1, 2 oder 3.",
  },
  {
    icon: Timer,
    bg: "bg-rose-500",
    glow: "shadow-rose-500/30",
    title: "Pomodoro",
    desc: "Fokus-Sessions mit eingebautem Timer und Pausen.",
  },
  {
    icon: Clock,
    bg: "bg-amber-500",
    glow: "shadow-amber-500/30",
    title: "Parkinsons Gesetz",
    desc: "Zeitdruck macht aus 3 Stunden 30 Minuten.",
  },
  {
    icon: Shuffle,
    bg: "bg-teal-500",
    glow: "shadow-teal-500/30",
    title: "Interleaved Practice",
    desc: "Themen mischen — fühlt sich schwerer an, wirkt besser.",
  },
];

const steps = [
  {
    icon: Upload,
    bg: "bg-violet-500",
    glow: "shadow-violet-500/40",
    step: "01",
    title: "Lade deinen Inhalt hoch",
    desc: "PDF, Buchseite, Mitschrift — Synapze liest alles.",
  },
  {
    icon: Zap,
    bg: "bg-primary",
    glow: "shadow-primary/40",
    step: "02",
    title: "KI erstellt deine Karten",
    desc: "Präzise Fragen und Antworten aus deinem Material.",
  },
  {
    icon: Layers,
    bg: "bg-emerald-500",
    glow: "shadow-emerald-500/40",
    step: "03",
    title: "Du lernst mit System",
    desc: "Active Recall und Spaced Repetition — automatisch.",
  },
];

// ─── Ebbinghaus Curve SVG ─────────────────────────────────────────────────────
// y(pct) = 175 - (pct/100)*155  →  chart area top=20, bottom=175, height=155
// x-axis: Start=50, 20Min=108, 1Std=155, Tag1=235, Tag3=308, Tag7=390, Tag14=463, Tag30=560
function EbbinghausCurve() {
  const gridPcts = [25, 50, 75, 100];
  const xLabels = [
    { x: 50, label: "Lernen" },
    { x: 108, label: "20 Min" },
    { x: 155, label: "1 Std" },
    { x: 235, label: "Tag 1" },
    { x: 308, label: "Tag 3" },
    { x: 390, label: "Tag 7" },
    { x: 463, label: "Tag 14" },
    { x: 560, label: "Tag 30" },
  ];
  // Review dots: shown at the peak after each review
  const reviewDots = [
    { x: 237, y: 36 },
    { x: 310, y: 32 },
    { x: 392, y: 29 },
    { x: 465, y: 26 },
  ];

  return (
    <svg viewBox="0 0 590 200" className="w-full" aria-label="Vergessenskurve Ebbinghaus">
      {/* Horizontal grid lines */}
      {gridPcts.map((pct) => {
        const y = 175 - (pct / 100) * 155;
        return (
          <line key={pct} x1="50" y1={y} x2="565" y2={y}
            stroke="white" strokeOpacity="0.06" strokeWidth="1" />
        );
      })}

      {/* Y-axis labels */}
      {gridPcts.map((pct) => {
        const y = 175 - (pct / 100) * 155;
        return (
          <text key={pct} x="44" y={y + 4} textAnchor="end"
            fontSize="9" fill="white" fillOpacity="0.35">
            {pct}%
          </text>
        );
      })}

      {/* X-axis baseline */}
      <line x1="50" y1="175" x2="565" y2="175"
        stroke="white" strokeOpacity="0.15" strokeWidth="1" />

      {/* X-axis labels */}
      {xLabels.map(({ x, label }) => (
        <text key={label} x={x} y="190" textAnchor="middle"
          fontSize="9" fill="white" fillOpacity="0.35">
          {label}
        </text>
      ))}

      {/* Review guide lines (dotted violet) */}
      {[235, 308, 390, 463].map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="175"
          stroke="#a78bfa" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3,3" />
      ))}

      {/* ── Decay curve (without Synapze) ── */}
      {/* Fill */}
      <path
        d="M 50,20 C 78,52 96,76 108,85 C 130,97 145,104 155,107 C 190,117 220,122 235,124 C 270,129 295,131 308,132 C 350,134 375,135 390,136 C 425,138 448,140 463,141 C 500,141 535,142 565,143 L 565,175 L 50,175 Z"
        fill="#f43f5e" fillOpacity="0.1"
      />
      {/* Stroke */}
      <path
        d="M 50,20 C 78,52 96,76 108,85 C 130,97 145,104 155,107 C 190,117 220,122 235,124 C 270,129 295,131 308,132 C 350,134 375,135 390,136 C 425,138 448,140 463,141 C 500,141 535,142 565,143"
        fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"
      />

      {/* ── Synapze curve (with Spaced Repetition) ── */}
      {/* Fill */}
      <path
        d="M 50,20 C 100,38 180,60 233,79 L 237,36 C 265,46 290,55 306,60 L 310,32 C 345,38 370,45 388,51 L 392,29 C 420,34 445,39 461,43 L 465,26 C 505,32 540,38 565,43 L 565,175 L 50,175 Z"
        fill="#8b5cf6" fillOpacity="0.14"
      />
      {/* Stroke */}
      <path
        d="M 50,20 C 100,38 180,60 233,79 L 237,36 C 265,46 290,55 306,60 L 310,32 C 345,38 370,45 388,51 L 392,29 C 420,34 445,39 461,43 L 465,26 C 505,32 540,38 565,43"
        fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Review dots */}
      {reviewDots.map(({ x, y }) => (
        <g key={x}>
          <circle cx={x} cy={y} r="5" fill="#8b5cf6" />
          <circle cx={x} cy={y} r="2.5" fill="white" fillOpacity="0.9" />
        </g>
      ))}

      {/* End callouts */}
      <text x="571" y="147" fontSize="10" fontWeight="bold" fill="#f43f5e">~21%</text>
      <text x="571" y="47" fontSize="10" fontWeight="bold" fill="#a78bfa">~85%</text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative -mx-6 -mt-6 bg-[#020008]">

      {/* Aurora Background */}
      <div
        className="pointer-events-none w-full"
        style={{ position: "sticky", top: 0, height: "100vh", marginBottom: "-100vh", zIndex: 0 }}
      >
        <AuroraBackground className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020008]/40 to-[#020008]/90" />
      </div>

      <div className="relative z-10 px-6 pb-24">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="flex min-h-[80vh] flex-col justify-center">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              <span className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
                Lernwissenschaft
              </span>
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
              Lern wie das Gehirn
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-primary bg-clip-text text-transparent">
                es wirklich will.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/60">
              Die meisten lernen falsch — nicht aus Faulheit, sondern weil niemand es ihnen erklärt hat.
              Synapze baut die Wissenschaft ein.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary font-semibold hover:bg-white/90 shadow-lg shadow-white/10">
                <Link href="/create">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Deck erstellen
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-20">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.value}>
                <p className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                  {s.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-white/80">{s.label}</p>
                <p className="mt-0.5 text-xs text-white/40">{s.sublabel}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-white/25">
            Ebbinghaus (1885) · Roediger & Karpicke (2006) · Dunlosky et al. (2013)
          </p>
        </section>

        {/* ── Onboarding Re-trigger ─────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl pb-4 text-center">
          <button
            onClick={() => window.dispatchEvent(new Event("synapze:show-onboarding"))}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/60 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/90"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Intro nochmals ansehen — warum anders lernen?
          </button>
        </div>

        {/* ── Feature Grid ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-white">Was Synapze automatisch macht</h2>
            <p className="mt-3 text-sm text-white/40">Du denkst an den Stoff. Wir denken ans Lernen.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                bg={f.bg}
                glow={f.glow}
                title={f.title}
                desc={f.desc}
                tooltip={featureTooltips[f.title] ?? { text: f.desc }}
              />
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-white">So funktioniert Synapze</h2>
            <p className="mt-3 text-sm text-white/40">Drei Schritte. Das war's.</p>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-3">
            {/* Connector line (desktop) */}
            <div className="absolute top-[26px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px bg-gradient-to-r from-violet-500/40 via-primary/40 to-emerald-500/40 sm:block" />

            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl ${s.bg} shadow-xl ${s.glow}`}>
                    <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                  <span className="mt-4 text-xs font-bold tracking-widest text-white/30">{s.step}</span>
                  <p className="mt-1 font-bold text-white">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Ebbinghaus Curve ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-white">Das Gehirn vergisst. Synapze nicht.</h2>
            <p className="mt-3 text-sm text-white/40">Ebbinghaus, 1885 — die Wissenschaft hinter Synapze.</p>
          </div>

          {/* Callout boxes */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-center">
              <p className="text-3xl font-black text-rose-400">~21%</p>
              <p className="mt-1 text-xs font-semibold text-white/60">ohne Wiederholung</p>
              <p className="text-xs text-white/30">nach 30 Tagen</p>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-center">
              <p className="text-3xl font-black text-violet-400">~85%</p>
              <p className="mt-1 text-xs font-semibold text-white/60">mit Synapze</p>
              <p className="text-xs text-white/30">nach 30 Tagen</p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 pb-2 pt-5 backdrop-blur-sm">
            <EbbinghausCurve />

            {/* Legend */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-5 pb-2 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded-full bg-rose-500" />
                <span>Ohne Wiederholung</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded-full bg-violet-500" />
                <span>Mit Synapze</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-violet-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <span>Wiederholung</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-white/25">Ebbinghaus (1885) · Roediger & Karpicke (2006)</p>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-lg py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/40">
            <Zap className="h-8 w-8 text-white" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Bereit loszulegen?</h2>
          <p className="mt-3 text-sm text-white/50">Alle Prinzipien sind eingebaut. Du lernst einfach.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-primary font-semibold hover:bg-white/90 shadow-xl shadow-white/10">
              <Link href="/create">
                Erstes Deck erstellen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
