"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CardEntry {
  id: string;
  front: string;
  back: string;
}

const categories = ["Medizin", "Informatik", "Sprachen", "Geschichte", "Mathematik", "Biologie", "Andere"];
const colors = [
  { label: "Rot", value: "bg-rose-500" },
  { label: "Blau", value: "bg-blue-500" },
  { label: "Grün", value: "bg-emerald-500" },
  { label: "Gelb", value: "bg-yellow-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Orange", value: "bg-orange-500" },
];

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Andere");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("bg-violet-500");
  const [cards, setCards] = useState<CardEntry[]>([
    { id: "1", front: "", back: "" },
    { id: "2", front: "", back: "" },
  ]);
  const [saved, setSaved] = useState(false);

  const addCard = () => {
    setCards((prev) => [
      ...prev,
      { id: Date.now().toString(), front: "", back: "" },
    ]);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 1) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCard = (id: string, field: "front" | "back", value: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    if (!title.trim()) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filledCards = cards.filter((c) => c.front.trim() && c.back.trim());
  const isValid = title.trim().length > 0 && filledCards.length >= 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/decks">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Neues Deck erstellen</h2>
        </div>
        <Button onClick={handleSave} disabled={!isValid} className="gap-2">
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Gespeichert!
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Deck speichern
            </>
          )}
        </Button>
      </div>

      {/* Deck Info */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Deck-Informationen</h3>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Anatomie – Organe"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Beschreibung</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Inhalts"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>

          {/* Emoji + Category */}
          <div className="flex gap-4">
            <div className="w-28">
              <label className="mb-1.5 block text-sm font-medium">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-center text-lg outline-none ring-offset-background transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium">Farbe</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`h-7 w-7 rounded-full ${c.value} transition-all ${
                    color === c.value ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vorschau</p>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-xl`}>
                {emoji || "📚"}
              </div>
              <div>
                <p className="font-semibold">{title || "Deck-Titel"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">{category}</Badge>
                  <span className="text-xs text-muted-foreground">{filledCards.length} Karten</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Karten{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({filledCards.length} ausgefüllt)
            </span>
          </h3>
        </div>

        {cards.map((card, i) => (
          <Card key={card.id} className="border">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Karte {i + 1}</span>
                <button
                  onClick={() => removeCard(card.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  disabled={cards.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    VORDERSEITE (Frage)
                  </label>
                  <textarea
                    value={card.front}
                    onChange={(e) => updateCard(card.id, "front", e.target.value)}
                    placeholder="Frage eingeben..."
                    rows={3}
                    className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    RÜCKSEITE (Antwort)
                  </label>
                  <textarea
                    value={card.back}
                    onChange={(e) => updateCard(card.id, "back", e.target.value)}
                    placeholder="Antwort eingeben..."
                    rows={3}
                    className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Card Button */}
        <button
          onClick={addCard}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted py-4 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Karte hinzufügen
        </button>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={!isValid} size="lg" className="gap-2">
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Gespeichert!
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Deck speichern ({filledCards.length} Karten)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
