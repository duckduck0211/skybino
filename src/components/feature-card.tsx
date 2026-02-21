"use client";

import { useState, useRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// ─── Mini visuals ──────────────────────────────────────────────────────────────

function MiniEbbinghaus() {
  return (
    <div className="mt-3">
      <svg viewBox="0 0 210 75" className="w-full" aria-label="Vergessenskurve">
        {/* Grid lines */}
        {[25, 50, 75].map((pct) => {
          const y = 60 - (pct / 100) * 50;
          return (
            <line key={pct} x1="16" y1={y} x2="198" y2={y}
              stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          );
        })}
        {/* Baseline */}
        <line x1="16" y1="60" x2="198" y2="60"
          stroke="white" strokeOpacity="0.12" strokeWidth="1" />
        {/* Review guide lines */}
        {[80, 108, 135, 162].map((x) => (
          <line key={x} x1={x} y1="8" x2={x} y2="60"
            stroke="#a78bfa" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2,2" />
        ))}
        {/* Red decay curve */}
        <path
          d="M 16,8 C 35,18 55,28 75,34 C 100,41 130,45 198,50"
          fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Violet Synapze curve */}
        <path
          d="M 16,8 C 40,14 65,22 78,27 L 82,12 C 97,16 108,19 107,21 L 110,10 C 128,13 140,16 135,18 L 138,8 C 162,11 182,14 198,16"
          fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"
        />
        {/* Review dots */}
        {[82, 110, 138].map((x) => (
          <g key={x}>
            <circle cx={x} cy={x === 82 ? 12 : x === 110 ? 10 : 8} r="3.5" fill="#8b5cf6" />
            <circle cx={x} cy={x === 82 ? 12 : x === 110 ? 10 : 8} r="1.5" fill="white" fillOpacity="0.9" />
          </g>
        ))}
        {/* End labels */}
        <text x="200" y="54" fontSize="7" fontWeight="bold" fill="#f43f5e">21%</text>
        <text x="200" y="20" fontSize="7" fontWeight="bold" fill="#a78bfa">85%</text>
      </svg>
      <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-rose-500" />ohne Wiederholen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full bg-violet-500" />mit Synapze
        </span>
      </div>
    </div>
  );
}

function FeynmanLevels() {
  const levels = [
    { n: "1", label: "Grundschule", pct: 33, color: "bg-emerald-500" },
    { n: "2", label: "Gymnasium", pct: 66, color: "bg-emerald-400" },
    { n: "3", label: "Experte", pct: 100, color: "bg-emerald-300" },
  ];
  return (
    <div className="mt-3 space-y-1.5">
      {levels.map(({ n, label, pct, color }) => (
        <div key={n} className="flex items-center gap-2">
          <span className="w-5 text-[10px] font-bold text-white/50">L{n}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10">
            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="w-20 text-right text-[10px] text-white/40">{label}</span>
        </div>
      ))}
    </div>
  );
}

function PomodoroVisual() {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      {[
        { dur: "25m", label: "Fokus", color: "border-rose-500 text-rose-400" },
        { dur: "5m", label: "Pause", color: "border-white/20 text-white/40" },
        { dur: "25m", label: "Fokus", color: "border-rose-500 text-rose-400" },
        { dur: "5m", label: "Pause", color: "border-white/20 text-white/40" },
        { dur: "30m", label: "Lange Pause", color: "border-amber-500/60 text-amber-400" },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${item.color}`}>
            <span className="text-[8px] font-bold">{item.dur}</span>
          </div>
          <span className="text-[8px] text-white/30 text-center w-9 leading-tight">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function InterleavedVisual() {
  // Blocked vs interleaved pattern
  const blocked = ["A","A","A","B","B","B","C","C","C"];
  const mixed   = ["A","C","B","A","C","B","A","B","C"];
  const colorMap: Record<string, string> = {
    A: "bg-violet-500", B: "bg-blue-500", C: "bg-teal-500",
  };
  return (
    <div className="mt-3 space-y-2">
      <div>
        <p className="mb-1 text-[10px] font-semibold text-white/40">Geblockt (schlechter)</p>
        <div className="flex gap-0.5">
          {blocked.map((c, i) => (
            <div key={i} className={`h-4 flex-1 rounded-sm ${colorMap[c]} opacity-50`} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold text-teal-400">Gemischt — Synapze ✓</p>
        <div className="flex gap-0.5">
          {mixed.map((c, i) => (
            <div key={i} className={`h-4 flex-1 rounded-sm ${colorMap[c]}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tooltip content types ─────────────────────────────────────────────────────

interface StatBadge {
  value: string;
  label: string;
  color: string; // tailwind classes for bg + text
}

interface TooltipData {
  text: string;
  stat?: StatBadge;
  visual?: ReactNode;
}

// ─── Feature card ──────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: LucideIcon;
  bg: string;
  glow: string;
  title: string;
  desc: string;
  tooltip: TooltipData;
}

export function FeatureCard({ icon: Icon, bg, glow, title, desc, tooltip }: FeatureCardProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), 900);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <div
      className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/8"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${bg} shadow-lg ${glow}`}>
        <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
      </div>
      <p className="font-bold text-white">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-white/50">{desc}</p>

      {/* ── Tooltip ── */}
      {visible && (
        <div
          className="
            pointer-events-none
            absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2
            z-50 w-72
            rounded-2xl border border-white/10
            bg-[#0d0820]/96 p-4
            shadow-2xl shadow-black/60
            backdrop-blur-xl
          "
          style={{ animation: "tooltipIn 0.18s ease-out forwards" }}
        >
          {/* Arrow */}
          <div
            className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border-b border-r border-white/10 bg-[#0d0820]"
          />

          <p className="text-xs leading-relaxed text-white/70">{tooltip.text}</p>

          {tooltip.stat && (
            <div className={`mt-3 rounded-xl px-3 py-2 text-center ${tooltip.stat.color}`}>
              <p className="text-xl font-black leading-none">{tooltip.stat.value}</p>
              <p className="mt-0.5 text-[10px] opacity-70">{tooltip.stat.label}</p>
            </div>
          )}

          {tooltip.visual}
        </div>
      )}

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Pre-built tooltip data ────────────────────────────────────────────────────
// Import these in page.tsx alongside the features array.

export const featureTooltips: Record<string, TooltipData> = {
  "Active Recall": {
    text: "Anstatt passiv zu lesen, rufst du aktiv aus dem Gedächtnis ab. Jeder Abrufversuch stärkt die synaptische Verbindung — egal ob richtig oder falsch. Testen ist nachweislich effektiver als Wiederlesen.",
    stat: {
      value: "2× effektiver",
      label: "als passives Wiederlesen (Roediger & Karpicke, 2006)",
      color: "bg-violet-500/15 text-violet-300",
    },
  },
  "Spaced Repetition": {
    text: "Wiederholungen kurz vor dem Vergessen verankern Wissen tief im Langzeitgedächtnis. Synapze berechnet automatisch den optimalen Zeitpunkt — basierend auf der Ebbinghaus-Vergessenskurve.",
    stat: {
      value: "~85% Retention",
      label: "nach 30 Tagen — statt 21% ohne Wiederholung",
      color: "bg-blue-500/15 text-blue-300",
    },
    visual: <MiniEbbinghaus />,
  },
  "Feynman-Technik": {
    text: "Kannst du etwas einem Kind erklären? Wenn ja, verstehst du es wirklich. Die KI erklärt jeden Begriff auf drei Niveaus — und zeigt dir genau, wo dein Verständnis noch Lücken hat.",
    stat: {
      value: "3 Niveau-Stufen",
      label: "von Grundschule bis Experte",
      color: "bg-emerald-500/15 text-emerald-300",
    },
    visual: <FeynmanLevels />,
  },
  "Pomodoro": {
    text: "25 Minuten volle Konzentration, dann 5 Minuten Pause. Dieser Rhythmus verhindert mentale Erschöpfung und hält dein Gehirn konstant aufnahmefähig.",
    stat: {
      value: "↑ Konzentration",
      label: "durch strukturierte Fokus-Pausen (Cirillo, 1980s)",
      color: "bg-rose-500/15 text-rose-300",
    },
    visual: <PomodoroVisual />,
  },
  "Parkinsons Gesetz": {
    text: "\"Arbeit dehnt sich aus, um die Zeit zu füllen, die für sie vorgesehen ist.\" Wenn du dir bewusst weniger Zeit gibst, arbeitest du fokussierter und effizienter — ohne Qualitätsverlust.",
    stat: {
      value: "C. N. Parkinson",
      label: "Economist, 1955 — gilt heute noch für jedes Lernziel",
      color: "bg-amber-500/15 text-amber-300",
    },
  },
  "Interleaved Practice": {
    text: "Statt ein Thema vollständig durchzuarbeiten, wechselst du zwischen verschiedenen Themen. Das fühlt sich schwerer an — ist aber nachweislich besser für Langzeiterfolg und Transferwissen.",
    stat: {
      value: "43% besser",
      label: "in Abschlusstests vs. geblockte Wiederholung (Kornell & Bjork, 2008)",
      color: "bg-teal-500/15 text-teal-300",
    },
    visual: <InterleavedVisual />,
  },
};
