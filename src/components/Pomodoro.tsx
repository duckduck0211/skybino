"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "skybino-focus-sessions";
const DURATION_OPTIONS = [15, 25, 45, 60, 90];

interface FocusSession {
  date: string;
  minutes: number;
}

// ─── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  return (
    <svg className="absolute inset-0" viewBox="0 0 200 200">
      <circle
        cx="100" cy="100" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1.5"
      />
      <circle
        cx="100" cy="100" r={r}
        fill="none"
        stroke="rgba(255, 230, 130, 0.55)"
        strokeWidth="1.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

// ─── Moon phase ────────────────────────────────────────────────────────────────
// Waxing moon: crescent (pct=0) → full moon (pct=1)
// Uses the standard two-arc path: right semicircle + terminator ellipse.
//
// terminatorRx = r * |1 − 2·phase|
//   sweep = 1  (clockwise, bulges right) for crescent phase
//   sweep = 0  (counter-clockwise, bulges left) for gibbous phase
//
// pct=0 → phase=0.12 → thin crescent on the right
// pct≈0.44 → phase≈0.51 → half moon
// pct=1 → phase=1.00 → full moon (terminatorRx=r, sweep=0 → left arc closes circle)

function MoonPhase({ pct }: { pct: number }) {
  // Map 0→1 to 0.10→1.00 so a visible crescent is always shown at session start
  const phase = 0.10 + pct * 0.90;

  const r = 36;
  const cx = 45, cy = 45;

  const top    = { x: cx, y: cy - r };
  const bottom = { x: cx, y: cy + r };

  // Standard two-arc moon-phase path:
  //   right semicircle (the always-lit edge) + terminator ellipse back to top
  const terminatorRx = r * Math.abs(1 - 2 * phase);
  const sweep = phase < 0.5 ? 1 : 0;

  const litPath =
    `M ${top.x} ${top.y} ` +
    `A ${r} ${r} 0 0 1 ${bottom.x} ${bottom.y} ` +
    `A ${terminatorRx} ${r} 0 0 ${sweep} ${top.x} ${top.y}`;

  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      <defs>
        <clipPath id="moonCircle">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* Moon disc — same dark as background so unlit side is invisible */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="rgba(9, 9, 29, 1)"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="0.8"
      />

      {/* Lit portion — clean flat white, tattoo style */}
      <g clipPath="url(#moonCircle)">
        <path d={litPath} fill="rgba(235, 232, 222, 0.92)" />
      </g>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PomodoroProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Pomodoro({ isOpen, onClose }: PomodoroProps) {
  const [duration, setDuration] = useState(25);
  const [phase, setPhase] = useState<"idle" | "running" | "paused">("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  // Warn before leaving while a session is running
  useEffect(() => {
    if (phase !== "running") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const pct = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr =
    `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const saveSession = useCallback((m: number) => {
    const s: FocusSession = { date: new Date().toISOString(), minutes: m };
    setSessions(prev => {
      const next = [s, ...prev].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft(s => {
      if (s <= 1) {
        clearInterval(intervalRef.current!);
        saveSession(Math.round(totalSeconds / 60));
        setPhase("idle");
        if (Notification.permission === "granted") {
          new Notification("🌕 Vollmond!", { body: "Focus-Session abgeschlossen." });
        }
        return 0;
      }
      return s - 1;
    });
  }, [totalSeconds, saveSession]);

  useEffect(() => {
    if (phase === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  function start() {
    const secs = duration * 60;
    setSecondsLeft(secs);
    setTotalSeconds(secs);
    setPhase("running");
    if (Notification.permission === "default") Notification.requestPermission();
  }

  function togglePause() {
    setPhase(p => p === "running" ? "paused" : "running");
  }

  function reset() {
    clearInterval(intervalRef.current!);
    setSecondsLeft(duration * 60);
    setTotalSeconds(duration * 60);
    setPhase("idle");
  }

  function pickDuration(m: number) {
    if (phase !== "idle") return;
    setDuration(m);
    setSecondsLeft(m * 60);
    setTotalSeconds(m * 60);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.date.startsWith(today));
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/[0.07]">

        {/* Dark space background */}
        <div className="bg-[#09091d] p-8 pb-6 text-white">

          {/* Starfield */}
          <svg
            className="pointer-events-none absolute inset-0"
            width="100%" height="100%"
            opacity="0.45"
          >
            {[
              [8,14],[24,7],[46,11],[68,5],[83,19],[94,37],[89,64],
              [76,81],[55,91],[31,77],[11,59],[3,41],[51,34],[36,54],
              [70,44],[18,28],[62,72],[43,22],[85,53],[27,88],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={`${x}%`} cy={`${y}%`}
                r={i % 5 === 0 ? "1.2" : i % 3 === 0 ? "0.85" : "0.55"}
                fill="white"
                opacity={i % 5 === 0 ? 0.55 : i % 3 === 0 ? 0.3 : 0.18}
              />
            ))}
          </svg>

          {/* Header */}
          <div className="relative mb-5 flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.2em] text-white/25 uppercase">
              Focus
            </span>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/[0.07] p-2 transition-colors hover:bg-white/[0.13]"
            >
              <X className="h-4 w-4 text-white/45" />
            </button>
          </div>

          {/* Timer ring + moon */}
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
            <ProgressRing pct={pct} />
            <div className="flex flex-col items-center gap-2">
              <MoonPhase pct={pct} />
              <span className="font-mono text-[2.5rem] font-light tracking-widest tabular-nums text-white/88 leading-none">
                {timeStr}
              </span>
            </div>
          </div>

          {/* Duration picker */}
          {phase === "idle" && (
            <div className="relative mt-6 flex items-center justify-center gap-1.5">
              {DURATION_OPTIONS.map(m => (
                <button
                  key={m}
                  onClick={() => pickDuration(m)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all",
                    duration === m
                      ? "bg-white/[0.17] text-white"
                      : "bg-white/[0.05] text-white/32 hover:bg-white/[0.10] hover:text-white/60"
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="relative mt-5 flex justify-center gap-2.5">
            {phase === "idle" ? (
              <button
                onClick={start}
                className="flex items-center gap-2 rounded-2xl bg-white/[0.11] px-10 py-3 text-sm font-semibold transition-all hover:bg-white/[0.18] active:scale-[0.97]"
              >
                <Play className="h-4 w-4 fill-white" />
                Starten
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.11] px-8 py-3 text-sm font-semibold transition-all hover:bg-white/[0.18] active:scale-[0.97]"
                >
                  {phase === "running"
                    ? <Pause className="h-4 w-4" />
                    : <Play className="h-4 w-4 fill-white" />}
                  {phase === "running" ? "Pause" : "Weiter"}
                </button>
                <button
                  onClick={reset}
                  className="rounded-2xl bg-white/[0.06] p-3 transition-all hover:bg-white/[0.11]"
                >
                  <RotateCcw className="h-4 w-4 text-white/38" />
                </button>
              </>
            )}
          </div>

          {phase === "running" && (
            <p className="relative mt-3 text-center text-[10px] text-white/20">
              Focus aktiv
            </p>
          )}
        </div>

        {/* Stats footer */}
        <div className="border-t border-white/[0.05] bg-[#07071a] px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/32">Heute fokussiert</span>
            <span className="font-semibold text-white/65">{todayMinutes} min</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/22">
            <Timer className="h-3 w-3" />
            <span>
              {todaySessions.length} Session{todaySessions.length !== 1 ? "s" : ""} abgeschlossen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
