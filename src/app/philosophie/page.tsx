"use client";

import Link from "next/link";
import {
  Shield,
  Globe,
  Lock,
  Heart,
  Zap,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/aurora-background";

// ─── Data ─────────────────────────────────────────────────────────────────────

const verfassungChapters = [
  {
    nr: "§ 1",
    title: "Digitale Souveränität",
    text: "Jeder Nutzer hat das Recht auf digitale Selbstbestimmung. Daten gehören dem Menschen — nicht dem Konzern.",
  },
  {
    nr: "§ 2",
    title: "Datenschutz by Design",
    text: "Datenschutz ist kein Feature — er ist die Grundlage. Synapze und Thaura.ai wurden von Grund auf DSGVO-konform gebaut.",
  },
  {
    nr: "§ 3",
    title: "Kein Tracking. Keine Werbung.",
    text: "Was du lernst, bleibt deins. Keine Verhaltensprofile, keine Werbealgorithmen, keine versteckten Datenverkäufe.",
  },
  {
    nr: "§ 4",
    title: "Transparenz der KI",
    text: "Du hast das Recht zu wissen, wie die KI arbeitet. Keine Black Boxes. Keine manipulativen Lernschleifen.",
  },
  {
    nr: "§ 5",
    title: "Europäische Werte",
    text: "Wir glauben an ein digitales Europa, das Grundrechte schützt — nicht unterminiert. Unsere Server stehen in der EU.",
  },
  {
    nr: "§ 6",
    title: "Lernen ohne Sucht",
    text: "Echte Bildung braucht keine Gamification-Fallen. Synapze optimiert für Wissen — nicht für Sitzungszeit.",
  },
  {
    nr: "§ 7",
    title: "Offene Wissenschaft",
    text: "Wir bauen auf verifizierten Lernwissenschaften. Ebbinghaus, Feynman, Deci & Ryan — keine Pseudomethoden.",
  },
  {
    nr: "§ 8",
    title: "Gegen digitale Monopole",
    text: "Bildung gehört nicht einem US-Konzern. Wir fördern ein Ökosystem europäischer Bildungstechnologie.",
  },
];

const comparisonRows = [
  {
    feature: "Serverstandort",
    synapze: "EU (Deutschland)",
    quizlet: "USA",
    anki: "Offen (dezentral)",
  },
  {
    feature: "Datenschutz",
    synapze: "DSGVO-konform",
    quizlet: "US-Recht / CCPA",
    anki: "Open Source",
  },
  {
    feature: "KI-Anbieter",
    synapze: "Thaura.ai (EU)",
    quizlet: "OpenAI / US Big Tech",
    anki: "Kein nativer KI",
  },
  {
    feature: "Geschäftsmodell",
    synapze: "Premium (kein Tracking)",
    quizlet: "Werbung + Daten",
    anki: "Freemium / Open Source",
  },
  {
    feature: "Lernmethoden",
    synapze: "SRS + Active Recall + Feynman",
    quizlet: "Flashcards + Games",
    anki: "SRS",
  },
  {
    feature: "Gamification",
    synapze: "Bewusst minimiert",
    quizlet: "Stark (Match, Gravity…)",
    anki: "Keine",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhilosophiePage() {
  return (
    <div className="relative -mx-6 -mt-6 bg-[#020008]">

      {/* Aurora Background */}
      <div
        className="pointer-events-none w-full"
        style={{ position: "sticky", top: 0, height: "100vh", marginBottom: "-100vh", zIndex: 0 }}
      >
        <AuroraBackground className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020008]/60 to-[#020008]/95" />
      </div>

      <div className="relative z-10 px-6 pb-32">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="flex min-h-[70vh] flex-col justify-center">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-violet-300" />
              <span className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
                Unsere Philosophie
              </span>
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
              Lernen für Menschen.
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-primary bg-clip-text text-transparent">
                Nicht für Konzerne.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/60">
              Synapze ist ein deutsches Produkt mit einer klaren Haltung: Bildungsdaten gehören dir,
              die KI kommt aus Europa, und Lernen braucht keine Manipulationsschleifen.
            </p>
          </div>
        </section>

        {/* ── Warum nicht Quizlet & Co.? ──────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-16">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-400">
              Das Problem
            </span>
            <h2 className="text-3xl font-extrabold text-white">Quizlet & Anki sind gut. Aber.</h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-white/50 leading-relaxed">
              Gute Lerntools gibt es — aber die populärsten kommen aus dem Silicon Valley,
              laufen auf US-Servern und finanzieren sich mit deinen Daten oder mit Gamification,
              die Sitzungszeit über echten Lernerfolg stellt.
            </p>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <p className="text-sm leading-relaxed text-white/70">
              <strong className="text-white">Quizlet</strong> teilt Nutzerdaten mit Werbepartnern,
              läuft unter US-amerikanischem Datenschutzrecht und setzt auf
              Gamification-Mechaniken (Gravity, Match), die Engagement über echtes Lernen stellen.{" "}
              <strong className="text-white">Anki</strong> ist Open Source und mächtig —
              aber ohne europäische KI-Integration und mit einer Lernkurve, die viele abschreckt.
            </p>
          </div>
        </section>

        {/* ── Vergleichstabelle ────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-white">Der Unterschied im Überblick</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            {/* Header */}
            <div className="grid grid-cols-4 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/30">Feature</div>
              <div className="text-center text-xs font-bold text-violet-300 uppercase tracking-wider">Synapze</div>
              <div className="text-center text-xs font-semibold uppercase tracking-wider text-white/30">Quizlet</div>
              <div className="text-center text-xs font-semibold uppercase tracking-wider text-white/30">Anki</div>
            </div>

            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 px-4 py-3.5 text-sm ${
                  i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                } border-b border-white/5 last:border-0`}
              >
                <div className="text-white/50 text-xs font-medium">{row.feature}</div>
                <div className="text-center text-xs font-semibold text-violet-300">{row.synapze}</div>
                <div className="text-center text-xs text-white/40">{row.quizlet}</div>
                <div className="text-center text-xs text-white/40">{row.anki}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Thaura.ai ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-16">
          <div className="grid gap-8 sm:grid-cols-2 items-center">
            {/* Text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Globe className="h-3.5 w-3.5" />
                KI-Partner
              </div>
              <h2 className="text-3xl font-extrabold text-white">Thaura.ai — KI aus Europa.</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Synapze nutzt <strong className="text-white">Thaura.ai</strong> — eine europäische
                KI-Plattform, die nach EU-Recht operiert, DSGVO-konform ist und keine Nutzerdaten
                an US-amerikanische Hyperscaler weitergibt.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Während OpenAI, Google AI und andere Big-Tech-Modelle unter US-Jurisdiction laufen
                und durch den CLOUD Act potentiell zugänglich für US-Behörden sind,
                bleibt mit Thaura.ai dein Lernfortschritt in Europa.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                  <Lock className="h-3.5 w-3.5" />
                  DSGVO-konform
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300">
                  <Globe className="h-3.5 w-3.5" />
                  Server in der EU
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300">
                  <Shield className="h-3.5 w-3.5" />
                  Kein US CLOUD Act
                </div>
              </div>
            </div>

            {/* Visual card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Thaura.ai</p>
                  <p className="text-xs text-white/40">Europäische KI-Plattform</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Keine Datenweitergabe an US-Konzerne",
                  "Kein Training auf deinen Lernkarten",
                  "Vollständige Löschung auf Anfrage",
                  "Audit-Log deiner KI-Anfragen",
                  "Open-Book-Datenschutzerklärung",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-sm text-white/70">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Verfassung / Manifest ────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-16">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
              Verfassung
            </span>
            <h2 className="text-3xl font-extrabold text-white">Die Grundsätze von Synapze</h2>
            <p className="mt-3 text-sm text-white/40">
              Inspiriert von der Verfassung von Thaura.ai. Verbindlich — nicht dekorativ.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {verfassungChapters.map((ch) => (
              <div
                key={ch.nr}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-xs font-bold tabular-nums text-violet-400/60">{ch.nr}</span>
                  <h3 className="font-bold text-white text-sm">{ch.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-white/50">{ch.text}</p>
                {/* Subtle glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/0 to-violet-500/0 transition-all group-hover:from-violet-500/5 group-hover:to-transparent" />
              </div>
            ))}
          </div>
        </section>

        {/* ── Oliver Burkeman & Zeit ───────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-12">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Philosophische Grundlage
              </span>
            </div>
            <blockquote className="mt-4 text-xl font-light italic leading-relaxed text-white">
              „Du hast ungefähr 4.000 Wochen. Was machst du damit?"
            </blockquote>
            <p className="mt-3 text-sm text-white/40">— Oliver Burkeman, <em>Vier Tausend Wochen</em></p>
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              Oliver Burkemans Buch hat uns daran erinnert, dass Zeit endlich ist — und dass
              wir sie nicht mit sinnlosem Wiederholen oder Gamification-Fallen verschwenden sollten.
              Synapze respektiert deine Zeit: kein endloses Scrollen, keine Push-Notification-Sucht,
              keine Streak-Bestrafung.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Lern, was du lernen willst. Dann leg das Gerät weg. Das ist der Plan.
            </p>
          </div>
        </section>

        {/* ── Haltung ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl py-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-white">Unsere Haltung in drei Sätzen</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Heart,
                color: "text-rose-400",
                bg: "bg-rose-500/10 border-rose-500/20",
                title: "Made in Deutschland",
                text: "Wir glauben an den Wert europäischer Bildungstechnologie. Lieber deutsche Innovation fördern als US-Konzerne stärken.",
              },
              {
                icon: Lock,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
                title: "Daten gehören dir",
                text: "Keine Nutzerprofile für Werbung. Kein Training auf deinen Inhalten. Vollständige Datenlöschung auf Anfrage.",
              },
              {
                icon: Zap,
                color: "text-violet-400",
                bg: "bg-violet-500/10 border-violet-500/20",
                title: "Lernen, nicht Scrollen",
                text: "Synapze ist ein Werkzeug, kein Social-Media-Feed. Wir designen für Wissen — nicht für Bildschirmzeit.",
              },
            ].map(({ icon: Icon, color, bg, title, text }) => (
              <div key={title} className={`rounded-2xl border ${bg} p-5`}>
                <Icon className={`mb-3 h-6 w-6 ${color}`} />
                <p className="mb-1.5 font-bold text-white text-sm">{title}</p>
                <p className="text-xs leading-relaxed text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-lg py-16 text-center">
          <h2 className="text-2xl font-extrabold text-white">Du teilst diese Werte?</h2>
          <p className="mt-3 text-sm text-white/50">
            Dann bist du bei Synapze richtig. Lern mit einem Tool, das auf deiner Seite steht.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-primary font-semibold hover:bg-white/90 shadow-xl shadow-white/10">
              <Link href="/create">
                <BookOpen className="mr-2 h-4 w-4" />
                Jetzt Deck erstellen
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/dashboard">
                Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/25">
            <ExternalLink className="h-3 w-3" />
            KI-Dienste bereitgestellt durch Thaura.ai — EU-Server · DSGVO-konform
          </p>
        </section>

      </div>
    </div>
  );
}
