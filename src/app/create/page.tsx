"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Zap,
  CheckCircle2,
  AlignLeft,
  Type,
  Image as ImageIcon,
  Eye,
  EyeOff,
  MousePointer,
  X,
  FolderPlus,
  FolderOpen,
  GripHorizontal,
  Lock,
  Sparkles,
  Upload,
  Repeat2,
  ChevronDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardType, OcclusionArea, Deck, Card as DeckCard } from "@/lib/data";
import { getAllDecks, createUserDeck, addCardsToDeck } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

type DisplayType = "basic" | "basic-reversed" | "cloze" | "image-occlusion";

interface BasicCard { id: string; type: "basic"; front: string; back: string; image?: string; reversed?: boolean }
interface ClozeCard  { id: string; type: "cloze";  text: string }
interface OccCard    { id: string; type: "image-occlusion"; imageUrl: string; areas: OcclusionArea[] }
type AnyCard = BasicCard | ClozeCard | OccCard;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function convertToStoredCards(c: AnyCard, index: number): DeckCard[] {
  const id = `${Date.now()}_${index}`;
  if (c.type === "basic") {
    const b = c as BasicCard;
    const forward: DeckCard = { id, type: "basic", front: b.front, back: b.back, backImageUrl: b.image, status: "new" };
    if (b.reversed) {
      const backward: DeckCard = { id: `${id}_r`, type: "basic", front: b.back, back: b.front, backImageUrl: b.image, status: "new" };
      return [forward, backward];
    }
    return [forward];
  }
  if (c.type === "cloze") {
    return [{ id, type: "cloze", front: (c as ClozeCard).text, back: "", status: "new" }];
  }
  const o = c as OccCard;
  return [{ id, type: "image-occlusion", front: "", back: "", imageUrl: o.imageUrl, occlusionAreas: o.areas, status: "new" }];
}

// ─── Type Switcher ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { id: DisplayType; icon: React.ElementType; label: string; color: string }[] = [
  { id: "basic",           icon: AlignLeft, label: "Einfach",            color: "text-violet-500" },
  { id: "basic-reversed",  icon: Repeat2,   label: "Einfach & Rückwärts", color: "text-blue-500"   },
  { id: "cloze",           icon: Type,      label: "Lückentext",         color: "text-amber-500"  },
  { id: "image-occlusion", icon: ImageIcon, label: "Bild-Okklusion",     color: "text-emerald-500"},
];

function TypeSwitcher({ currentType, onTypeChange }: {
  currentType: DisplayType;
  onTypeChange: (t: DisplayType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = TYPE_OPTIONS.find(t => t.id === currentType)!;
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Kartentyp ändern"
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icon className={cn("h-3.5 w-3.5", current.color)} />
        <span>{current.label}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl">
          {TYPE_OPTIONS.map(({ id, icon: OptionIcon, label, color }) => (
            <button
              key={id}
              onClick={() => { onTypeChange(id); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent",
                id === currentType && "bg-accent text-foreground",
              )}
            >
              <OptionIcon className={cn("h-3.5 w-3.5 shrink-0", color)} />
              {label}
              {id === "basic-reversed" && (
                <span className="ml-auto text-[10px] text-muted-foreground opacity-70">Reverse</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const categories = ["Medizin", "Informatik", "Sprachen", "Geschichte", "Mathematik", "Biologie", "Andere"];

const noteTypes: { id: CardType; icon: React.ElementType; label: string; desc: string; badge?: string }[] = [
  { id: "basic",           icon: AlignLeft, label: "Einfach",        desc: "Begriff → Definition" },
  { id: "cloze",           icon: Type,      label: "Lückentext",     desc: "Text mit Lücken",      badge: "Neu" },
  { id: "image-occlusion", icon: ImageIcon, label: "Bild-Okklusion", desc: "Bildbereiche verdecken", badge: "Neu" },
];

// ─── Sortable wrapper ─────────────────────────────────────────────────────────

function SortableCardWrapper({ id, children }: {
  id: string;
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// ─── Quizlet-style Basic Card Row ─────────────────────────────────────────────

interface ImageResult { thumb: string; full: string; title: string }

function BasicCardRow({ card, onChange, onRemove, onTypeChange, index, canRemove, dragHandleProps }: {
  card: BasicCard; onChange: (c: BasicCard) => void; onRemove: () => void; onTypeChange: (t: DisplayType) => void; index: number; canRemove: boolean; dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ImageResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Prefill search query when picker opens
  const openPicker = () => {
    setSearchQuery(card.front || "");
    setSearchResults([]);
    setPickerOpen(true);
  };

  // Search Wikimedia Commons images
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.images ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Auto-search when picker opens with a term
  useEffect(() => {
    if (pickerOpen && searchQuery) runSearch(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen]);

  // File input change
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange({ ...card, image: ev.target?.result as string });
      setPickerOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const selectResult = (img: ImageResult) => {
    onChange({ ...card, image: img.full });
    setPickerOpen(false);
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ ...card, image: undefined });
  };

  return (
    <div className="rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{index + 1}</span>
          <TypeSwitcher currentType={card.reversed ? "basic-reversed" : "basic"} onTypeChange={onTypeChange} />
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span {...dragHandleProps} className="cursor-grab touch-none select-none">
            <GripHorizontal className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
          </span>
          <button
            onClick={onRemove}
            disabled={!canRemove}
            className="transition-colors hover:text-destructive disabled:opacity-20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-6 px-5 py-5">
        {/* VORDERSEITE */}
        <div>
          <input
            value={card.front}
            onChange={(e) => onChange({ ...card, front: e.target.value })}
            placeholder=" "
            className="w-full border-0 border-b-2 border-muted bg-transparent pb-1.5 text-sm outline-none transition-colors focus:border-primary"
          />
          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Vorderseite
          </label>
        </div>

        {/* RÜCKSEITE */}
        <div>
          <input
            value={card.back}
            onChange={(e) => onChange({ ...card, back: e.target.value })}
            placeholder=" "
            className="w-full border-0 border-b-2 border-muted bg-transparent pb-1.5 text-sm outline-none transition-colors focus:border-primary"
          />
          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Rückseite
          </label>
        </div>

        {/* Bild-Thumbnail */}
        <div className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

          {card.image ? (
            <div className="group relative h-full w-full cursor-pointer" onClick={openPicker} title="Klicken zum Ändern">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt="Bild" className="h-full w-full rounded-xl object-cover" />
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
              <button
                onClick={removeImage}
                title="Bild entfernen"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow hover:scale-110 transition-transform"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              title="Bild hinzufügen"
              onClick={openPicker}
              className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">Bild</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Image Picker Panel ── */}
      {pickerOpen && (
        <div className="border-t bg-muted/30 px-5 pb-5 pt-4">
          {/* Search row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex flex-1 items-center gap-2 rounded-xl border bg-background px-3 py-2 focus-within:border-primary transition-colors">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(searchQuery); }}
                placeholder="Bild suchen…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => runSearch(searchQuery)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Suchen
              </button>
            </div>
            <span className="text-xs text-muted-foreground">oder</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Hochladen
            </button>
          </div>

          {/* Results grid */}
          {searching ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground animate-pulse">
              Suche läuft…
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {searchResults.map((img, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(img)}
                  title={img.title}
                  className="group relative aspect-square overflow-hidden rounded-xl border-2 border-transparent bg-muted transition-all hover:border-primary hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb} alt={img.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </button>
              ))}
            </div>
          ) : searchResults !== null && !searching ? (
            <div className="flex h-20 items-center justify-center rounded-xl bg-muted/50 text-xs text-muted-foreground">
              Suche nach einem Begriff, um Bilder zu finden
            </div>
          ) : null}

          {/* Close */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setPickerOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ↑ Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cloze Card Row ───────────────────────────────────────────────────────────

function ClozeCardRow({ card, onChange, onRemove, onTypeChange, index, canRemove, dragHandleProps }: {
  card: ClozeCard; onChange: (c: ClozeCard) => void; onRemove: () => void; onTypeChange: (t: DisplayType) => void; index: number; canRemove: boolean; dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const markAsBlank = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const selected = card.text.slice(start, end);
    const existing = [...card.text.matchAll(/\{\{c(\d+)::/g)].map((m) => parseInt(m[1]));
    const nextNum = existing.length ? Math.max(...existing) + 1 : 1;
    const newText = card.text.slice(0, start) + `{{c${nextNum}::${selected}}}` + card.text.slice(end);
    onChange({ ...card, text: newText });
  };

  const removeLastBlank = () => {
    const newText = card.text.replace(/\{\{c\d+::([^}]+)\}\}(?=[^{]*$)/, "$1");
    onChange({ ...card, text: newText });
  };

  const { count } = parseCloze(card.text);

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{index + 1}</span>
          <TypeSwitcher currentType="cloze" onTypeChange={onTypeChange} />
          {count > 0 && <Badge variant="secondary" className="text-xs">{count} Lücke{count !== 1 ? "n" : ""}</Badge>}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <button onClick={() => setShowPreview((p) => !p)} className="flex items-center gap-1 text-xs hover:text-foreground">
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Vorschau
          </button>
          <span {...dragHandleProps} className="cursor-grab touch-none select-none">
            <GripHorizontal className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
          </span>
          <button onClick={onRemove} disabled={!canRemove} className="hover:text-destructive disabled:opacity-20">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-2.5 text-xs text-primary">
          Text eingeben → Wort markieren → „Als Lücke markieren"
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={markAsBlank} className="h-7 gap-1 text-xs rounded-full">
            <Type className="h-3 w-3" />Als Lücke markieren
          </Button>
          {count > 0 && (
            <Button size="sm" variant="ghost" onClick={removeLastBlank} className="h-7 gap-1 text-xs text-muted-foreground rounded-full">
              <X className="h-3 w-3" />Letzte Lücke entfernen
            </Button>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={card.text}
          onChange={(e) => onChange({ ...card, text: e.target.value })}
          placeholder="Text eingeben, dann Wörter markieren und als Lücke setzen..."
          rows={3}
          className="w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        />
        {showPreview && card.text && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Vorschau</p>
            <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: clozePreview(card.text) }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Image Occlusion Card Row ─────────────────────────────────────────────────

function ImageOcclusionCardRow({ card, onChange, onRemove, onTypeChange, index, canRemove, dragHandleProps }: {
  card: OccCard; onChange: (c: OccCard) => void; onRemove: () => void; onTypeChange: (t: DisplayType) => void; index: number; canRemove: boolean; dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ ...card, imageUrl: ev.target?.result as string, areas: [] });
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
    setCurrentRect({ x: Math.min(startPos.x, pos.x), y: Math.min(startPos.y, pos.y), w: Math.abs(pos.x - startPos.x), h: Math.abs(pos.y - startPos.y) });
  };

  const onMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 2 && currentRect.h > 2) {
      const newArea: OcclusionArea = { id: Date.now().toString(), ...currentRect, label: `Bereich ${card.areas.length + 1}` };
      onChange({ ...card, areas: [...card.areas, newArea] });
    }
    setCurrentRect(null);
  };

  const removeArea = (id: string) => onChange({ ...card, areas: card.areas.filter((a) => a.id !== id) });
  const areaColors = ["bg-violet-500/70", "bg-rose-500/70", "bg-blue-500/70", "bg-emerald-500/70", "bg-amber-500/70", "bg-pink-500/70"];

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{index + 1}</span>
          <TypeSwitcher currentType="image-occlusion" onTypeChange={onTypeChange} />
          {card.areas.length > 0 && <Badge variant="secondary" className="text-xs">{card.areas.length} Bereich{card.areas.length !== 1 ? "e" : ""}</Badge>}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span {...dragHandleProps} className="cursor-grab touch-none select-none">
            <GripHorizontal className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
          </span>
          <button onClick={onRemove} disabled={!canRemove} className="hover:text-destructive disabled:opacity-20">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5">
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
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 flex items-start gap-2">
              <MousePointer className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Ziehe Rechtecke über Bildbereiche, die du verbergen möchtest.</span>
            </div>
            <div ref={canvasRef} className="relative select-none overflow-hidden rounded-xl border cursor-crosshair"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
              onMouseLeave={() => { setIsDrawing(false); setCurrentRect(null); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.imageUrl} alt="Okklusions-Bild" className="w-full pointer-events-none select-none" draggable={false} />
              {card.areas.map((area, i) => (
                <div key={area.id} className={`absolute flex items-center justify-center rounded ${areaColors[i % areaColors.length]} border-2 border-white/50 group`}
                  style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.w}%`, height: `${area.h}%` }}>
                  <span className="text-[11px] font-bold text-white drop-shadow">{i + 1}</span>
                  <button onMouseDown={(e) => { e.stopPropagation(); removeArea(area.id); }}
                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {currentRect && currentRect.w > 1 && (
                <div className="absolute rounded border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
                  style={{ left: `${currentRect.x}%`, top: `${currentRect.y}%`, width: `${currentRect.w}%`, height: `${currentRect.h}%` }} />
              )}
            </div>
            {card.areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.areas.map((area, i) => (
                  <div key={area.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white ${areaColors[i % areaColors.length].replace("/70", "")}`}>
                    {i + 1} · {area.label}
                    <button onClick={() => removeArea(area.id)} className="ml-0.5 opacity-80 hover:opacity-100"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ImageIcon className="h-3.5 w-3.5" />Anderes Bild wählen
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Smart Assist Panel ───────────────────────────────────────────────────────

function SmartAssistPanel({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const MAX = 100000;

  return (
    <div className="fixed right-4 top-[72px] z-40 w-80 overflow-hidden rounded-2xl border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold">KI-Assistent</span>
          <Badge className="text-[10px] px-1.5 py-0">Beta</Badge>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX))}
            placeholder={'Gib einen Prompt ein (z. B. „Photosynthese zusammenfassen"), füge Notizen ein oder lade ein Dokument hoch, um Karteikarten zu erstellen.'}
            rows={8}
            className="w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
          <span className="absolute bottom-3 right-3 text-[11px] text-muted-foreground">
            {prompt.length.toLocaleString("de-DE")}/{MAX.toLocaleString("de-DE")}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2 rounded-full text-sm">
            <Upload className="h-3.5 w-3.5" />
            Hochladen
          </Button>
          <Button
            disabled={!prompt.trim()}
            className="flex-1 rounded-full text-sm"
          >
            Starten
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Verbessert durch KI{" "}
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-[9px] font-bold">i</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreatePage() {
  return (
    <Suspense>
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── Mode ──
  const [mode, setMode] = useState<"new" | "add">("new");

  // ── Deck fields ──
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]     = useState("Andere");
  const [emoji, setEmoji]           = useState("📚");
  const color                        = "bg-violet-500";

  // ── Add-to-existing ──
  const [allDecks, setAllDecks]             = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");

  // ── Cards ──
  const [activeNoteType, setActiveNoteType] = useState<CardType>("basic");
  const [cards, setCards] = useState<AnyCard[]>([
    { id: "1", type: "basic", front: "", back: "" },
    { id: "2", type: "basic", front: "", back: "" },
  ]);

  // ── UI state ──
  const [saved, setSaved]             = useState(false);
  const [savedMsg, setSavedMsg]       = useState("");
  const [smartAssistOpen, setSmartAssistOpen] = useState(false);
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);

  useEffect(() => {
    const loaded     = getAllDecks();
    const deckIdParam = searchParams.get("deckId");
    const modeParam   = searchParams.get("mode");
    setAllDecks(loaded);
    if (deckIdParam) {
      setMode("add");
      setSelectedDeckId(deckIdParam);
    } else {
      if (modeParam === "add") setMode("add");
      if (loaded.length > 0) setSelectedDeckId(loaded[0].id);
    }
  }, [searchParams]);

  // ── Card helpers ──
  const addCard = () => {
    const id = Date.now().toString();
    if (activeNoteType === "basic")
      setCards((p) => [...p, { id, type: "basic", front: "", back: "" }]);
    else if (activeNoteType === "cloze")
      setCards((p) => [...p, { id, type: "cloze", text: "" }]);
    else
      setCards((p) => [...p, { id, type: "image-occlusion", imageUrl: "", areas: [] }]);
  };

  const removeCard = (id: string) => { if (cards.length <= 1) return; setCards((p) => p.filter((c) => c.id !== id)); };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const reorderCards = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCards((prev) => {
        const oldIdx = prev.findIndex((c) => c.id === active.id);
        const newIdx = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const switchCardType = useCallback((id: string, newType: DisplayType) => {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (newType === "basic")          return { id, type: "basic" as const, front: "", back: "" };
      if (newType === "basic-reversed") return { id, type: "basic" as const, front: (c as BasicCard).front ?? "", back: (c as BasicCard).back ?? "", reversed: true };
      if (newType === "cloze")          return { id, type: "cloze" as const, text: "" };
      return { id, type: "image-occlusion" as const, imageUrl: "", areas: [] };
    }));
  }, []);;
  const updateCard  = useCallback((updated: AnyCard) => { setCards((p) => p.map((c) => (c.id === updated.id ? updated : c))); }, []);

  const filledCards = cards.filter((c) => {
    if (c.type === "basic")           return (c as BasicCard).front.trim() && (c as BasicCard).back.trim();
    if (c.type === "cloze")           return (c as ClozeCard).text.includes("{{c");
    if (c.type === "image-occlusion") return (c as OccCard).imageUrl && (c as OccCard).areas.length > 0;
    return false;
  });

  const isValid = mode === "new"
    ? title.trim().length > 0 && filledCards.length >= 1
    : selectedDeckId !== "" && filledCards.length >= 1;

  // ── Save ──
  const doSave = (): string | null => {
    if (!isValid) return null;
    const convertedCards: DeckCard[] = filledCards.flatMap(convertToStoredCards);

    if (mode === "new") {
      const newId = `user-${Date.now()}`;
      const newDeck: Deck = {
        id: newId,
        title: title.trim(),
        description: description.trim(),
        category,
        color,
        emoji,
        masteredCount: 0,
        cards: convertedCards,
      };
      createUserDeck(newDeck);
      setSavedMsg(`Deck „${title.trim()}" mit ${convertedCards.length} Karten erstellt!`);
      setTitle("");
      setDescription("");
      setCards([{ id: "1", type: "basic", front: "", back: "" }, { id: "2", type: "basic", front: "", back: "" }]);
      setAllDecks(getAllDecks());
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      return newId;
    } else {
      addCardsToDeck(selectedDeckId, convertedCards);
      const deck = allDecks.find((d) => d.id === selectedDeckId);
      setSavedMsg(`${convertedCards.length} Karte${convertedCards.length !== 1 ? "n" : ""} zu „${deck?.title ?? "Deck"}" hinzugefügt!`);
      setCards([{ id: "1", type: "basic", front: "", back: "" }, { id: "2", type: "basic", front: "", back: "" }]);
      setAllDecks(getAllDecks());
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      return selectedDeckId;
    }
  };

  const handleSave = () => {
    const id = doSave();
    setSavedDeckId(id);
  };

  const handleSaveAndStudy = () => {
    const id = doSave();
    if (id) router.push(`/study/${id}`);
  };

  const selectedDeck = allDecks.find((d) => d.id === selectedDeckId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Neues Lernset erstellen</h1>
          {mode === "add" && selectedDeck && (
            <p className="mt-1 text-sm text-muted-foreground">
              Zu <span className="font-semibold">{selectedDeck.emoji} {selectedDeck.title}</span> hinzufügen
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setSmartAssistOpen((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
              smartAssistOpen
                ? "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            KI-Assistent
            <Badge className="text-[9px] px-1 py-px ml-0.5">Beta</Badge>
          </button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!isValid}
            className="rounded-full px-5"
          >
            {saved ? <><CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-500" />Gespeichert</> : "Erstellen"}
          </Button>
          <Button
            onClick={handleSaveAndStudy}
            disabled={!isValid}
            className="rounded-full px-5 gap-2"
          >
            <Zap className="h-4 w-4" />
            Erstellen &amp; üben
          </Button>
        </div>
      </div>

      {/* ── Success banner ── */}
      {saved && savedMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMsg}</span>
          {savedDeckId && (
            <Link href={`/study/${savedDeckId}`} className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:opacity-80">
              Jetzt üben →
            </Link>
          )}
        </div>
      )}

      {/* ── Mode switcher / Selected deck ── */}
      {mode === "add" && selectedDeckId ? (
        (() => {
          const selectedDeck = allDecks.find((d) => d.id === selectedDeckId);
          return (
            <button
              onClick={() => setSelectedDeckId(null)}
              className="flex w-full items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted/40 transition-all"
            >
              <FolderOpen className="h-4 w-4 text-primary shrink-0" />
              <span>{selectedDeck?.emoji}</span>
              <span className="font-semibold truncate">{selectedDeck?.title}</span>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">ändern</span>
            </button>
          );
        })()
      ) : (
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setMode("new")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
              mode === "new" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FolderPlus className="h-4 w-4" />
            Neues Deck
          </button>
          <button
            onClick={() => setMode("add")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
              mode === "add" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FolderOpen className="h-4 w-4" />
            Zu bestehendem Deck
          </button>
        </div>
      )}

      {/* ── NEW: Deck title + meta (collapsed, minimal) ── */}
      {mode === "new" && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
              className="w-14 shrink-0 rounded-xl border bg-background px-2 py-2.5 text-center text-xl outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel des Lernsets *"
              className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-40 shrink-0 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kurze Beschreibung (optional)"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>
      )}

      {/* ── ADD: Deck Picker ── */}
      {mode === "add" && !selectedDeckId && (
        <div className="rounded-2xl border bg-card p-5">
          {allDecks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Decks —{" "}
              <button onClick={() => setMode("new")} className="text-primary underline">Neues Deck erstellen</button>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    selectedDeckId === deck.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/30 hover:bg-muted/40"
                  )}
                >
                  <span className="text-lg">{deck.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-xs">{deck.title}</p>
                    <p className="text-[11px] text-muted-foreground">{deck.cards.length} Karten</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ── Cards ── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderCards}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {cards.map((card, i) => (
              <SortableCardWrapper key={card.id} id={card.id}>
                {(dragHandleProps) => {
                  if (card.type === "basic")
                    return (
                      <BasicCardRow
                        card={card as BasicCard}
                        index={i}
                        canRemove={cards.length > 1}
                        onChange={(c) => updateCard(c)}
                        onRemove={() => removeCard(card.id)}
                        onTypeChange={(t) => switchCardType(card.id, t)}
                        dragHandleProps={dragHandleProps}
                      />
                    );
                  if (card.type === "cloze")
                    return (
                      <ClozeCardRow
                        card={card as ClozeCard}
                        index={i}
                        canRemove={cards.length > 1}
                        onChange={(c) => updateCard(c)}
                        onRemove={() => removeCard(card.id)}
                        onTypeChange={(t) => switchCardType(card.id, t)}
                        dragHandleProps={dragHandleProps}
                      />
                    );
                  if (card.type === "image-occlusion")
                    return (
                      <ImageOcclusionCardRow
                        card={card as OccCard}
                        index={i}
                        canRemove={cards.length > 1}
                        onChange={(c) => updateCard(c)}
                        onRemove={() => removeCard(card.id)}
                        onTypeChange={(t) => switchCardType(card.id, t)}
                        dragHandleProps={dragHandleProps}
                      />
                    );
                  return null;
                }}
              </SortableCardWrapper>
            ))}

            {/* Add card */}
            <button
              onClick={addCard}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted py-5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Karte hinzufügen
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {/* ── Bottom save ── */}
      <div className="flex items-center justify-between rounded-2xl border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          {filledCards.length === 0
            ? "Keine ausgefüllten Karten"
            : `${filledCards.length} Karte${filledCards.length !== 1 ? "n" : ""} bereit`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={!isValid} className="rounded-full">
            Erstellen
          </Button>
          <Button onClick={handleSaveAndStudy} disabled={!isValid} className="gap-2 rounded-full">
            <Zap className="h-4 w-4" />
            Erstellen &amp; üben
          </Button>
        </div>
      </div>

      {/* ── Smart Assist Panel ── */}
      {smartAssistOpen && <SmartAssistPanel onClose={() => setSmartAssistOpen(false)} />}
    </div>
  );
}
