"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Timer, Bell, BellOff, Check, LayoutList, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "hoch" | "mittel" | "niedrig";
type DayKey = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";

export interface TodoItem {
  id: string;
  title: string;
  priority: Priority;
  day: DayKey | null;
  dueTime?: string; // "HH:MM"
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "synapze-todos";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; badge: string; order: number }> = {
  hoch:     { label: "Hoch",    color: "bg-rose-500",   badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",    order: 0 },
  mittel:   { label: "Mittel",  color: "bg-amber-500",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",  order: 1 },
  niedrig:  { label: "Niedrig", color: "bg-emerald-500",badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", order: 2 },
};

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mo", label: "Mo" },
  { key: "di", label: "Di" },
  { key: "mi", label: "Mi" },
  { key: "do", label: "Do" },
  { key: "fr", label: "Fr" },
  { key: "sa", label: "Sa" },
  { key: "so", label: "So" },
];

const DAY_FULL: Record<DayKey, string> = {
  mo: "Montag", di: "Dienstag", mi: "Mittwoch", do: "Donnerstag",
  fr: "Freitag", sa: "Samstag", so: "Sonntag",
};

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TaskCardProps {
  task: TodoItem;
  timer: { taskId: string; remaining: number } | null;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStartTimer: (id: string) => void;
  onStopTimer: () => void;
}

function TaskCard({ task, timer, onComplete, onDelete, onStartTimer, onStopTimer }: TaskCardProps) {
  const isTimerActive = timer?.taskId === task.id;
  const cfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className={cn(
      "group flex items-start gap-3 rounded-xl border p-3 transition-all",
      task.completed ? "bg-muted/20 opacity-60" : "bg-background hover:shadow-sm"
    )}>
      {/* Checkbox */}
      <button
        onClick={() => onComplete(task.id)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary"
        )}
      >
        {task.completed && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {/* Priority */}
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", cfg.badge)}>
            {cfg.label}
          </span>
          {/* Day */}
          {task.day && (
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
              {DAY_FULL[task.day]}
            </span>
          )}
          {/* Alarm */}
          {task.dueTime && (
            <span className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
              <Bell className="h-2.5 w-2.5" />
              {task.dueTime}
            </span>
          )}
        </div>

        {/* Active timer display */}
        {isTimerActive && timer && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5">
              <Timer className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="font-mono text-sm font-bold text-primary">{formatTimer(timer.remaining)}</span>
            </div>
            <button onClick={onStopTimer} className="text-xs text-muted-foreground hover:text-foreground">
              Stopp
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!task.completed && (
          <button
            onClick={() => isTimerActive ? onStopTimer() : onStartTimer(task.id)}
            title="25-min Timer starten"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              isTimerActive
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Timer className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TodoTab() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [view, setView] = useState<"list" | "kanban">("list");

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("mittel");
  const [newDay, setNewDay] = useState<DayKey | null>(null);
  const [newTime, setNewTime] = useState("");
  const [showAlarm, setShowAlarm] = useState(false);

  // Timer state
  const [timer, setTimer] = useState<{ taskId: string; remaining: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setTodos(JSON.parse(raw));
  }, []);

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // Timer countdown
  useEffect(() => {
    if (timer) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (!prev || prev.remaining <= 1) {
            clearInterval(timerRef.current!);
            // Browser notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("⏱ Synapze Timer", { body: "25 Minuten sind um! Mach eine Pause." });
            }
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer?.taskId]);

  // Alarm checker (runs every 30s)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      todos.forEach((t) => {
        if (!t.completed && t.dueTime === hhmm) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`🔔 Synapze Erinnerung`, { body: t.title });
          }
        }
      });
    };
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [todos]);

  function addTodo() {
    if (!newTitle.trim()) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      priority: newPriority,
      day: newDay,
      dueTime: showAlarm && newTime ? newTime : undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [item, ...prev]);
    setNewTitle("");
    setNewDay(null);
    setNewTime("");
    setShowAlarm(false);
  }

  function completeTodo(id: string) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (timer?.taskId === id) setTimer(null);
  }

  function startTimer(taskId: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setTimer({ taskId, remaining: 25 * 60 });
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(null);
  }

  // Sorted tasks for list view
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order;
  });

  const incomplete = sortedTodos.filter((t) => !t.completed);
  const completed = sortedTodos.filter((t) => t.completed);

  return (
    <div className="space-y-5">

      {/* ── Add task form ── */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Neue Aufgabe hinzufügen…"
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button onClick={addTodo} disabled={!newTitle.trim()} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Hinzufügen
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          {(["hoch", "mittel", "niedrig"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setNewPriority(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                newPriority === p
                  ? `${PRIORITY_CONFIG[p].color} text-white border-transparent`
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}

          <div className="h-4 w-px bg-border" />

          {/* Day selector */}
          {DAYS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setNewDay(newDay === key ? null : key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                newDay === key
                  ? "bg-blue-500 text-white border-transparent"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}

          <div className="h-4 w-px bg-border" />

          {/* Alarm toggle */}
          <button
            onClick={() => setShowAlarm(!showAlarm)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              showAlarm ? "bg-violet-500 text-white border-transparent" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {showAlarm ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
            Wecker
          </button>
          {showAlarm && (
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}
        </div>
      </div>

      {/* ── View toggle ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {incomplete.length} offen · {completed.length} erledigt
        </p>
        <div className="flex rounded-lg border p-0.5">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Liste
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Wochenplan
          </button>
        </div>
      </div>

      {/* ── List View ── */}
      {view === "list" && (
        <div className="space-y-2">
          {incomplete.length === 0 && completed.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Aufgaben. Leg los!</p>
          )}
          {incomplete.map((t) => (
            <TaskCard key={t.id} task={t} timer={timer}
              onComplete={completeTodo} onDelete={deleteTodo}
              onStartTimer={startTimer} onStopTimer={stopTimer} />
          ))}
          {completed.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">Erledigt ({completed.length})</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {completed.map((t) => (
                <TaskCard key={t.id} task={t} timer={timer}
                  onComplete={completeTodo} onDelete={deleteTodo}
                  onStartTimer={startTimer} onStopTimer={stopTimer} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Kanban / Wochenplan ── */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {/* Unassigned column */}
            {(() => {
              const unassigned = todos.filter((t) => !t.completed && !t.day);
              return (
                <div className="w-44 shrink-0">
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm">📥</span>
                    <span className="text-xs font-semibold text-muted-foreground">Kein Tag</span>
                    <span className="ml-auto text-xs text-muted-foreground">{unassigned.length}</span>
                  </div>
                  <div className="space-y-2">
                    {unassigned.map((t) => <KanbanCard key={t.id} task={t} timer={timer} onComplete={completeTodo} onDelete={deleteTodo} onStartTimer={startTimer} onStopTimer={stopTimer} />)}
                    {unassigned.length === 0 && <div className="rounded-xl border border-dashed border-muted p-4 text-center text-xs text-muted-foreground">Leer</div>}
                  </div>
                </div>
              );
            })()}

            {/* Day columns */}
            {DAYS.map(({ key, label }) => {
              const dayTodos = todos.filter((t) => !t.completed && t.day === key);
              return (
                <div key={key} className="w-44 shrink-0">
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                    <span className="text-xs font-bold text-primary">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{DAY_FULL[key]}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{dayTodos.length}</span>
                  </div>
                  <div className="space-y-2">
                    {dayTodos.map((t) => <KanbanCard key={t.id} task={t} timer={timer} onComplete={completeTodo} onDelete={deleteTodo} onStartTimer={startTimer} onStopTimer={stopTimer} />)}
                    {dayTodos.length === 0 && <div className="rounded-xl border border-dashed border-muted p-4 text-center text-xs text-muted-foreground">Leer</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kanban card (compact) ────────────────────────────────────────────────────

function KanbanCard({ task, timer, onComplete, onDelete, onStartTimer, onStopTimer }: TaskCardProps) {
  const isTimerActive = timer?.taskId === task.id;
  const cfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className="group rounded-xl border bg-background p-2.5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium leading-snug">{task.title}</p>
        <button onClick={() => onDelete(task.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", cfg.badge)}>
          {cfg.label}
        </span>
        {task.dueTime && (
          <span className="flex items-center gap-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-400">
            <Bell className="h-2 w-2" />{task.dueTime}
          </span>
        )}
      </div>
      {isTimerActive && timer && (
        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1">
          <Timer className="h-3 w-3 text-primary animate-pulse" />
          <span className="font-mono text-xs font-bold text-primary">{formatTimer(timer.remaining)}</span>
        </div>
      )}
      <div className="mt-2 flex gap-1">
        <button onClick={() => onComplete(task.id)} title="Erledigt" className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={() => isTimerActive ? onStopTimer() : onStartTimer(task.id)} title="Timer" className={cn("flex h-6 w-6 items-center justify-center rounded-md transition-colors", isTimerActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted")}>
          <Timer className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
