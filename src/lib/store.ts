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
