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

const retentionBars = [
  { label: "Nochmal lesen", pct: 39, bg: "bg-rose-500/70", icon: "📖" },
  { label: "Highlighten", pct: 41, bg: "bg-orange-500/70", icon: "🖊️" },
  { label: "Zusammenfassung", pct: 55, bg: "bg-yellow-500/70", icon: "✏️" },
  { label: "Karteikarten", pct: 80, bg: "bg-emerald-500", icon: "🃏" },
  { label: "Active Recall + SRS", pct: 95, bg: "bg-violet-500", icon: "⚡" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
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
                <Link href="/">
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
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/8"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${f.bg} shadow-lg ${f.glow}`}>
                    <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                  </div>
                  <p className="font-bold text-white">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">{f.desc}</p>
                </div>
              );
            })}
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

        {/* ── Retention comparison ──────────────────────────────────────── */}
        <section className="mx-auto max-w-2xl py-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-white">Was wirklich hängen bleibt</h2>
            <p className="mt-3 text-sm text-white/40">Retention nach 1 Woche — verglichen.</p>
          </div>

          <div className="space-y-3">
            {retentionBars.map((r) => (
              <div key={r.label} className="flex items-center gap-4">
                <span className="w-5 shrink-0 text-center text-base">{r.icon}</span>
                <span className="w-40 shrink-0 text-sm text-white/70">{r.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-white/10" style={{ height: 20 }}>
                  <div
                    className={`flex h-full items-center justify-end rounded-full pr-2.5 ${r.bg} transition-all`}
                    style={{ width: `${r.pct}%` }}
                  >
                    <span className="text-[11px] font-bold text-white">{r.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-white/25">Roediger & Karpicke (2006) · Dunlosky et al. (2013)</p>
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
