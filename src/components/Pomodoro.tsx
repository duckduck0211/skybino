"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "skybino-focus-sessions";
const DURATION_OPTIONS = [15, 25, 45, 60, 90];
const BREAK_OPTIONS = [5, 10, 15, 30];

interface FocusSession {
  date: string;
  minutes: number;
}

// ─── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, isBreak }: { pct: number; isBreak: boolean }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  return (
    <svg className="absolute inset-0" viewBox="0 0 200 200">
      <circle
        cx="100" cy="100" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="1.5"
      />
      <circle
        cx="100" cy="100" r={r}
        fill="none"
        stroke={isBreak ? "rgba(160, 210, 255, 0.28)" : "rgba(255, 230, 130, 0.38)"}
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

function MoonPhase({ pct }: { pct: number }) {
  const phase = 0.10 + pct * 0.90;
  const r = 36;
  const cx = 45, cy = 45;
  const top    = { x: cx, y: cy - r };
  const bottom = { x: cx, y: cy + r };
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
      <circle
        cx={cx} cy={cy} r={r}
        fill="rgba(9, 9, 29, 1)"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="0.8"
      />
      <g clipPath="url(#moonCircle)">
        <path d={litPath} fill="rgba(235, 232, 222, 0.85)" />
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
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [duration, setDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [phase, setPhase] = useState<"idle" | "running" | "paused">("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs so tick can always read current values without stale closures
  const modeRef = useRef(mode);
  const breakDurationRef = useRef(breakDuration);
  const durationRef = useRef(duration);
  const totalSecondsRef = useRef(totalSeconds);
  modeRef.current = mode;
  breakDurationRef.current = breakDuration;
  durationRef.current = duration;
  totalSecondsRef.current = totalSeconds;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Sync timer display whenever returning to idle
  useEffect(() => {
    if (phase !== "idle") return;
    if (mode === "focus") {
      setSecondsLeft(duration * 60);
      setTotalSeconds(duration * 60);
    } else {
      setSecondsLeft(breakDuration * 60);
      setTotalSeconds(breakDuration * 60);
    }
  }, [phase, mode, duration, breakDuration]);

  const pct = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

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
        if (modeRef.current === "focus") {
          saveSession(Math.round(totalSecondsRef.current / 60));
          setMode("break");
          if (Notification.permission === "granted") {
            new Notification("🌕 Vollmond!", { body: "Focus-Session abgeschlossen. Zeit für eine Pause!" });
          }
        } else {
          setMode("focus");
          if (Notification.permission === "granted") {
            new Notification("⏰ Pause vorbei!", { body: "Bereit für die nächste Session?" });
          }
        }
        setPhase("idle");
        return 0;
      }
      return s - 1;
    });
  }, [saveSession]);

  useEffect(() => {
    if (phase === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  function start() {
    setPhase("running");
    if (Notification.permission === "default") Notification.requestPermission();
  }

  function togglePause() {
    setPhase(p => p === "running" ? "paused" : "running");
  }

  function reset() {
    clearInterval(intervalRef.current!);
    setPhase("idle");
  }

  function skipBreak() {
    clearInterval(intervalRef.current!);
    setMode("focus");
    setPhase("idle");
  }

  function pickDuration(m: number) {
    if (phase !== "idle") return;
    setDuration(m);
  }

  function pickBreakDuration(m: number) {
    if (phase !== "idle") return;
    setBreakDuration(m);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.date.startsWith(today));
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);
  const isBreak = mode === "break";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/[0.04]">

        {/* Dark space background */}
        <div className="bg-[#09091d] p-8 pb-6 text-white">

          {/* Starfield */}
          <svg className="pointer-events-none absolute inset-0" width="100%" height="100%" opacity="0.25">
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
                opacity={i % 5 === 0 ? 0.45 : i % 3 === 0 ? 0.25 : 0.15}
              />
            ))}
          </svg>

          {/* Header */}
          <div className="relative mb-5 flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-[0.2em] text-white/20 uppercase">
              {isBreak ? "Pause" : "Focus"}
            </span>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/[0.05] p-2 transition-colors hover:bg-white/[0.10]"
            >
              <X className="h-4 w-4 text-white/35" />
            </button>
          </div>

          {/* Timer ring + moon */}
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
            <ProgressRing pct={pct} isBreak={isBreak} />
            <div className="flex flex-col items-center gap-2">
              <MoonPhase pct={isBreak ? 1 - pct : pct} />
              <span className="font-mono text-[2.5rem] font-light tracking-widest tabular-nums text-white/70 leading-none">
                {timeStr}
              </span>
            </div>
          </div>

          {/* Pickers (idle only) */}
          {phase === "idle" && (
            <div className="relative mt-6 space-y-3">

              {/* Focus duration row */}
              {!isBreak && (
                <div className="flex items-center justify-center gap-1.5">
                  {DURATION_OPTIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => pickDuration(m)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all",
                        duration === m
                          ? "bg-white/[0.12] text-white/80"
                          : "bg-white/[0.04] text-white/22 hover:bg-white/[0.08] hover:text-white/50"
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              )}

              {/* Break duration row */}
              <div className="flex items-center justify-center gap-1">
                <span className="mr-1 text-[10px] tracking-wide text-white/16">
                  {isBreak ? "" : "Pause"}
                </span>
                {BREAK_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => pickBreakDuration(m)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all",
                      breakDuration === m
                        ? isBreak
                          ? "bg-white/[0.12] text-white/75"
                          : "bg-white/[0.08] text-white/50"
                        : "text-white/18 hover:bg-white/[0.05] hover:text-white/38"
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="relative mt-5 flex justify-center gap-2">
            {phase === "idle" ? (
              <>
                <button
                  onClick={start}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.09] px-10 py-3 text-sm font-medium text-white/75 transition-all hover:bg-white/[0.14] active:scale-[0.97]"
                >
                  <Play className="h-4 w-4 fill-white/60" />
                  {isBreak ? "Pause starten" : "Starten"}
                </button>
                {isBreak && (
                  <button
                    onClick={skipBreak}
                    className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-white/28 transition-all hover:bg-white/[0.08] hover:text-white/48"
                  >
                    Überspringen
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.09] px-8 py-3 text-sm font-medium text-white/75 transition-all hover:bg-white/[0.14] active:scale-[0.97]"
                >
                  {phase === "running"
                    ? <Pause className="h-4 w-4 text-white/60" />
                    : <Play className="h-4 w-4 fill-white/60" />}
                  {phase === "running" ? "Pause" : "Weiter"}
                </button>
                <button
                  onClick={reset}
                  className="rounded-2xl bg-white/[0.04] p-3 transition-all hover:bg-white/[0.09]"
                >
                  <RotateCcw className="h-4 w-4 text-white/28" />
                </button>
              </>
            )}
          </div>

          {phase === "running" && (
            <p className="relative mt-3 text-center text-[10px] text-white/15">
              {isBreak ? "Pause läuft" : "Focus aktiv"}
            </p>
          )}
        </div>

        {/* Stats footer */}
        <div className="border-t border-white/[0.04] bg-[#07071a] px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/25">Heute fokussiert</span>
            <span className="font-medium text-white/50">{todayMinutes} min</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/18">
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
