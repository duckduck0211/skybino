"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, TreePine, GraduationCap, Timer, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PomodoroMode = "study" | "exam" | "break";

interface PomodoroSession {
  date: string;   // ISO
  minutes: number;
  mode: PomodoroMode;
}

const STORAGE_KEY = "synapze-pomodoro-sessions";

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = {
  study: { label: "Lernmodus",    icon: TreePine,       minutes: 25, break: 5,  color: "from-emerald-500 to-teal-600",    ring: "stroke-emerald-400" },
  exam:  { label: "Prüfungsmodus",icon: GraduationCap,  minutes: 50, break: 10, color: "from-violet-500 to-purple-600",   ring: "stroke-violet-400" },
} as const;

// ─── Circular Progress ─────────────────────────────────────────────────────────

function CircleProgress({ pct, color }: { pct: number; color: string }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return (
    <svg className="absolute inset-0" viewBox="0 0 200 200">
      {/* Track */}
      <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
      {/* Progress */}
      <circle
        cx="100" cy="100" r={r} fill="none" strokeWidth="6"
        className={color}
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

// ─── Tree visualization (grows with progress) ─────────────────────────────────

function GrowingTree({ pct }: { pct: number }) {
  const stage = pct < 0.25 ? 0 : pct < 0.5 ? 1 : pct < 0.8 ? 2 : 3;
  const trees = ["🌱", "🌿", "🌳", "🌲"];
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-5xl transition-all duration-1000" style={{ fontSize: `${2 + stage * 0.6}rem` }}>
        {trees[stage]}
      </span>
      <span className="text-xs text-white/50">{stage === 3 ? "Baum gewachsen! 🎉" : "Baum wächst…"}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PomodoroProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Pomodoro({ isOpen, onClose }: PomodoroProps) {
  const [mode, setMode] = useState<"study" | "exam">("study");
  const [phase, setPhase] = useState<"idle" | "running" | "paused" | "break">("idle");
  const [customMinutes, setCustomMinutes] = useState(50);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS.study.minutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS.study.minutes * 60);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [focusLock, setFocusLock] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load sessions
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  // Focus lock: warn before leaving page
  useEffect(() => {
    if (!focusLock) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Pomodoro läuft noch! Wirklich verlassen?";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [focusLock]);

  const preset = PRESETS[mode];
  const pct = 1 - secondsLeft / totalSeconds;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const saveSession = useCallback((m: "study" | "exam", totalMins: number) => {
    const session: PomodoroSession = { date: new Date().toISOString(), minutes: totalMins, mode: m };
    setSessions(prev => {
      const next = [session, ...prev].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft(s => {
      if (s <= 1) {
        // Timer done
        clearInterval(intervalRef.current!);
        if (phase === "running") {
          saveSession(mode, Math.round(totalSeconds / 60));
          setPhase("break");
          const breakSec = (mode === "study" ? PRESETS.study.break : PRESETS.exam.break) * 60;
          setSecondsLeft(breakSec);
          setTotalSeconds(breakSec);
          setFocusLock(false);
          // Browser notification
          if (Notification.permission === "granted") {
            new Notification("🌳 Pomodoro fertig!", { body: "Zeit für eine Pause!" });
          }
        } else if (phase === "break") {
          setPhase("idle");
        }
        return 0;
      }
      return s - 1;
    });
  }, [phase, mode, totalSeconds, saveSession]);

  useEffect(() => {
    if (phase === "running" || phase === "break") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  function start() {
    const secs = (mode === "study" ? preset.minutes : customMinutes) * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
    setPhase("running");
    setFocusLock(true);
    if (Notification.permission === "default") Notification.requestPermission();
  }

  function pause() { setPhase(p => p === "running" ? "paused" : "running"); }

  function reset() {
    clearInterval(intervalRef.current!);
    const secs = (mode === "study" ? preset.minutes : customMinutes) * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
    setPhase("idle");
    setFocusLock(false);
  }

  function switchMode(m: "study" | "exam") {
    setMode(m);
    reset();
    const secs = (m === "study" ? PRESETS.study.minutes : customMinutes) * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  }

  // Today's completed sessions
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.date.startsWith(todayStr));
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">

        {/* Gradient Background */}
        <div className={`bg-gradient-to-br ${phase === "break" ? "from-sky-500 to-blue-600" : preset.color} p-8 text-white`}>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              {(["study", "exam"] as const).map(m => {
                const Icon = PRESETS[m].icon;
                return (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    disabled={phase === "running" || phase === "break"}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                      mode === m && phase !== "break"
                        ? "bg-white/25 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/15 disabled:opacity-40"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {PRESETS[m].label}
                  </button>
                );
              })}
            </div>
            <button onClick={onClose} className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Phase label */}
          {phase === "break" && (
            <p className="mb-3 text-center text-sm font-semibold text-white/80">
              <Coffee className="inline h-4 w-4 mr-1" />Pause läuft…
            </p>
          )}

          {/* Timer Ring */}
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
            <CircleProgress pct={pct} color={phase === "break" ? "stroke-sky-300" : preset.ring} />
            <div className="flex flex-col items-center gap-2">
              <GrowingTree pct={pct} />
              <span className="text-4xl font-mono font-bold tracking-tight">{timeStr}</span>
            </div>
          </div>

          {/* Exam mode duration selector */}
          {mode === "exam" && phase === "idle" && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-xs text-white/70">Dauer:</span>
              {[30, 45, 60, 90, 120].map(m => (
                <button
                  key={m}
                  onClick={() => { setCustomMinutes(m); setSecondsLeft(m * 60); setTotalSeconds(m * 60); }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                    customMinutes === m ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex justify-center gap-3">
            {phase === "idle" ? (
              <button
                onClick={start}
                className="flex items-center gap-2 rounded-2xl bg-white/20 px-8 py-3 text-sm font-bold hover:bg-white/30 transition-all"
              >
                <Play className="h-4 w-4 fill-white" />
                Starten
              </button>
            ) : phase === "break" ? (
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-2xl bg-white/20 px-8 py-3 text-sm font-bold hover:bg-white/30 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                Neue Runde
              </button>
            ) : (
              <>
                <button
                  onClick={pause}
                  className="flex items-center gap-2 rounded-2xl bg-white/20 px-6 py-3 text-sm font-bold hover:bg-white/30 transition-all"
                >
                  {phase === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                  {phase === "running" ? "Pause" : "Weiter"}
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Focus Lock indicator */}
          {focusLock && (
            <p className="mt-3 text-center text-[11px] text-white/50">
              🔒 Focus-Modus aktiv — Browser warnt beim Verlassen
            </p>
          )}
        </div>

        {/* Today's stats */}
        <div className="border-t bg-popover px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Heute gelernt</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground">{todayMinutes} min</span>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(todaySessions.length, 8) }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-full bg-primary" />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-1.5 text-[11px] text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span>{todaySessions.length} Einheit{todaySessions.length !== 1 ? "en" : ""} abgeschlossen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
