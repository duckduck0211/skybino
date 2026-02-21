export type CardType = "basic" | "cloze" | "image-occlusion";

export interface OcclusionArea {
  id: string;
  x: number; // percentage
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface Card {
  id: string;
  type?: CardType; // defaults to "basic" if undefined
  // Basic
  front: string;
  back: string;
  // Cloze: text with {{c1::word}} syntax stored in `front`, back is unused
  // Image Occlusion
  imageUrl?: string;
  occlusionAreas?: OcclusionArea[];
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
    masteredCount: 8,
    lastStudied: "Heute",
    cards: [
      { id: "1", front: "Wo liegt die Leber?", back: "Rechter Oberbauch, unterhalb des Zwerchfells" },
      { id: "2", front: "Was ist das Myokard?", back: "Die Herzmuskulatur" },
      { id: "3", front: "Aufgabe der Niere?", back: "Filtration des Blutes, Produktion von Urin, Blutdruckregulation" },
      { id: "4", front: "Was produziert die Bauchspeicheldrüse?", back: "Insulin, Glukagon und Verdauungsenzyme" },
      { id: "5", front: "Wo liegt die Milz?", back: "Linker Oberbauch, hinter dem Magen" },
      { id: "6", front: "Was ist das Peritoneum?", back: "Das Bauchfell – seröse Haut, die Bauchorgane umhüllt" },
      { id: "7", front: "Funktion der Lunge?", back: "Gasaustausch: O₂ aufnehmen, CO₂ abgeben" },
      { id: "8", front: "Was ist das Cerebellum?", back: "Das Kleinhirn – zuständig für Koordination und Gleichgewicht" },
      { id: "9", front: "Was ist die Aorta?", back: "Die Hauptschlagader – größte Arterie des menschlichen Körpers" },
      { id: "10", front: "Funktion der Gallenblase?", back: "Speicherung und Konzentration von Galle" },
      { id: "11", front: "Was ist das Duodenum?", back: "Der Zwölffingerdarm – erster Abschnitt des Dünndarms" },
      { id: "12", front: "Was ist das Diaphragma?", back: "Das Zwerchfell – wichtigster Atemmuskel" },
      { id: "13", front: "Wo sitzt die Hypophyse?", back: "An der Basis des Gehirns, in der Sella turcica" },
      { id: "14", front: "Was ist das Pankreas?", back: "Die Bauchspeicheldrüse – exokrine und endokrine Drüse" },
      { id: "15", front: "Funktion der Leukozyten?", back: "Abwehr von Krankheitserregern (Immunabwehr)" },
    ],
  },
  {
    id: "javascript-basics",
    title: "JavaScript Basics",
    description: "Grundlagen der JavaScript-Programmierung",
    category: "Informatik",
    color: "bg-yellow-500",
    emoji: "⚡",
    masteredCount: 12,
    lastStudied: "Gestern",
    cards: [
      { id: "1", front: "Was ist eine Closure?", back: "Eine Funktion, die Zugriff auf Variablen ihres äußeren Scopes hat, auch nach dessen Ausführung" },
      { id: "2", front: "Unterschied let vs const?", back: "let: neu zuweisbar, const: nicht neu zuweisbar (aber Objekt-Eigenschaften änderbar)" },
      { id: "3", front: "Was ist das Event Loop?", back: "Mechanismus, der asynchrone Callbacks verwaltet und die Call Stack überwacht" },
      { id: "4", front: "Was ist Hoisting?", back: "var-Deklarationen werden ans Top des Scopes gehoben, aber nicht die Zuweisung" },
      { id: "5", front: "Was ist ein Promise?", back: "Objekt für asynchrone Operationen mit den Zuständen: pending, fulfilled, rejected" },
      { id: "6", front: "Was bedeutet === vs ==?", back: "=== prüft Wert UND Typ (strict), == prüft nur Wert mit Typkonvertierung" },
      { id: "7", front: "Was ist der Spread-Operator?", back: "... verteilt Elemente eines Arrays/Objekts: [...arr] oder {...obj}" },
      { id: "8", front: "Was ist async/await?", back: "Syntaktischer Zucker für Promises – macht asynchronen Code synchron lesbar" },
      { id: "9", front: "Was ist der typeof-Operator?", back: "Gibt den Datentyp als String zurück: 'string', 'number', 'boolean', 'object', 'function'" },
      { id: "10", front: "Was ist Array.map()?", back: "Erstellt ein neues Array, indem eine Funktion auf jedes Element angewendet wird" },
    ],
  },
  {
    id: "englisch-b2",
    title: "Englisch Vokabeln B2",
    description: "Erweiterter Wortschatz für das B2-Niveau",
    category: "Sprachen",
    color: "bg-blue-500",
    emoji: "🇬🇧",
    masteredCount: 18,
    lastStudied: "Vor 2 Tagen",
    cards: [
      { id: "1", front: "ambiguous", back: "zweideutig, mehrdeutig" },
      { id: "2", front: "comprehensive", back: "umfassend, vollständig" },
      { id: "3", front: "deteriorate", back: "sich verschlechtern, verfallen" },
      { id: "4", front: "eloquent", back: "redegewandt, ausdrucksstark" },
      { id: "5", front: "feasible", back: "machbar, durchführbar" },
      { id: "6", front: "inevitable", back: "unvermeidlich, unausweichlich" },
      { id: "7", front: "pragmatic", back: "pragmatisch, praktisch denkend" },
      { id: "8", front: "substantial", back: "erheblich, beträchtlich" },
      { id: "9", front: "unprecedented", back: "beispiellos, noch nie dagewesen" },
      { id: "10", front: "vulnerability", back: "Verletzlichkeit, Schwachstelle" },
    ],
  },
  {
    id: "biochemie-stoffwechsel",
    title: "Biochemie: Stoffwechsel",
    description: "Glykolyse, Citratzyklus und Atmungskette",
    category: "Medizin",
    color: "bg-emerald-500",
    emoji: "🧬",
    masteredCount: 4,
    cards: [
      { id: "1", front: "Was ist Glykolyse?", back: "Abbau von Glukose zu Pyruvat – findet im Zytoplasma statt, liefert 2 ATP" },
      { id: "2", front: "Was ist der Citratzyklus?", back: "Abbau von Acetyl-CoA zu CO₂ im Mitochondrium, liefert NADH und FADH₂" },
      { id: "3", front: "Was ist oxidative Phosphorylierung?", back: "ATP-Synthese durch Elektronentransportkette an der inneren Mitochondrienmembran" },
      { id: "4", front: "Was ist ATP?", back: "Adenosintriphosphat – universeller Energieträger der Zelle" },
      { id: "5", front: "Was ist NADH?", back: "Reduziertes NAD⁺ – Elektronen-Carrier, wichtig für die Energiegewinnung" },
      { id: "6", front: "Wie viel ATP liefert 1 Glukosemolekül?", back: "Ca. 30–32 ATP (Netto)" },
      { id: "7", front: "Was ist Gluconeogenese?", back: "Neubildung von Glukose aus Nicht-Kohlenhydraten (Aminosäuren, Laktat, Glycerin)" },
      { id: "8", front: "Was ist Glykogen?", back: "Speicherform der Glukose in Leber und Muskel" },
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
      { id: "1", front: "Was ist ein List Comprehension?", back: "[expr for item in list] – kompakte Art, Listen zu erstellen" },
      { id: "2", front: "Unterschied list vs tuple?", back: "list: veränderlich (mutable), tuple: unveränderlich (immutable)" },
      { id: "3", front: "Was ist ein Dictionary?", back: "Schlüssel-Wert-Paare: {'key': value} – O(1) Lookup" },
      { id: "4", front: "Was macht __init__?", back: "Konstruktor einer Klasse – wird beim Erstellen einer Instanz aufgerufen" },
      { id: "5", front: "Was ist ein Decorator?", back: "Funktion die eine andere Funktion modifiziert: @decorator_name" },
      { id: "6", front: "Was ist yield?", back: "Erstellt einen Generator – gibt Werte nacheinander zurück, ohne alles im Speicher zu halten" },
    ],
  },
  {
    id: "geschichte-weimar",
    title: "Weimarer Republik",
    description: "Deutschland 1919–1933",
    category: "Geschichte",
    color: "bg-amber-500",
    emoji: "📜",
    masteredCount: 2,
    cards: [
      { id: "1", front: "Wann wurde die Weimarer Republik gegründet?", back: "1919 nach dem Ende des Ersten Weltkriegs und der Abdankung Wilhelms II." },
      { id: "2", front: "Was war der Schwarze Freitag?", back: "24. Oktober 1929 – Börsenkrach in New York, der die Weltwirtschaftskrise auslöste" },
      { id: "3", front: "Was war der Kapp-Putsch?", back: "Gescheiterter Putschversuch 1920, niedergeschlagen durch Generalstreik" },
      { id: "4", front: "Was war die Hyperinflation?", back: "1921–1923: Extreme Geldentwertung, 1 Dollar = 4,2 Billionen Mark (November 1923)" },
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
