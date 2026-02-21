"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Upload, Brain, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "synapze-onboarded";

// ─── Forgetting Curve Visual ──────────────────────────────────────────────────
const retentionData = [
  { label: "Jetzt", pct: 100 },
  { label: "20 Min", pct: 58 },
  { label: "1 Std", pct: 44 },
  { label: "1 Tag", pct: 28 },
  { label: "1 Woche", pct: 12 },
  { label: "1 Monat", pct: 5 },
];

function ForgettingCurve() {
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-28">
        {retentionData.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
              {d.pct}%
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-700"
              style={{
                height: `${d.pct}%`,
                background:
                  i === 0
                    ? "var(--color-primary)"
                    : `hsl(var(--primary) / ${Math.max(0.15, d.pct / 100)})`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5">
        {retentionData.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground leading-none">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step data ────────────────────────────────────────────────────────────────

const myths = [
  {
    icon: "🖊️",
    title: "Ich markiere meine Texte",
    verdict: "Niedrigste Lernwirkung aller getesteten Methoden",
    source: "Dunlosky et al., 2013",
  },
  {
    icon: "📝",
    title: "Ich schreibe Zusammenfassungen",
    verdict: "Passives Wiederholen – Gehirn speichert kaum",
    source: "Roediger & Butler, 2011",
  },
  {
    icon: "😴",
    title: "Ich pauke kurz vor der Prüfung",
    verdict: "Massed practice wirkt 3× schlechter",
    source: "Cepeda et al., 2006",
  },
];

const features = [
  {
    icon: Upload,
    color: "bg-violet-500",
    title: "Inhalt hochladen",
    desc: "PDF, Foto deiner Buchseite, Mitschrift — Synapze versteht alles.",
  },
  {
    icon: Brain,
    color: "bg-blue-500",
    title: "KI generiert Karten",
    desc: "Aus deinem Material entstehen präzise Karteikarten automatisch.",
  },
  {
    icon: Layers,
    color: "bg-emerald-500",
    title: "Du interagierst, nicht liest",
    desc: "Active Recall, Quiz, mehrere Erklärungsebenen — echtes Lernen.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);

    // Allow external trigger (e.g. from Entdecken page)
    const handler = () => {
      setStep(0);
      setLeaving(false);
      setVisible(true);
    };
    window.addEventListener("synapze:show-onboarding", handler);
    return () => window.removeEventListener("synapze:show-onboarding", handler);
  }, []);

  function finish() {
    setLeaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
    }, 400);
  }

  function next() {
    if (step < 2) setStep((s) => s + 1);
    else finish();
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-400 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Skip button */}
      <button
        onClick={finish}
        className="absolute right-5 top-5 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
        Überspringen
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "w-6 bg-primary"
                : i < step
                ? "w-2 bg-primary/50"
                : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="w-full max-w-lg px-6">

        {/* ── Step 0: Der Hook ── */}
        {step === 0 && (
          <div className="space-y-8 text-center">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Bevor du anfängst
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Du lernst wahrscheinlich
                <br />
                <span className="text-primary">falsch.</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Das ist kein Angriff — das ist Forschung.
                <br />
                Erkennst du dich in einem davon wieder?
              </p>
            </div>

            <div className="space-y-3 text-left">
              {myths.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm"
                >
                  <span className="text-2xl mt-0.5">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{m.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{m.verdict}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/60 italic">{m.source}</p>
                  </div>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-bold mt-0.5">
                    ✗
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={next} size="lg" className="w-full gap-2">
              Warum ist das so? <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Step 1: Die Wissenschaft ── */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-3 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Die Wissenschaft
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Dein Gehirn vergisst
                <br />
                <span className="text-primary">fast alles.</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Ohne aktive Wiederholung gehen{" "}
                <span className="font-semibold text-foreground">70% des Gelernten</span> binnen
                24 Stunden verloren.
              </p>
            </div>

            {/* Forgetting curve */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Vergessenskurve</p>
                <p className="text-xs text-muted-foreground">Ebbinghaus, 1885</p>
              </div>
              <ForgettingCurve />
              <p className="mt-4 text-center text-xs text-muted-foreground italic">
                Ohne Wiederholung nach einem Monat: <span className="font-bold text-destructive">nur 5% behalten</span>
              </p>
            </div>

            {/* Solution preview */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-primary">Die Lösung existiert seit 1972</p>
              <div className="space-y-1.5 text-sm text-foreground/80">
                <p>✓ <span className="font-medium">Active Recall</span> — Karten aktiv flippen statt passiv lesen</p>
                <p>✓ <span className="font-medium">Spaced Repetition</span> — Wiederholung zum optimalen Zeitpunkt</p>
                <p>✓ Bis zu <span className="font-medium text-primary">400% bessere</span> Langzeitbehaltensleistung</p>
              </div>
            </div>

            <Button onClick={next} size="lg" className="w-full gap-2">
              Wie macht Synapze das? <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Die Lösung ── */}
        {step === 2 && (
          <div className="space-y-8 text-center">
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
                <span className="text-2xl">⚡</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Dein Inhalt.
                <br />
                <span className="text-primary">Intelligente Karten.</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Lade hoch, was du lernen musst — Synapze macht den Rest.
              </p>
            </div>

            <div className="space-y-3 text-left">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${f.color} text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{f.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={finish} size="lg" className="w-full gap-2 shadow-lg shadow-primary/20">
              Lernreise starten <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground">
              Kostenlos · Kein Account nötig · Jederzeit löschbar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
