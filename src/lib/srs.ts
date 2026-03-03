/**
 * FSRS-4.5 Spaced Repetition Scheduler
 *
 * Based on the open FSRS specification:
 * https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 *
 * Stability (S): interval in days at which retention = 90%
 * Difficulty (D): 1–10, how hard the card is for this user
 * Retrievability (R): current recall probability
 */

export type Rating = 1 | 2 | 3 | 4; // Again | Hard | Good | Easy

// ─── Per-deck regime ───────────────────────────────────────────────────────────

export type RegimeKey = "streng" | "standard" | "entspannt";

export interface SRSSettings {
  requestRetention: number; // 0–1, target recall probability
  maxInterval: number;      // days, cap on scheduled interval
  /** If set, all 4 ratings use these fixed intervals (in minutes) instead of FSRS algorithm */
  fixedIntervals?: { again: number; hard: number; good: number; easy: number };
}

export const REGIME_PRESETS: Record<RegimeKey, { label: string; description: string; emoji: string; settings: SRSSettings }> = {
  streng: {
    label: "Streng",
    description: "Kürzere Intervalle, mehr Wiederholungen — ideal für Prüfungsvorbereitung",
    emoji: "🔥",
    settings: {
      requestRetention: 0.95,
      maxInterval: 60,
      fixedIntervals: { again: 10, hard: 840, good: 1440, easy: 4320 }, // 10min | 14h | 1T | 3T
    },
  },
  standard: {
    label: "Standard",
    description: "Ausgeglichenes Verhältnis zwischen Aufwand und Langzeitgedächtnis",
    emoji: "⚖️",
    settings: { requestRetention: 0.90, maxInterval: 365 },
  },
  entspannt: {
    label: "Entspannt",
    description: "Längere Intervalle, weniger Wiederholungen — für dauerhaftes Wissen",
    emoji: "🌿",
    settings: { requestRetention: 0.82, maxInterval: 730 },
  },
};

export const DEFAULT_SETTINGS: SRSSettings = REGIME_PRESETS.standard.settings;

export interface SRSState {
  stability: number;   // days
  difficulty: number;  // 1–10
  reps: number;
  lapses: number;
  lastReview: string;  // YYYY-MM-DD
  due: string;         // YYYY-MM-DD
  cardState: "new" | "learning" | "review" | "relearning";
}

// ─── Default weights (FSRS-4.5) ───────────────────────────────────────────────

const W = [
  0.4072, 1.1829, 3.1262, 15.4722,  // S₀ for ratings 1–4
  7.2102, 0.5316,                    // D₀ base and scale
  1.0651, 0.0589,                    // difficulty update
  1.4701, 0.1544, 1.0040,            // recall stability
  1.9308, 0.1100, 0.2900, 2.2700,   // forget stability
  0.1600, 2.9898,                    // hard penalty, easy bonus
  0.5100, 0.3484,
];

const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // ≈ 0.2346

// ─── Core math ────────────────────────────────────────────────────────────────

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Initial stability after first review of a new card */
function initS(r: Rating): number {
  return Math.max(W[r - 1], 0.1);
}

/** Initial difficulty after first review of a new card */
function initD(r: Rating): number {
  return clamp(W[4] - Math.exp(W[5] * (r - 1)) + 1, 1, 10);
}

/** Retrievability: probability of recall after `elapsed` days */
function retrievability(elapsed: number, S: number): number {
  return Math.pow(1 + FACTOR * elapsed / S, DECAY);
}

/** New stability after a successful recall */
function recallS(D: number, S: number, R: number, r: Rating): number {
  const hard  = r === 2 ? W[15] : 1;
  const easy  = r === 4 ? W[16] : 1;
  return Math.max(
    0.1,
    S * (Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) + 1) * hard * easy,
  );
}

/** New stability after forgetting (rating = 1) */
function forgetS(D: number, S: number, R: number): number {
  return Math.max(
    0.1,
    W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R)),
  );
}

/** Difficulty update (mean-reverting toward initD(Good)) */
function nextD(D: number, r: Rating): number {
  return clamp(W[7] * initD(3) + (1 - W[7]) * (D - W[6] * (r - 3)), 1, 10);
}

function nextInterval(S: number, settings: SRSSettings = DEFAULT_SETTINGS): number {
  const t = S / FACTOR * (Math.pow(settings.requestRetention, 1 / DECAY) - 1);
  return Math.max(1, Math.min(settings.maxInterval, Math.round(t)));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Returns an ISO datetime string offset by the given number of minutes */
function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function elapsedDays(lastReview: string): number {
  const a = new Date(lastReview + "T00:00:00");
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the next SRS state after a card is rated.
 * Pass `null` for brand-new cards that have never been reviewed.
 */
export function schedule(state: SRSState | null, r: Rating, settings: SRSSettings = DEFAULT_SETTINGS): SRSState {
  const t = todayStr();
  const fi = settings.fixedIntervals;

  // ── Fixed-interval mode (e.g. "streng") ─────────────────────────────────
  if (fi) {
    const minutes = r === 1 ? fi.again : r === 2 ? fi.hard : r === 3 ? fi.good : fi.easy;
    const S = state ? state.stability : initS(r);
    const D = state ? nextD(state.difficulty, r) : initD(r);
    return {
      stability: S,
      difficulty: D,
      reps: (state?.reps ?? 0) + 1,
      lapses: (state?.lapses ?? 0) + (r === 1 ? 1 : 0),
      lastReview: t,
      due: addMinutes(minutes),
      cardState: r === 1 ? "relearning" : "review",
    };
  }

  // ── First review of a new card ───────────────────────────────────────────
  if (!state || state.cardState === "new") {
    const S  = initS(r);
    const D  = initD(r);
    const iv = r === 1 ? 1 : nextInterval(S, settings);
    return {
      stability: S,
      difficulty: D,
      reps: 1,
      lapses: r === 1 ? 1 : 0,
      lastReview: t,
      due: addDays(iv),
      cardState: r <= 2 ? "learning" : "review",
    };
  }

  // ── Subsequent review ────────────────────────────────────────────────────
  const el = elapsedDays(state.lastReview);
  const R  = retrievability(el, state.stability);
  const D  = nextD(state.difficulty, r);

  if (r === 1) {
    const S = forgetS(state.difficulty, state.stability, R);
    return {
      stability: S,
      difficulty: D,
      reps: state.reps + 1,
      lapses: state.lapses + 1,
      lastReview: t,
      due: addDays(1),
      cardState: "relearning",
    };
  }

  // Recalled — grow stability
  const S  = recallS(state.difficulty, state.stability, R, r);
  const iv = nextInterval(S, settings);
  return {
    stability: S,
    difficulty: D,
    reps: state.reps + 1,
    lapses: state.lapses,
    lastReview: t,
    due: addDays(iv),
    cardState: "review",
  };
}

/**
 * Preview what each button would schedule (for button labels in the UI).
 * Returns [again, hard, good, easy] as human-readable strings ("1T", "3T", "3M", …)
 */
export function previewIntervals(state: SRSState | null, settings: SRSSettings = DEFAULT_SETTINGS): [string, string, string, string] {
  const now = new Date();
  return ([1, 2, 3, 4] as Rating[]).map((r) => {
    const next = schedule(state, r, settings);
    const due  = new Date(next.due);
    const mins = Math.round((due.getTime() - now.getTime()) / 60_000);
    if (mins < 1)    return "Jetzt";
    if (mins < 60)   return `${mins}Min`;
    if (mins < 1440) return `${Math.round(mins / 60)}Std`;
    const days = Math.round(mins / 1440);
    if (days === 1)  return "1T";
    if (days < 30)   return `${days}T`;
    if (days < 365)  return `${Math.round(days / 30)}M`;
    return `${Math.round(days / 365)}J`;
  }) as [string, string, string, string];
}

/** True if a card is due now or overdue (handles both YYYY-MM-DD and full ISO datetime) */
export function isDue(state: SRSState | null): boolean {
  if (!state) return true; // new card
  // If due contains a 'T', it's a precise datetime → compare against now
  if (state.due.includes("T")) return new Date(state.due) <= new Date();
  // Otherwise it's a date-only string → compare against today
  return state.due <= todayStr();
}
