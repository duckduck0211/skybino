import type { Deck, Card, CardStatus, CardFlag } from "./data";
import { decks as mockDecks } from "./data";

const USER_DECKS_KEY   = "synapze-user-decks";
const MOCK_ADDITIONS_KEY = "synapze-mock-additions";

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

/** Returns mock decks (with any user additions) + user-created decks. */
export function getAllDecks(): Deck[] {
  const additions = getMockAdditions();
  const augmentedMock: Deck[] = mockDecks.map((d) =>
    additions[d.id]
      ? { ...d, cards: [...d.cards, ...additions[d.id]!] }
      : d
  );
  return [...augmentedMock, ...getUserDecks()];
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
