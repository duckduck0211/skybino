export type CardType = "basic" | "cloze" | "image-occlusion";
export type CardStatus = "new" | "learning" | "review" | "suspended" | "mastered";
export type CardFlag = 0 | 1 | 2 | 3 | 4; // 0=none 1=red 2=orange 3=green 4=blue

export interface OcclusionArea {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface Card {
  id: string;
  type?: CardType;
  // Basic
  front: string;
  back: string;
  // Image Occlusion
  imageUrl?: string;
  occlusionAreas?: OcclusionArea[];
  // SRS
  status?: CardStatus;
  ease?: number;      // 1.3 – 4.0, default 2.5
  interval?: number;  // days until next review
  lapses?: number;    // times forgotten
  reps?: number;      // total reviews
  dueDate?: string;   // "YYYY-MM-DD"
  flag?: CardFlag;
  tags?: string[];
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  emoji: string;
  cards: Card[];
  lastStudied?: string;
  masteredCount: number;
}

export const decks: Deck[] = [
  {
    id: "anatomie-organe",
    title: "Anatomie – Organe",
    description: "Die wichtigsten Organe des menschlichen Körpers",
    category: "Medizin",
    color: "bg-rose-500",
    emoji: "🫀",
    masteredCount: 5,
    lastStudied: "Heute",
    cards: [
      { id: "1",  front: "Wo liegt die Leber?",                    back: "Rechter Oberbauch, unterhalb des Zwerchfells",                         status: "mastered",  ease: 3.2, interval: 21, lapses: 0, reps: 12, dueDate: "2026-03-14" },
      { id: "2",  front: "Was ist das Myokard?",                   back: "Die Herzmuskulatur",                                                   status: "mastered",  ease: 2.9, interval: 14, lapses: 1, reps: 9,  dueDate: "2026-03-07" },
      { id: "3",  front: "Aufgabe der Niere?",                     back: "Filtration des Blutes, Produktion von Urin, Blutdruckregulation",       status: "mastered",  ease: 3.5, interval: 30, lapses: 0, reps: 15, dueDate: "2026-03-23" },
      { id: "4",  front: "Was produziert die Bauchspeicheldrüse?", back: "Insulin, Glukagon und Verdauungsenzyme",                               status: "mastered",  ease: 2.7, interval: 14, lapses: 0, reps: 8,  dueDate: "2026-03-07" },
      { id: "5",  front: "Wo liegt die Milz?",                     back: "Linker Oberbauch, hinter dem Magen",                                   status: "mastered",  ease: 3.1, interval: 21, lapses: 0, reps: 11, dueDate: "2026-03-14" },
      { id: "6",  front: "Was ist das Peritoneum?",                back: "Das Bauchfell – seröse Haut, die Bauchorgane umhüllt",                  status: "review",    ease: 2.5, interval: 7,  lapses: 1, reps: 6,  dueDate: "2026-02-28" },
      { id: "7",  front: "Funktion der Lunge?",                    back: "Gasaustausch: O₂ aufnehmen, CO₂ abgeben",                              status: "review",    ease: 2.1, interval: 3,  lapses: 2, reps: 5,  dueDate: "2026-02-24", flag: 1 },
      { id: "8",  front: "Was ist das Cerebellum?",                back: "Das Kleinhirn – zuständig für Koordination und Gleichgewicht",          status: "review",    ease: 2.3, interval: 5,  lapses: 1, reps: 4,  dueDate: "2026-02-26" },
      { id: "9",  front: "Was ist die Aorta?",                     back: "Die Hauptschlagader – größte Arterie des menschlichen Körpers",         status: "learning",  ease: 1.8, interval: 1,  lapses: 3, reps: 3,  dueDate: "2026-02-20" },
      { id: "10", front: "Funktion der Gallenblase?",              back: "Speicherung und Konzentration von Galle",                              status: "learning",  ease: 2.0, interval: 1,  lapses: 1, reps: 2,  dueDate: "2026-02-21" },
      { id: "11", front: "Was ist das Duodenum?",                  back: "Der Zwölffingerdarm – erster Abschnitt des Dünndarms",                  status: "suspended", ease: 1.3,              lapses: 5, reps: 4 },
      { id: "12", front: "Was ist das Diaphragma?",                back: "Das Zwerchfell – wichtigster Atemmuskel",                              status: "new" },
      { id: "13", front: "Wo sitzt die Hypophyse?",                back: "An der Basis des Gehirns, in der Sella turcica",                       status: "new" },
      { id: "14", front: "Was ist das Pankreas?",                  back: "Die Bauchspeicheldrüse – exokrine und endokrine Drüse",                 status: "new" },
      { id: "15", front: "Funktion der Leukozyten?",               back: "Abwehr von Krankheitserregern (Immunabwehr)",                          status: "new",       flag: 2 },
    ],
  },
  {
    id: "javascript-basics",
    title: "JavaScript Basics",
    description: "Grundlagen der JavaScript-Programmierung",
    category: "Informatik",
    color: "bg-yellow-500",
    emoji: "⚡",
    masteredCount: 4,
    lastStudied: "Gestern",
    cards: [
      { id: "1",  front: "Was ist eine Closure?",         back: "Eine Funktion, die Zugriff auf Variablen ihres äußeren Scopes hat, auch nach dessen Ausführung",    status: "mastered", ease: 3.0, interval: 21, lapses: 0, reps: 10, dueDate: "2026-03-14" },
      { id: "2",  front: "Unterschied let vs const?",     back: "let: neu zuweisbar, const: nicht neu zuweisbar (aber Objekt-Eigenschaften änderbar)",               status: "mastered", ease: 3.4, interval: 30, lapses: 0, reps: 12, dueDate: "2026-03-23" },
      { id: "3",  front: "Was ist das Event Loop?",       back: "Mechanismus, der asynchrone Callbacks verwaltet und die Call Stack überwacht",                      status: "mastered", ease: 2.6, interval: 14, lapses: 1, reps: 8,  dueDate: "2026-03-07" },
      { id: "4",  front: "Was ist Hoisting?",             back: "var-Deklarationen werden ans Top des Scopes gehoben, aber nicht die Zuweisung",                     status: "mastered", ease: 2.8, interval: 14, lapses: 0, reps: 7,  dueDate: "2026-03-07" },
      { id: "5",  front: "Was ist ein Promise?",          back: "Objekt für asynchrone Operationen mit den Zuständen: pending, fulfilled, rejected",                 status: "review",   ease: 2.4, interval: 7,  lapses: 1, reps: 5,  dueDate: "2026-02-28" },
      { id: "6",  front: "Was bedeutet === vs ==?",       back: "=== prüft Wert UND Typ (strict), == prüft nur Wert mit Typkonvertierung",                          status: "review",   ease: 2.2, interval: 5,  lapses: 2, reps: 4,  dueDate: "2026-02-26" },
      { id: "7",  front: "Was ist der Spread-Operator?",  back: "... verteilt Elemente eines Arrays/Objekts: [...arr] oder {...obj}",                                status: "learning", ease: 1.9, interval: 1,  lapses: 2, reps: 2,  dueDate: "2026-02-21" },
      { id: "8",  front: "Was ist async/await?",          back: "Syntaktischer Zucker für Promises – macht asynchronen Code synchron lesbar",                       status: "new" },
      { id: "9",  front: "Was ist der typeof-Operator?",  back: "Gibt den Datentyp als String zurück: 'string', 'number', 'boolean', 'object', 'function'",         status: "new" },
      { id: "10", front: "Was ist Array.map()?",          back: "Erstellt ein neues Array, indem eine Funktion auf jedes Element angewendet wird",                  status: "new",      flag: 3 },
    ],
  },
  {
    id: "englisch-b2",
    title: "Englisch Vokabeln B2",
    description: "Erweiterter Wortschatz für das B2-Niveau",
    category: "Sprachen",
    color: "bg-blue-500",
    emoji: "🇬🇧",
    masteredCount: 3,
    lastStudied: "Vor 2 Tagen",
    cards: [
      { id: "1",  front: "ambiguous",     back: "zweideutig, mehrdeutig",               status: "mastered",  ease: 2.8, interval: 14, lapses: 0, reps: 8,  dueDate: "2026-03-07" },
      { id: "2",  front: "comprehensive", back: "umfassend, vollständig",               status: "mastered",  ease: 3.1, interval: 21, lapses: 0, reps: 9,  dueDate: "2026-03-14" },
      { id: "3",  front: "deteriorate",   back: "sich verschlechtern, verfallen",       status: "mastered",  ease: 2.5, interval: 10, lapses: 1, reps: 6,  dueDate: "2026-03-03" },
      { id: "4",  front: "eloquent",      back: "redegewandt, ausdrucksstark",          status: "review",    ease: 2.3, interval: 5,  lapses: 1, reps: 4,  dueDate: "2026-02-21" },
      { id: "5",  front: "feasible",      back: "machbar, durchführbar",               status: "review",    ease: 2.1, interval: 3,  lapses: 2, reps: 3,  dueDate: "2026-02-22" },
      { id: "6",  front: "inevitable",    back: "unvermeidlich, unausweichlich",        status: "review",    ease: 2.6, interval: 7,  lapses: 0, reps: 5,  dueDate: "2026-02-28" },
      { id: "7",  front: "pragmatic",     back: "pragmatisch, praktisch denkend",      status: "new" },
      { id: "8",  front: "substantial",   back: "erheblich, beträchtlich",             status: "new" },
      { id: "9",  front: "unprecedented", back: "beispiellos, noch nie dagewesen",     status: "new",       flag: 1 },
      { id: "10", front: "vulnerability", back: "Verletzlichkeit, Schwachstelle",      status: "suspended", ease: 1.5,              lapses: 4, reps: 3 },
    ],
  },
  {
    id: "biochemie-stoffwechsel",
    title: "Biochemie: Stoffwechsel",
    description: "Glykolyse, Citratzyklus und Atmungskette",
    category: "Medizin",
    color: "bg-emerald-500",
    emoji: "🧬",
    masteredCount: 2,
    cards: [
      { id: "1", front: "Was ist Glykolyse?",                    back: "Abbau von Glukose zu Pyruvat – findet im Zytoplasma statt, liefert 2 ATP",                          status: "mastered",  ease: 2.9, interval: 21, lapses: 0, reps: 8,  dueDate: "2026-03-14" },
      { id: "2", front: "Was ist der Citratzyklus?",             back: "Abbau von Acetyl-CoA zu CO₂ im Mitochondrium, liefert NADH und FADH₂",                             status: "mastered",  ease: 2.6, interval: 14, lapses: 1, reps: 6,  dueDate: "2026-03-07" },
      { id: "3", front: "Was ist oxidative Phosphorylierung?",   back: "ATP-Synthese durch Elektronentransportkette an der inneren Mitochondrienmembran",                   status: "review",    ease: 2.1, interval: 5,  lapses: 2, reps: 4,  dueDate: "2026-02-21" },
      { id: "4", front: "Was ist ATP?",                          back: "Adenosintriphosphat – universeller Energieträger der Zelle",                                        status: "review",    ease: 2.4, interval: 7,  lapses: 1, reps: 3,  dueDate: "2026-02-22" },
      { id: "5", front: "Was ist NADH?",                         back: "Reduziertes NAD⁺ – Elektronen-Carrier, wichtig für die Energiegewinnung",                          status: "learning",  ease: 1.7, interval: 1,  lapses: 3, reps: 2,  dueDate: "2026-02-21" },
      { id: "6", front: "Wie viel ATP liefert 1 Glukosemolekül?", back: "Ca. 30–32 ATP (Netto)",                                                                          status: "learning",  ease: 2.0, interval: 1,  lapses: 2, reps: 2,  dueDate: "2026-02-21" },
      { id: "7", front: "Was ist Gluconeogenese?",               back: "Neubildung von Glukose aus Nicht-Kohlenhydraten (Aminosäuren, Laktat, Glycerin)",                   status: "new" },
      { id: "8", front: "Was ist Glykogen?",                     back: "Speicherform der Glukose in Leber und Muskel",                                                     status: "new",       flag: 2 },
    ],
  },
  {
    id: "python-grundlagen",
    title: "Python Grundlagen",
    description: "Syntax, Datenstrukturen und OOP in Python",
    category: "Informatik",
    color: "bg-violet-500",
    emoji: "🐍",
    masteredCount: 6,
    cards: [
      { id: "1", front: "Was ist ein List Comprehension?", back: "[expr for item in list] – kompakte Art, Listen zu erstellen",                      status: "mastered", ease: 3.5, interval: 30, lapses: 0, reps: 15, dueDate: "2026-03-23" },
      { id: "2", front: "Unterschied list vs tuple?",      back: "list: veränderlich (mutable), tuple: unveränderlich (immutable)",                   status: "mastered", ease: 3.2, interval: 21, lapses: 0, reps: 12, dueDate: "2026-03-14" },
      { id: "3", front: "Was ist ein Dictionary?",         back: "Schlüssel-Wert-Paare: {'key': value} – O(1) Lookup",                              status: "mastered", ease: 3.0, interval: 21, lapses: 0, reps: 10, dueDate: "2026-03-14" },
      { id: "4", front: "Was macht __init__?",             back: "Konstruktor einer Klasse – wird beim Erstellen einer Instanz aufgerufen",           status: "mastered", ease: 2.8, interval: 14, lapses: 1, reps: 9,  dueDate: "2026-03-07" },
      { id: "5", front: "Was ist ein Decorator?",          back: "Funktion die eine andere Funktion modifiziert: @decorator_name",                   status: "mastered", ease: 2.7, interval: 14, lapses: 1, reps: 8,  dueDate: "2026-03-07" },
      { id: "6", front: "Was ist yield?",                  back: "Erstellt einen Generator – gibt Werte nacheinander zurück, ohne alles im Speicher zu halten", status: "mastered", ease: 2.6, interval: 14, lapses: 0, reps: 7, dueDate: "2026-03-07" },
    ],
  },
  {
    id: "geschichte-weimar",
    title: "Weimarer Republik",
    description: "Deutschland 1919–1933",
    category: "Geschichte",
    color: "bg-amber-500",
    emoji: "📜",
    masteredCount: 1,
    cards: [
      { id: "1", front: "Wann wurde die Weimarer Republik gegründet?", back: "1919 nach dem Ende des Ersten Weltkriegs und der Abdankung Wilhelms II.",                     status: "mastered",  ease: 2.8, interval: 14, lapses: 0, reps: 6,  dueDate: "2026-03-07" },
      { id: "2", front: "Was war der Schwarze Freitag?",               back: "24. Oktober 1929 – Börsenkrach in New York, der die Weltwirtschaftskrise auslöste",           status: "review",    ease: 2.3, interval: 5,  lapses: 1, reps: 3,  dueDate: "2026-02-26" },
      { id: "3", front: "Was war der Kapp-Putsch?",                    back: "Gescheiterter Putschversuch 1920, niedergeschlagen durch Generalstreik",                      status: "learning",  ease: 1.9, interval: 1,  lapses: 2, reps: 2,  dueDate: "2026-02-21" },
      { id: "4", front: "Was war die Hyperinflation?",                 back: "1921–1923: Extreme Geldentwertung, 1 Dollar = 4,2 Billionen Mark (November 1923)",           status: "new",       flag: 1 },
    ],
  },
];

export function getDeckById(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}

export function getTotalCards(): number {
  return decks.reduce((sum, d) => sum + d.cards.length, 0);
}

export function getTotalMastered(): number {
  return decks.reduce((sum, d) => sum + d.masteredCount, 0);
}

/** All cards across all decks, flat, with deck metadata attached */
export function getAllCards() {
  return decks.flatMap((deck) =>
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

export const TODAY = "2026-02-21";
