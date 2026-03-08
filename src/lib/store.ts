import type { Deck, Card, CardStatus, CardFlag } from "./data";
import { decks as mockDecks } from "./data";
import type { SRSState, SRSSettings, RegimeKey } from "./srs";
import { isDue, REGIME_PRESETS, DEFAULT_SETTINGS } from "./srs";

const USER_DECKS_KEY   = "synapze-user-decks";
const MOCK_ADDITIONS_KEY = "synapze-mock-additions";
const MOCK_OVERRIDES_KEY = "synapze-mock-overrides";
const MOCK_HIDDEN_KEY    = "synapze-mock-hidden";
const BACKUPS_KEY        = "synapze-backups";
const CARD_EDITS_KEY     = "synapze-card-edits";

// ─── User Decks ───────────────────────────────────────────────────────────────

export function getUserDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_DECKS_KEY);
    return raw ? (JSON.parse(raw) as Deck[]) : [];
  } catch {
    return [];
  }
}

function saveUserDecks(list: Deck[]): void {
  localStorage.setItem(USER_DECKS_KEY, JSON.stringify(list));
}

export function createUserDeck(deck: Deck): void {
  const list = getUserDecks();
  list.push(deck);
  saveUserDecks(list);
}

// ─── Card edits (per-card overrides for any deck) ────────────────────────────

type CardEdit = { front?: string; back?: string; frontImageUrl?: string | null; backImageUrl?: string | null };
type CardEditsStore = Record<string, CardEdit>; // key: `${deckId}:${cardId}`

function getCardEdits(): CardEditsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CARD_EDITS_KEY);
    return raw ? (JSON.parse(raw) as CardEditsStore) : {};
  } catch { return {}; }
}

export function updateCard(
  deckId: string,
  cardId: string,
  updates: { front?: string; back?: string; frontImageUrl?: string | null; backImageUrl?: string | null },
): void {
  const cardUpdates = {
    ...(updates.front !== undefined && { front: updates.front }),
    ...(updates.back !== undefined && { back: updates.back }),
    frontImageUrl: updates.frontImageUrl ?? undefined,
    backImageUrl: updates.backImageUrl ?? undefined,
  };

  // User deck: update card directly
  if (!MOCK_IDS.has(deckId)) {
    const list = getUserDecks();
    const di = list.findIndex((d) => d.id === deckId);
    if (di === -1) return;
    const ci = list[di].cards.findIndex((c) => c.id === cardId);
    if (ci === -1) return;
    list[di].cards[ci] = { ...list[di].cards[ci], ...cardUpdates };
    saveUserDecks(list);
    return;
  }
  // Mock deck added card: update in additions store
  const additions = getMockAdditions();
  const added = additions[deckId];
  if (added) {
    const ci = added.findIndex((c) => c.id === cardId);
    if (ci !== -1) {
      added[ci] = { ...added[ci], ...cardUpdates };
      saveMockAdditions(additions);
      return;
    }
  }
  // Mock deck original card: store as edit override
  const edits = getCardEdits();
  edits[`${deckId}:${cardId}`] = { ...edits[`${deckId}:${cardId}`], ...updates };
  localStorage.setItem(CARD_EDITS_KEY, JSON.stringify(edits));
}

// ─── Mock-Deck additions ─────────────────────────────────────────────────────

function getMockAdditions(): Record<string, Card[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MOCK_ADDITIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Card[]>) : {};
  } catch {
    return {};
  }
}

function saveMockAdditions(additions: Record<string, Card[]>): void {
  localStorage.setItem(MOCK_ADDITIONS_KEY, JSON.stringify(additions));
}

// ─── Add cards to any deck (mock or user) ────────────────────────────────────

const MOCK_IDS = new Set(mockDecks.map((d) => d.id));

export function addCardsToDeck(deckId: string, newCards: Card[]): boolean {
  if (MOCK_IDS.has(deckId)) {
    const additions = getMockAdditions();
    additions[deckId] = [...(additions[deckId] ?? []), ...newCards];
    saveMockAdditions(additions);
    return true;
  }
  const list = getUserDecks();
  const idx = list.findIndex((d) => d.id === deckId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], cards: [...list[idx].cards, ...newCards] };
  saveUserDecks(list);
  return true;
}

// ─── Merge all decks ─────────────────────────────────────────────────────────

/** Returns mock decks (with any user additions/overrides/card-edits) + user-created decks. */
export function getAllDecks(): Deck[] {
  const additions = getMockAdditions();
  const overrides = getMockOverrides();
  const hidden = getMockHidden();
  const cardEdits = getCardEdits();
  const augmentedMock: Deck[] = mockDecks
    .filter((d) => !hidden.includes(d.id))
    .map((d) => {
      // Apply per-card edits to original mock cards
      const editedCards = d.cards.map((c) => {
        const edit = cardEdits[`${d.id}:${c.id}`];
        if (!edit) return c;
        return {
          ...c,
          ...(edit.front !== undefined && { front: edit.front }),
          ...(edit.back  !== undefined && { back:  edit.back  }),
          frontImageUrl: "frontImageUrl" in edit ? (edit.frontImageUrl ?? undefined) : c.frontImageUrl,
          backImageUrl:  "backImageUrl"  in edit ? (edit.backImageUrl  ?? undefined) : c.backImageUrl,
        };
      });
      const withCards = additions[d.id]
        ? { ...d, cards: [...editedCards, ...additions[d.id]!] }
        : { ...d, cards: editedCards };
      const ov = overrides[d.id];
      return ov ? { ...withCards, title: ov.title, emoji: ov.emoji } : withCards;
    });
  return [...augmentedMock, ...getUserDecks()];
}

/** Returns user-created decks that are direct children of the given parentId */
export function getSubDecks(parentId: string): Deck[] {
  return getUserDecks().filter((d) => d.parentId === parentId);
}

// ─── Delete / Rename user decks ───────────────────────────────────────────────

export function deleteUserDeck(deckId: string): void {
  saveUserDecks(getUserDecks().filter((d) => d.id !== deckId));
}

export function renameUserDeck(deckId: string, newTitle: string, newEmoji: string): void {
  const list = getUserDecks();
  const idx = list.findIndex((d) => d.id === deckId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], title: newTitle, emoji: newEmoji };
  saveUserDecks(list);
}

// ─── Delete / Rename predefined decks (stored as overrides) ──────────────────

function getMockOverrides(): Record<string, { title: string; emoji: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MOCK_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getMockHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MOCK_HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Unified delete / rename for any deck ────────────────────────────────────

export function deleteDeck(deckId: string): void {
  if (deckId.startsWith("user-")) {
    deleteUserDeck(deckId);
  } else {
    const hidden = getMockHidden();
    if (!hidden.includes(deckId)) {
      localStorage.setItem(MOCK_HIDDEN_KEY, JSON.stringify([...hidden, deckId]));
    }
  }
}

export function renameDeck(deckId: string, newTitle: string, newEmoji: string): void {
  if (deckId.startsWith("user-")) {
    renameUserDeck(deckId, newTitle, newEmoji);
  } else {
    const overrides = getMockOverrides();
    overrides[deckId] = { title: newTitle, emoji: newEmoji };
    localStorage.setItem(MOCK_OVERRIDES_KEY, JSON.stringify(overrides));
  }
}

// ─── Folders & Documents ──────────────────────────────────────────────────────

export interface FolderDoc {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
}

export interface UserFolder {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  documents: FolderDoc[];
}

const FOLDERS_KEY = "synapze-folders";

function getFolderList(): UserFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? (JSON.parse(raw) as UserFolder[]) : [];
  } catch { return []; }
}

function saveFolderList(list: UserFolder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(list));
}

export function getFolders(): UserFolder[] { return getFolderList(); }

export function createUserFolder(folder: UserFolder): void {
  const list = getFolderList();
  list.push(folder);
  saveFolderList(list);
}

export function deleteUserFolder(folderId: string): void {
  saveFolderList(getFolderList().filter((f) => f.id !== folderId));
}

export function renameUserFolder(folderId: string, name: string, emoji: string): void {
  const list = getFolderList();
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], name, emoji };
  saveFolderList(list);
}

export function addDocToFolder(folderId: string, doc: FolderDoc): void {
  const list = getFolderList();
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], documents: [...list[idx].documents, doc] };
  saveFolderList(list);
}

export function deleteDocFromFolder(folderId: string, docId: string): void {
  const list = getFolderList();
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], documents: list[idx].documents.filter((d) => d.id !== docId) };
  saveFolderList(list);
}

// ─── Backups / Sync ───────────────────────────────────────────────────────────

export interface Backup {
  id: string;
  createdAt: string; // ISO string
  label: string;
  data: Record<string, string>; // key → raw JSON string
}

const SYNC_KEYS = [
  USER_DECKS_KEY,
  MOCK_ADDITIONS_KEY,
  MOCK_OVERRIDES_KEY,
  MOCK_HIDDEN_KEY,
  CARD_EDITS_KEY,
  "synapze-theme",
  "synapze-profile",
  "synapze-folders",
];

export function getBackups(): Backup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BACKUPS_KEY);
    return raw ? (JSON.parse(raw) as Backup[]) : [];
  } catch { return []; }
}

export function createBackup(label?: string): Backup {
  const snapshot: Record<string, string> = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) snapshot[key] = val;
  }
  const now = new Date();
  const backup: Backup = {
    id: `backup-${Date.now()}`,
    createdAt: now.toISOString(),
    label: label ?? `Sync ${now.toLocaleDateString("de-DE")} ${now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`,
    data: snapshot,
  };
  const list = getBackups();
  list.unshift(backup);
  // keep max 20 backups
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(list.slice(0, 20)));
  return backup;
}

export function deleteBackup(id: string): void {
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(getBackups().filter((b) => b.id !== id)));
}

export function restoreBackup(id: string): boolean {
  const backup = getBackups().find((b) => b.id === id);
  if (!backup) return false;
  for (const [key, val] of Object.entries(backup.data)) {
    localStorage.setItem(key, val);
  }
  return true;
}

// ─── Per-deck SRS settings ────────────────────────────────────────────────────

const DECK_SETTINGS_KEY = "synapze-deck-settings";
type DeckSettingsStore = Record<string, RegimeKey>;

function getDeckSettingsStore(): DeckSettingsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DECK_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as DeckSettingsStore) : {};
  } catch { return {}; }
}

export function getDeckRegime(deckId: string): RegimeKey {
  return getDeckSettingsStore()[deckId] ?? "standard";
}

export function getDeckSRSSettings(deckId: string): SRSSettings {
  return REGIME_PRESETS[getDeckRegime(deckId)].settings ?? DEFAULT_SETTINGS;
}

export function setDeckRegime(deckId: string, regime: RegimeKey): void {
  const store = getDeckSettingsStore();
  store[deckId] = regime;
  localStorage.setItem(DECK_SETTINGS_KEY, JSON.stringify(store));
}

// ─── SRS State ────────────────────────────────────────────────────────────────

const SRS_KEY = "synapze-srs";
type SRSStore = Record<string, SRSState>; // key: `${deckId}:${cardId}`

function getSRSStore(): SRSStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SRS_KEY);
    return raw ? (JSON.parse(raw) as SRSStore) : {};
  } catch { return {}; }
}

/** Returns the full SRS store (all card states) for analytics. Key = `${deckId}:${cardId}` */
export function getAllSRSStates(): SRSStore {
  return getSRSStore();
}

export function getSRSState(deckId: string, cardId: string): SRSState | null {
  return getSRSStore()[`${deckId}:${cardId}`] ?? null;
}

export function setSRSState(deckId: string, cardId: string, state: SRSState): void {
  const store = getSRSStore();
  store[`${deckId}:${cardId}`] = state;
  localStorage.setItem(SRS_KEY, JSON.stringify(store));
}

export interface QueueItem {
  card: Card;
  srs: SRSState | null;
  deckId: string;
}

/** Cards due today (overdue → new), ordered for study. */
export function getStudyQueue(deckId: string): QueueItem[] {
  const deck = getAllDecks().find((d) => d.id === deckId);
  if (!deck) return [];
  const store = getSRSStore();

  return deck.cards
    .map((card) => ({
      card,
      srs: store[`${deckId}:${card.id}`] ?? null,
      deckId,
    }))
    .filter(({ srs }) => isDue(srs))
    .sort((a, b) => {
      // New cards last; among reviewed cards sort by due date (overdue first)
      if (!a.srs && !b.srs) return 0;
      if (!a.srs) return 1;
      if (!b.srs) return -1;
      return a.srs.due.localeCompare(b.srs.due);
    });
}

/** Combined study queue across multiple deck IDs (e.g. parent + sub-decks) */
export function getStudyQueueForDecks(deckIds: string[]): QueueItem[] {
  const store = getSRSStore();
  const all = getAllDecks();
  return deckIds.flatMap((deckId) => {
    const deck = all.find((d) => d.id === deckId);
    if (!deck) return [];
    return deck.cards
      .map((card) => ({ card, srs: store[`${deckId}:${card.id}`] ?? null, deckId }))
      .filter(({ srs }) => isDue(srs));
  }).sort((a, b) => {
    if (!a.srs && !b.srs) return 0;
    if (!a.srs) return 1;
    if (!b.srs) return -1;
    return a.srs.due.localeCompare(b.srs.due);
  });
}

// ─── Study Mode ───────────────────────────────────────────────────────────────

/**
 * Derives the current study mode from the user profile.
 * - Klasse 5–8  → always "simple"
 * - Klasse 9    → "simple" by default, "expert" if explicitly toggled on
 * - Klasse 10+  → "expert" by default, "simple" if explicitly toggled off
 * - studium / unknown → "expert"
 */
export function getStudyMode(): "simple" | "expert" {
  if (typeof window === "undefined") return "expert";
  try {
    const raw = localStorage.getItem("synapze-profile");
    if (!raw) return "expert";
    const profile = JSON.parse(raw);
    const schuljahr: string = profile.schuljahr ?? "";
    const expertMode: boolean | undefined = profile.expertMode;
    const match = schuljahr.match(/^klasse-(\d+)$/);
    if (!match) return "expert"; // studium-* or empty
    const grade = parseInt(match[1]);
    if (grade <= 8) return "simple";
    if (grade === 9) return expertMode === true ? "expert" : "simple";
    return expertMode === false ? "simple" : "expert"; // 10+: default expert
  } catch { return "expert"; }
}

export function setExpertMode(value: boolean): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("synapze-profile");
  const profile = raw ? JSON.parse(raw) : {};
  profile.expertMode = value;
  localStorage.setItem("synapze-profile", JSON.stringify(profile));
}

// ─── Flat card list (re-exported helper) ─────────────────────────────────────

export function getAllCardsFromStore() {
  const all = getAllDecks();
  return all.flatMap((deck) =>
    deck.cards.map((card) => ({
      ...card,
      uid: `${deck.id}_${card.id}`,
      deckId: deck.id,
      deckTitle: deck.title,
      deckEmoji: deck.emoji,
      deckColor: deck.color,
      status: (card.status ?? "new") as CardStatus,
      flag: (card.flag ?? 0) as CardFlag,
    }))
  );
}
