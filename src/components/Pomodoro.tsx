"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, GraduationCap, Timer, Coffee, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PomodoroMode = "study" | "exam" | "break";

interface PomodoroSession {
  date: string;
  minutes: number;
  mode: PomodoroMode;
}

const STORAGE_KEY = "synapze-pomodoro-sessions";

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = {
  study: {
    label: "Lernmodus",
    icon: Zap,
    minutes: 25,
    break: 5,
    // Deep space — Genki Dama gathering energy from the universe
    color: "from-[#010a1a] via-[#051535] to-[#010a1a]",
    ring: "stroke-cyan-300",
  },
  exam: {
    label: "Prüfungsmodus",
    icon: GraduationCap,
    minutes: 50,
    break: 10,
    // Super Saiyan aura — golden fire
    color: "from-[#1a0700] via-[#2e1000] to-[#1a0700]",
    ring: "stroke-amber-300",
  },
} as const;

// ─── Circular progress ring ────────────────────────────────────────────────────

function CircleProgress({ pct, color }: { pct: number; color: string }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  return (
    <svg className="absolute inset-0" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
      <circle
        cx="100" cy="100" r={r} fill="none" strokeWidth="6"
        className={color}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

// ─── Genki Dama (Spirit Bomb) visualization ────────────────────────────────────

function GenkiDama({ pct, mode }: { pct: number; mode: "study" | "exam" | "break" }) {
  // Ball radius grows smoothly from 6px → 32px
  const r = Math.max(6, 6 + pct * 26);
  const glow = 4 + pct * 18;

  const phase = pct < 0.25 ? 0 : pct < 0.5 ? 1 : pct < 0.8 ? 2 : 3;
  const labels = ["Energie sammeln…", "Genkidama wächst…", "Volle Kraft!", "⚡ GENKIDAMA!"];

  // Color palette per mode
  const C =
    mode === "exam"
      ? { c0: "#fffde7", c1: "#ffc400", c2: "#e65100", gv: "255,196,0" }   // golden / SSJ
      : mode === "break"
      ? { c0: "#e8f5e9", c1: "#66bb6a", c2: "#1b5e20", gv: "102,187,106" }  // healing green
      : { c0: "#f0f8ff", c1: "#90caf9", c2: "#0d47a1", gv: "144,202,249" }; // spirit blue

  // SVG layout (90 × 92 viewBox)
  const W = 90, H = 92;
  const cx = W / 2;       // 45
  const cy = 26;          // ball Y center (fixed, ball grows downward + upward)

  // Goku base coordinates
  const gx = cx;          // 45  (horizontal center)
  const gy = 62;          // head center Y

  // Orbit radius for particles
  const orbitR = r + 9;
  const numParticles = Math.min(10, Math.floor(pct * 12));

  // Arms point from shoulders toward the ball
  const shoulderY = gy + 8;
  const armEndLx = cx - orbitR * 0.75;
  const armEndRx = cx + orbitR * 0.75;
  const armEndY = cy + orbitR * 0.6;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        overflow="visible"
        style={{ display: "block" }}
      >
        <defs>
          {/* Ball gradient */}
          <radialGradient id={`gkBall_${mode}`} cx="33%" cy="28%" r="68%">
            <stop offset="0%" stopColor={C.c0} stopOpacity="0.97" />
            <stop offset="45%" stopColor={C.c1} stopOpacity="0.90" />
            <stop offset="100%" stopColor={C.c2} stopOpacity="0.70" />
          </radialGradient>

          {/* Soft outer glow blur */}
          <filter id={`gkHalo_${mode}`} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glow} />
          </filter>

          {/* Sharp inner glow */}
          <filter id={`gkSharp_${mode}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glow * 0.35} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Glow halos ── */}
        {pct > 0.05 && (
          <circle cx={cx} cy={cy} r={r + glow * 2.8}
            fill={`rgba(${C.gv}, 0.06)`}
          />
        )}
        {pct > 0.12 && (
          <circle cx={cx} cy={cy} r={r + glow * 1.6}
            fill={`rgba(${C.gv}, 0.11)`}
          />
        )}
        {/* Diffuse halo rendered with blur filter */}
        <circle cx={cx} cy={cy} r={r + 5}
          fill={`rgba(${C.gv}, ${0.18 + pct * 0.22})`}
          filter={`url(#gkHalo_${mode})`}
          style={{ transition: "r 0.8s ease" }}
        />

        {/* ── Main Genki Dama ball ── */}
        <circle
          cx={cx} cy={cy} r={r}
          fill={`url(#gkBall_${mode})`}
          filter={`url(#gkSharp_${mode})`}
          style={{ transition: "r 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
        />

        {/* ── Specular highlight ── */}
        <ellipse
          cx={cx - r * 0.22} cy={cy - r * 0.26}
          rx={r * 0.24} ry={r * 0.16}
          fill="rgba(255,255,255,0.70)"
          style={{ transition: "all 0.8s ease" }}
        />

        {/* ── Orbiting energy particles ── */}
        {Array.from({ length: numParticles }).map((_, i) => {
          const startAngle = (i / numParticles) * 360;
          const px = cx + orbitR * Math.cos((startAngle * Math.PI) / 180);
          const py = cy + orbitR * Math.sin((startAngle * Math.PI) / 180);
          const pr = 1.4 + (i % 3) * 0.6;
          const dur = `${2.2 + (i % 5) * 0.55}s`;
          return (
            <circle key={i} cx={px} cy={py} r={pr}
              fill={C.c1} opacity="0.80"
            >
              <animateTransform
                attributeName="transform" type="rotate"
                from={`0 ${cx} ${cy}`}
                to={`360 ${cx} ${cy}`}
                dur={dur}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}

        {/* ── Energy spikes at high power ── */}
        {pct > 0.6 && Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * 360;
          const rad = (a * Math.PI) / 180;
          const spikeLen = 5 + pct * 12;
          return (
            <line key={i}
              x1={cx + r * Math.cos(rad)}       y1={cy + r * Math.sin(rad)}
              x2={cx + (r + spikeLen) * Math.cos(rad)} y2={cy + (r + spikeLen) * Math.sin(rad)}
              stroke={`rgba(${C.gv}, 0.65)`} strokeWidth="1.2" strokeLinecap="round"
            />
          );
        })}

        {/* ── Energy beam lines from Goku hands to ball ── */}
        {pct > 0.15 && (
          <>
            <line
              x1={cx - 5} y1={shoulderY}
              x2={cx - (r + 3) * 0.6} y2={cy + (r + 3) * 0.55}
              stroke={`rgba(${C.gv}, ${0.15 + pct * 0.35})`}
              strokeWidth={0.8 + pct * 1.2}
              strokeLinecap="round"
            />
            <line
              x1={cx + 5} y1={shoulderY}
              x2={cx + (r + 3) * 0.6} y2={cy + (r + 3) * 0.55}
              stroke={`rgba(${C.gv}, ${0.15 + pct * 0.35})`}
              strokeWidth={0.8 + pct * 1.2}
              strokeLinecap="round"
            />
          </>
        )}

        {/* ══ Goku silhouette ══ */}

        {/* Aura glow behind body (at higher power) */}
        {pct > 0.4 && (
          <ellipse cx={gx} cy={gy + 6} rx={15} ry={18}
            fill={`rgba(${C.gv}, ${0.06 + pct * 0.10})`}
          />
        )}

        {/* Spiky hair */}
        <path
          d="M40 58 L38 52 L41 56 L40 50 L43 55 L45 48 L47 55 L50 50 L51 56 L54 52 L52 58"
          fill="white" opacity="0.88"
        />
        {/* Head */}
        <circle cx={gx} cy={gy} r="5.5" fill="white" opacity="0.90" />

        {/* Body (gi top) */}
        <path d="M43 68 Q45 72 47 68 L46 80 Q45 82 44 80 Z" fill="white" opacity="0.80" />

        {/* Left arm — raised toward ball */}
        <path
          d={`M43 69 L${armEndLx} ${armEndY}`}
          stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.82"
        />
        {/* Right arm — raised toward ball */}
        <path
          d={`M47 69 L${armEndRx} ${armEndY}`}
          stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.82"
        />

        {/* Legs */}
        <path d="M44 80 L41 92" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.72" />
        <path d="M46 80 L49 92" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.72" />

        {/* Ground shadow */}
        <ellipse cx={gx} cy={H - 2} rx={10} ry={2}
          fill="rgba(255,255,255,0.12)"
        />
      </svg>

      <span className="mt-0.5 text-[11px] font-medium text-white/60 tracking-wide">
        {labels[phase]}
      </span>
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

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  // Focus lock: warn before leaving
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
  const pct = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
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
        clearInterval(intervalRef.current!);
        if (phase === "running") {
          saveSession(mode, Math.round(totalSeconds / 60));
          setPhase("break");
          const breakSec = PRESETS[mode].break * 60;
          setSecondsLeft(breakSec);
          setTotalSeconds(breakSec);
          setFocusLock(false);
          if (Notification.permission === "granted") {
            new Notification("⚡ Genkidama aufgeladen!", { body: "Session abgeschlossen — Pause verdient!" });
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
    clearInterval(intervalRef.current!);
    const secs = (m === "study" ? PRESETS.study.minutes : customMinutes) * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
    setPhase("idle");
    setFocusLock(false);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.date.startsWith(todayStr));
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);

  // Background gradient
  const bg = phase === "break"
    ? "from-[#001a2c] via-[#003044] to-[#001a2c]"   // break: ocean
    : preset.color;

  // Genki Dama mode for visuals
  const gkMode: "study" | "exam" | "break" =
    phase === "break" ? "break" : mode;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">

        {/* Gradient background */}
        <div className={`bg-gradient-to-br ${bg} p-8 text-white transition-all duration-700`}>

          {/* Stars (decorative) */}
          <svg className="pointer-events-none absolute inset-0 opacity-30" width="100%" height="100%">
            {[
              [12, 18], [55, 9], [78, 22], [90, 45], [8, 60],
              [35, 75], [70, 80], [85, 14], [22, 40], [60, 55],
            ].map(([x, y], i) => (
              <circle key={i} cx={`${x}%`} cy={`${y}%`} r="1" fill="white" opacity={(i % 3 === 0 ? 0.8 : 0.4)} />
            ))}
          </svg>

          {/* Header */}
          <div className="relative mb-5 flex items-center justify-between">
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
                        : "bg-white/10 text-white/60 hover:bg-white/15 disabled:opacity-40",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {PRESETS[m].label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Break label */}
          {phase === "break" && (
            <p className="relative mb-3 text-center text-sm font-semibold text-white/80">
              <Coffee className="mr-1 inline h-4 w-4" />Pause läuft…
            </p>
          )}

          {/* Timer ring with Genki Dama */}
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
            <CircleProgress
              pct={pct}
              color={phase === "break" ? "stroke-teal-300" : preset.ring}
            />
            <div className="relative flex flex-col items-center gap-1">
              <GenkiDama pct={pct} mode={gkMode} />
              <span className="font-mono text-4xl font-bold tracking-tight tabular-nums">
                {timeStr}
              </span>
            </div>
          </div>

          {/* Exam mode duration selector */}
          {mode === "exam" && phase === "idle" && (
            <div className="relative mt-4 flex items-center justify-center gap-2">
              <span className="text-xs text-white/60">Dauer:</span>
              {[30, 45, 60, 90, 120].map(m => (
                <button
                  key={m}
                  onClick={() => { setCustomMinutes(m); setSecondsLeft(m * 60); setTotalSeconds(m * 60); }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                    customMinutes === m ? "bg-white/30" : "bg-white/10 hover:bg-white/20",
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="relative mt-6 flex justify-center gap-3">
            {phase === "idle" ? (
              <button
                onClick={start}
                className="flex items-center gap-2 rounded-2xl bg-white/20 px-8 py-3 text-sm font-bold transition-all hover:bg-white/30 active:scale-95"
              >
                <Play className="h-4 w-4 fill-white" />Starten
              </button>
            ) : phase === "break" ? (
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-2xl bg-white/20 px-8 py-3 text-sm font-bold transition-all hover:bg-white/30"
              >
                <RotateCcw className="h-4 w-4" />Neue Runde
              </button>
            ) : (
              <>
                <button
                  onClick={pause}
                  className="flex items-center gap-2 rounded-2xl bg-white/20 px-6 py-3 text-sm font-bold transition-all hover:bg-white/30 active:scale-95"
                >
                  {phase === "running"
                    ? <Pause className="h-4 w-4" />
                    : <Play className="h-4 w-4 fill-white" />}
                  {phase === "running" ? "Pause" : "Weiter"}
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold transition-all hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Focus lock indicator */}
          {focusLock && (
            <p className="relative mt-3 text-center text-[11px] text-white/45">
              🔒 Focus-Modus aktiv
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
            <span>
              {todaySessions.length} Einheit{todaySessions.length !== 1 ? "en" : ""} abgeschlossen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
