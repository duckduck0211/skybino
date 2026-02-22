"use client";

import { useState, useEffect } from "react";
import { Pencil, X, Check, Image as ImageIcon, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Presets ──────────────────────────────────────────────────────────────────

const GRADIENTS = [
  { id: "violet",  label: "Violett",  css: "from-violet-600 via-purple-500 to-indigo-600" },
  { id: "rose",    label: "Rose",     css: "from-rose-500 via-pink-500 to-fuchsia-600" },
  { id: "sky",     label: "Himmel",   css: "from-sky-400 via-cyan-500 to-blue-600" },
  { id: "emerald", label: "Grün",     css: "from-emerald-400 via-teal-500 to-cyan-600" },
  { id: "amber",   label: "Amber",    css: "from-amber-400 via-orange-500 to-red-500" },
  { id: "slate",   label: "Dunkel",   css: "from-slate-700 via-slate-800 to-slate-900" },
  { id: "aurora",  label: "Aurora",   css: "from-indigo-400 via-purple-500 to-pink-500" },
  { id: "forest",  label: "Wald",     css: "from-green-600 via-emerald-600 to-teal-700" },
];

const QUOTES = [
  { text: "Bildung ist nicht das Befüllen eines Eimers, sondern das Entzünden eines Feuers.", author: "William Butler Yeats" },
  { text: "Der Geist ist kein Gefäß, das gefüllt, sondern ein Feuer, das entzündet werden will.", author: "Plutarch" },
  { text: "Man muss das Unmögliche versuchen, um das Mögliche zu erreichen.", author: "Hermann Hesse" },
  { text: "Lerne so, als ob du ewig leben würdest. Lebe so, als ob du morgen sterben würdest.", author: "Mahatma Gandhi" },
  { text: "Wissen ist Macht.", author: "Francis Bacon" },
  { text: "Die Wurzel des Studiums ist bitter, aber seine Früchte sind süß.", author: "Aristoteles" },
  { text: "Du hast ungefähr 4000 Wochen. Was machst du damit?", author: "Oliver Burkeman" },
  { text: "Es kommt nicht darauf an, wie langsam du gehst, solange du nicht anhältst.", author: "Konfuzius" },
];

interface CoverSettings {
  gradientId: string;
  imageUrl: string;
  quoteIndex: number;
  customQuote: string;
  customAuthor: string;
  useCustomQuote: boolean;
}

const DEFAULT: CoverSettings = {
  gradientId: "violet",
  imageUrl: "",
  quoteIndex: 0,
  customQuote: "",
  customAuthor: "",
  useCustomQuote: false,
};

const STORAGE_KEY = "synapze-dashboard-cover";

// ─── Component ────────────────────────────────────────────────────────────────

export function CoverQuoteWidget() {
  const [settings, setSettings] = useState<CoverSettings>(DEFAULT);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CoverSettings>(DEFAULT);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CoverSettings;
      setSettings(parsed);
      setDraft(parsed);
    }
  }, []);

  function save() {
    setSettings(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setEditing(false);
  }

  function cancel() {
    setDraft(settings);
    setEditing(false);
  }

  const gradient = GRADIENTS.find(g => g.id === settings.gradientId) ?? GRADIENTS[0];
  const activeQuote = settings.useCustomQuote && settings.customQuote
    ? { text: settings.customQuote, author: settings.customAuthor || "" }
    : QUOTES[settings.quoteIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Cover background */}
      <div
        className={cn(
          "relative flex min-h-[140px] items-end bg-gradient-to-br",
          gradient.css
        )}
        style={settings.imageUrl ? {
          backgroundImage: `url(${settings.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >
        {/* Dark overlay when image is set */}
        {settings.imageUrl && (
          <div className="absolute inset-0 bg-black/40 rounded-2xl" />
        )}

        {/* Quote */}
        <div className="relative z-10 w-full p-6 pb-5">
          <Quote className="mb-2 h-5 w-5 text-white/40" />
          <p className="text-base font-medium leading-snug text-white drop-shadow">
            {activeQuote.text}
          </p>
          {activeQuote.author && (
            <p className="mt-1.5 text-sm text-white/70">— {activeQuote.author}</p>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={() => { setDraft(settings); setEditing(true); }}
          className="absolute right-3 top-3 z-20 rounded-lg bg-black/20 p-1.5 text-white/70 hover:bg-black/40 hover:text-white transition-all"
          title="Anpassen"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Edit Panel ── */}
      {editing && (
        <div className="border-t bg-popover p-5 space-y-4">
          {/* Gradient picker */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ImageIcon className="inline h-3 w-3 mr-1" />Hintergrund
            </p>
            <div className="flex flex-wrap gap-2">
              {GRADIENTS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setDraft(d => ({ ...d, gradientId: g.id, imageUrl: "" }))}
                  title={g.label}
                  className={cn(
                    "h-7 w-7 rounded-lg bg-gradient-to-br transition-all",
                    g.css,
                    draft.gradientId === g.id && !draft.imageUrl
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "opacity-70 hover:opacity-100"
                  )}
                />
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={draft.imageUrl}
                onChange={e => setDraft(d => ({ ...d, imageUrl: e.target.value }))}
                placeholder="Bild-URL (Unsplash, eigenes Foto…)"
                className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              />
              {draft.imageUrl && (
                <button onClick={() => setDraft(d => ({ ...d, imageUrl: "" }))} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quote picker */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Quote className="inline h-3 w-3 mr-1" />Zitat
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUOTES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setDraft(d => ({ ...d, quoteIndex: i, useCustomQuote: false }))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                    draft.quoteIndex === i && !draft.useCustomQuote
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {q.author}
                </button>
              ))}
            </div>
            {/* Custom quote */}
            <div className="space-y-1.5">
              <input
                value={draft.customQuote}
                onChange={e => setDraft(d => ({ ...d, customQuote: e.target.value, useCustomQuote: !!e.target.value }))}
                placeholder="Eigenes Zitat eingeben…"
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              />
              {draft.useCustomQuote && (
                <input
                  value={draft.customAuthor}
                  onChange={e => setDraft(d => ({ ...d, customAuthor: e.target.value }))}
                  placeholder="Autor (optional)"
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />Speichern
            </button>
            <button
              onClick={cancel}
              className="rounded-lg border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
