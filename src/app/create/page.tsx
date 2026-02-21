"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Zap, CheckCircle2,
  AlignLeft, Type, Image as ImageIcon, Eye, EyeOff,
  MousePointer, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CardType, OcclusionArea } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasicCard { id: string; type: "basic"; front: string; back: string }
interface ClozeCard  { id: string; type: "cloze";  text: string }
interface OccCard    { id: string; type: "image-occlusion"; imageUrl: string; areas: OcclusionArea[] }
type AnyCard = BasicCard | ClozeCard | OccCard;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse {{c1::word}} → render with blanks */
function parseCloze(text: string): { html: string; count: number } {
  let count = 0;
  const html = text.replace(/\{\{c(\d+)::([^}]+)\}\}/g, (_m, _n, word) => {
    count++;
    return `<mark class="cloze-blank" data-answer="${word}">[${word}]</mark>`;
  });
  return { html, count };
}

function clozePreview(text: string) {
  return text.replace(/\{\{c(\d+)::([^}]+)\}\}/g, (_m, _n, word) =>
    `<span class="inline-block rounded bg-primary/15 px-1 font-semibold text-primary">[${word}]</span>`
  );
}

const categories = ["Medizin", "Informatik", "Sprachen", "Geschichte", "Mathematik", "Biologie", "Andere"];
const colors = [
  { label: "Violet", value: "bg-violet-500" },
  { label: "Blau",   value: "bg-blue-500"   },
  { label: "Grün",   value: "bg-emerald-500" },
  { label: "Rot",    value: "bg-rose-500"    },
  { label: "Gelb",   value: "bg-yellow-500"  },
  { label: "Orange", value: "bg-orange-500"  },
];

// ─── Note Type Card ───────────────────────────────────────────────────────────

const noteTypes: { id: CardType; icon: React.ElementType; label: string; desc: string; badge?: string }[] = [
  { id: "basic",           icon: AlignLeft,  label: "Einfach",         desc: "Vorderseite → Rückseite" },
  { id: "cloze",           icon: Type,       label: "Lückentext",      desc: "Text mit Lücken zum Ausfüllen", badge: "Neu" },
  { id: "image-occlusion", icon: ImageIcon,  label: "Bild-Okklusion",  desc: "Bildbereiche verdecken & aufdecken", badge: "Neu" },
];

// ─── Basic Card Editor ────────────────────────────────────────────────────────

function BasicEditor({ card, onChange, onRemove, index, canRemove }: {
  card: BasicCard; onChange: (c: BasicCard) => void; onRemove: () => void; index: number; canRemove: boolean
}) {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Karte {index + 1} · Einfach</span>
          <button onClick={onRemove} disabled={!canRemove} className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">VORDERSEITE (Frage)</label>
            <textarea
              value={card.front}
              onChange={e => onChange({ ...card, front: e.target.value })}
              placeholder="Frage eingeben..."
              rows={3}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">RÜCKSEITE (Antwort)</label>
            <textarea
              value={card.back}
              onChange={e => onChange({ ...card, back: e.target.value })}
              placeholder="Antwort eingeben..."
              rows={3}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Cloze Editor ─────────────────────────────────────────────────────────────

function ClozeEditor({ card, onChange, onRemove, index, canRemove }: {
  card: ClozeCard; onChange: (c: ClozeCard) => void; onRemove: () => void; index: number; canRemove: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const markAsBlank = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return; // nothing selected

    const selected = card.text.slice(start, end);
    // find next cloze number
    const existing = [...card.text.matchAll(/\{\{c(\d+)::/g)].map(m => parseInt(m[1]));
    const nextNum = existing.length ? Math.max(...existing) + 1 : 1;

    const newText =
      card.text.slice(0, start) +
      `{{c${nextNum}::${selected}}}` +
      card.text.slice(end);
    onChange({ ...card, text: newText });
  };

  const removeLastBlank = () => {
    const newText = card.text.replace(/\{\{c\d+::([^}]+)\}\}(?=[^{]*$)/, '$1');
    onChange({ ...card, text: newText });
  };

  const { count } = parseCloze(card.text);

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Karte {index + 1} · Lückentext</span>
            {count > 0 && (
              <Badge variant="secondary" className="text-xs">{count} Lücke{count !== 1 ? "n" : ""}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(p => !p)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Vorschau
            </button>
            <button onClick={onRemove} disabled={!canRemove} className="text-muted-foreground hover:text-destructive disabled:opacity-30">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Instruction */}
        <div className="mb-3 rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs text-primary">
          <strong>So geht's:</strong> Text eingeben → gewünschtes Wort markieren → "Als Lücke markieren" klicken
        </div>

        {/* Toolbar */}
        <div className="mb-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={markAsBlank} className="h-7 gap-1 text-xs">
            <Type className="h-3 w-3" />
            Als Lücke markieren
          </Button>
          {count > 0 && (
            <Button size="sm" variant="ghost" onClick={removeLastBlank} className="h-7 gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3" />
              Letzte Lücke entfernen
            </Button>
          )}
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={card.text}
          onChange={e => onChange({ ...card, text: e.target.value })}
          placeholder="Text eingeben, dann Wörter markieren und als Lücke setzen..."
          rows={4}
          className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        />

        {/* Preview */}
        {showPreview && card.text && (
          <div className="mt-3 rounded-lg border bg-muted/30 p-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Vorschau (wie es beim Lernen aussieht)</p>
            <p
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: clozePreview(card.text) }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Image Occlusion Editor ───────────────────────────────────────────────────

function ImageOcclusionEditor({ card, onChange, onRemove, index, canRemove }: {
  card: OccCard; onChange: (c: OccCard) => void; onRemove: () => void; index: number; canRemove: boolean
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange({ ...card, imageUrl: ev.target?.result as string, areas: [] });
    reader.readAsDataURL(file);
  };

  const getRelativePos = (e: React.MouseEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const pos = getRelativePos(e, canvasRef.current);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const pos = getRelativePos(e, canvasRef.current);
    setCurrentRect({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  };

  const onMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 2 && currentRect.h > 2) {
      const newArea: OcclusionArea = {
        id: Date.now().toString(),
        ...currentRect,
        label: `Bereich ${card.areas.length + 1}`,
      };
      onChange({ ...card, areas: [...card.areas, newArea] });
    }
    setCurrentRect(null);
  };

  const removeArea = (id: string) =>
    onChange({ ...card, areas: card.areas.filter(a => a.id !== id) });

  const areaColors = [
    "bg-violet-500/70", "bg-rose-500/70", "bg-blue-500/70",
    "bg-emerald-500/70", "bg-amber-500/70", "bg-pink-500/70",
  ];

  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Karte {index + 1} · Bild-Okklusion</span>
            {card.areas.length > 0 && (
              <Badge variant="secondary" className="text-xs">{card.areas.length} Bereich{card.areas.length !== 1 ? "e" : ""}</Badge>
            )}
          </div>
          <button onClick={onRemove} disabled={!canRemove} className="text-muted-foreground hover:text-destructive disabled:opacity-30">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {!card.imageUrl ? (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted py-10 hover:border-primary/50 hover:bg-primary/5 transition-all">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Bild hochladen</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG oder GIF</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <div className="space-y-3">
            {/* Instruction */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 flex items-start gap-2">
              <MousePointer className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Ziehe Rechtecke über Bildbereiche, die du verbergen möchtest. Beim Lernen werden diese Bereiche ausgeblendet.</span>
            </div>

            {/* Image + Drawing Canvas */}
            <div
              ref={canvasRef}
              className="relative select-none overflow-hidden rounded-xl border cursor-crosshair"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => { setIsDrawing(false); setCurrentRect(null); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.imageUrl} alt="Okklusions-Bild" className="w-full pointer-events-none select-none" draggable={false} />

              {/* Existing occlusion areas */}
              {card.areas.map((area, i) => (
                <div
                  key={area.id}
                  className={`absolute flex items-center justify-center rounded ${areaColors[i % areaColors.length]} border-2 border-white/50 group`}
                  style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%` }}
                >
                  <span className="text-[11px] font-bold text-white drop-shadow">{i + 1}</span>
                  <button
                    onMouseDown={e => { e.stopPropagation(); removeArea(area.id); }}
                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}

              {/* Current drawing rect */}
              {currentRect && currentRect.w > 1 && (
                <div
                  className="absolute rounded border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
                  style={{ left: `${currentRect.x}%`, top: `${currentRect.y}%`, width: `${currentRect.w}%`, height: `${currentRect.h}%` }}
                />
              )}
            </div>

            {/* Area list */}
            {card.areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.areas.map((area, i) => (
                  <div key={area.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white ${areaColors[i % areaColors.length].replace("/70", "")}`}>
                    {i + 1} · {area.label}
                    <button onClick={() => removeArea(area.id)} className="ml-0.5 opacity-80 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Replace image */}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ImageIcon className="h-3.5 w-3.5" />
              Anderes Bild wählen
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Andere");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("bg-violet-500");
  const [activeNoteType, setActiveNoteType] = useState<CardType>("basic");
  const [cards, setCards] = useState<AnyCard[]>([
    { id: "1", type: "basic", front: "", back: "" },
    { id: "2", type: "basic", front: "", back: "" },
  ]);
  const [saved, setSaved] = useState(false);

  const addCard = () => {
    const id = Date.now().toString();
    if (activeNoteType === "basic")
      setCards(p => [...p, { id, type: "basic", front: "", back: "" }]);
    else if (activeNoteType === "cloze")
      setCards(p => [...p, { id, type: "cloze", text: "" }]);
    else
      setCards(p => [...p, { id, type: "image-occlusion", imageUrl: "", areas: [] }]);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 1) return;
    setCards(p => p.filter(c => c.id !== id));
  };

  const updateCard = useCallback((updated: AnyCard) => {
    setCards(p => p.map(c => (c.id === updated.id ? updated : c)));
  }, []);

  const filledCards = cards.filter(c => {
    if (c.type === "basic") return (c as BasicCard).front.trim() && (c as BasicCard).back.trim();
    if (c.type === "cloze") return (c as ClozeCard).text.includes("{{c");
    if (c.type === "image-occlusion") return (c as OccCard).imageUrl && (c as OccCard).areas.length > 0;
    return false;
  });

  const isValid = title.trim().length > 0 && filledCards.length >= 1;

  const handleSave = () => {
    if (!isValid) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/"><ArrowLeft className="mr-1 h-4 w-4" />Zurück</Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Neues Deck erstellen</h2>
        </div>
        <Button onClick={handleSave} disabled={!isValid} className="gap-2">
          {saved ? <><CheckCircle2 className="h-4 w-4" />Gespeichert!</> : <><Zap className="h-4 w-4" />Deck speichern</>}
        </Button>
      </div>

      {/* Deck Info */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Deck-Informationen</h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Titel *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Anatomie – Organe"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Beschreibung</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" />
          </div>

          <div className="flex gap-4">
            <div className="w-28">
              <label className="mb-1.5 block text-sm font-medium">Emoji</label>
              <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-center text-lg outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium">Kategorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Farbe</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                  className={`h-7 w-7 rounded-full ${c.value} transition-all ${color === c.value ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"}`} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vorschau</p>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-xl`}>{emoji || "📚"}</div>
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

      {/* ── Note Type Selector ── */}
      <div>
        <h3 className="mb-3 font-semibold">Notiztyp wählen</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {noteTypes.map(nt => {
            const Icon = nt.icon;
            const isActive = activeNoteType === nt.id;
            return (
              <button
                key={nt.id}
                onClick={() => setActiveNoteType(nt.id)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                {nt.badge && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {nt.badge}
                  </span>
                )}
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? "bg-primary" : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isActive ? "text-primary" : ""}`}>{nt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{nt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Karten
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filledCards.length} ausgefüllt)</span>
          </h3>
        </div>

        {cards.map((card, i) => {
          if (card.type === "basic")
            return <BasicEditor key={card.id} card={card as BasicCard} index={i} canRemove={cards.length > 1}
              onChange={c => updateCard(c)} onRemove={() => removeCard(card.id)} />;
          if (card.type === "cloze")
            return <ClozeEditor key={card.id} card={card as ClozeCard} index={i} canRemove={cards.length > 1}
              onChange={c => updateCard(c)} onRemove={() => removeCard(card.id)} />;
          if (card.type === "image-occlusion")
            return <ImageOcclusionEditor key={card.id} card={card as OccCard} index={i} canRemove={cards.length > 1}
              onChange={c => updateCard(c)} onRemove={() => removeCard(card.id)} />;
          return null;
        })}

        <button onClick={addCard}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted py-4 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary">
          <Plus className="h-4 w-4" />
          {activeNoteType === "basic" ? "Karte" : activeNoteType === "cloze" ? "Lückentext" : "Bild-Okklusion"} hinzufügen
        </button>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={!isValid} size="lg" className="gap-2">
          {saved ? <><CheckCircle2 className="h-4 w-4" />Gespeichert!</> : <><Zap className="h-4 w-4" />Deck speichern ({filledCards.length} Karten)</>}
        </Button>
      </div>
    </div>
  );
}
