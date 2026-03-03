"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  ClipboardList,
  Users,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronRight,
  Play,
  MoreHorizontal,
  PenLine,
  Trash2,
  Share2,
  Check,
  X,
  ArrowLeft,
  Upload,
  FileText,
  File,
  Download,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAllDecks,
  deleteDeck,
  renameDeck,
  getSubDecks,
  createUserDeck,
  getFolders,
  createUserFolder,
  deleteUserFolder,
  renameUserFolder,
  addDocToFolder,
  deleteDocFromFolder,
  getDeckRegime,
  setDeckRegime,
  getStudyMode,
} from "@/lib/store";
import type { Deck } from "@/lib/data";
import type { UserFolder, FolderDoc } from "@/lib/store";
import { REGIME_PRESETS } from "@/lib/srs";
import type { RegimeKey } from "@/lib/srs";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "decks" | "ordner" | "tests" | "gruppen";

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60">
        <Icon className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href={actionHref}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

// ─── Sub-Deck Row ─────────────────────────────────────────────────────────────

function SubDeckRow({ deck, onDelete }: { deck: Deck; onDelete: () => void }) {
  const total = deck.cards.length;
  const mastered = deck.masteredCount ?? 0;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="group/sub flex items-center gap-2.5 rounded-xl border bg-muted/30 px-3 py-2 transition-all hover:bg-muted/50">
      <div className="w-px h-4 shrink-0 rounded-full bg-border ml-1" />
      <span className="text-base shrink-0">{deck.emoji ?? "📚"}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">{deck.title}</p>
        <p className="text-[11px] text-muted-foreground">{total} Karten</p>
      </div>
      {total > 0 && (
        <div className="hidden w-14 shrink-0 sm:block">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <Link href={`/study/${deck.id}`} title="Lernen" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all hover:bg-primary/20">
        <Play className="h-3.5 w-3.5" />
      </Link>
      <Link href={`/quiz/${deck.id}`} title="Quiz" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all hover:bg-muted">
        <Zap className="h-3.5 w-3.5" />
      </Link>
      <button onClick={onDelete} title="Löschen" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/sub:opacity-100">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Inline Sub-Deck Form ─────────────────────────────────────────────────────

function InlineSubDeckForm({ onSave, onCancel }: { onSave: (title: string, emoji: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📖");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = () => { if (title.trim()) onSave(title.trim(), emoji); };

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Neues Sub-Kapitel</p>
      <div className="flex items-center gap-2">
        <input
          value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2}
          className="w-10 shrink-0 rounded-lg border bg-background px-1 py-1 text-center text-base outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel des Sub-Kapitels"
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!title.trim()} className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
          Erstellen
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ─── Deck Card ────────────────────────────────────────────────────────────────

function DeckCard({
  deck,
  onDelete,
  onRename,
  onRefresh,
  isSimple = false,
}: {
  deck: Deck;
  onDelete: () => void;
  onRename: (newTitle: string, newEmoji: string) => void;
  onRefresh: () => void;
  isSimple?: boolean;
}) {
  const mastered = deck.masteredCount ?? 0;
  const total = deck.cards.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [regimePicker, setRegimePicker] = useState(false);
  const [currentRegime, setCurrentRegime] = useState<RegimeKey>(() => getDeckRegime(deck.id));
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(deck.title);
  const [newEmoji, setNewEmoji] = useState(deck.emoji ?? "📚");
  const menuRef = useRef<HTMLDivElement>(null);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [creatingSubDeck, setCreatingSubDeck] = useState(false);
  const [subDecksOpen, setSubDecksOpen] = useState(false);
  const [subDecks, setSubDecks] = useState<Deck[]>([]);

  useEffect(() => { setSubDecks(getSubDecks(deck.id)); }, [deck.id]);

  useEffect(() => {
    setNewTitle(deck.title);
    setNewEmoji(deck.emoji ?? "📚");
  }, [deck.title, deck.emoji]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setConfirmDelete(false); setRegimePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addMenuOpen]);

  const handleRename = () => {
    if (!newTitle.trim()) return;
    onRename(newTitle.trim(), newEmoji);
    setRenaming(false);
  };

  const cancelRename = () => {
    setNewTitle(deck.title);
    setNewEmoji(deck.emoji ?? "📚");
    setRenaming(false);
  };

  const hasSubDecks = subDecks.length > 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">

      <div className="flex items-start justify-between gap-3">
        {renaming ? (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={2}
              className="w-11 shrink-0 rounded-xl border bg-background px-1.5 py-1 text-center text-xl outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" />
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") cancelRename(); }}
              className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" />
            <button onClick={handleRename} title="Speichern" className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={cancelRename} title="Abbrechen" className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "flex shrink-0 items-center justify-center rounded-xl",
                isSimple ? "h-14 w-14 text-3xl" : "h-10 w-10 text-xl",
                deck.color ?? "bg-violet-500"
              )}>
                {deck.emoji ?? "📚"}
              </div>
              <div className="min-w-0">
                <p className={cn("truncate font-semibold leading-snug", isSimple && "text-base")}>{deck.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{total} Karten · {deck.category}</p>
              </div>
            </div>

            {!isSimple && <div className="flex items-center gap-1">
              {/* "+" dropdown: Karten hinzufügen / Sub-Kapitel erstellen */}
              <div className="relative" ref={addMenuRef}>
                <button
                  onClick={() => setAddMenuOpen((p) => !p)}
                  title="Hinzufügen"
                  className={cn(
                    "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary",
                    addMenuOpen ? "opacity-100 bg-primary/10 text-primary" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <Plus className="h-4 w-4" />
                </button>
                {addMenuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-2xl border bg-popover shadow-2xl ring-1 ring-black/5">
                    <div className="p-1.5">
                      <Link href={`/create?deckId=${deck.id}&mode=add`} onClick={() => setAddMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent">
                        <Plus className="h-4 w-4 text-muted-foreground" />Karten hinzufügen
                      </Link>
                      <button onClick={() => { setAddMenuOpen(false); setCreatingSubDeck(true); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent">
                        <Layers className="h-4 w-4 text-muted-foreground" />Sub-Kapitel erstellen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* "⋯" edit menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => { setMenuOpen(!menuOpen); setConfirmDelete(false); }}
                  title="Bearbeiten"
                  className={cn(
                    "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                    menuOpen ? "opacity-100 bg-muted text-foreground" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-2xl border bg-popover shadow-2xl ring-1 ring-black/5">
                    {confirmDelete ? (
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="font-semibold text-sm">Deck wirklich löschen?</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                            Alle Karten in <span className="font-medium">&ldquo;{deck.title}&rdquo;</span> werden dauerhaft entfernt.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setMenuOpen(false); setConfirmDelete(false); onDelete(); }} className="flex-1 rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors">Löschen</button>
                          <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors">Abbrechen</button>
                        </div>
                      </div>
                    ) : regimePicker ? (
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={() => setRegimePicker(false)} className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lernmodus</p>
                        </div>
                        {(Object.entries(REGIME_PRESETS) as [RegimeKey, typeof REGIME_PRESETS[RegimeKey]][]).map(([key, preset]) => (
                          <button
                            key={key}
                            onClick={() => { setDeckRegime(deck.id, key); setCurrentRegime(key); setRegimePicker(false); setMenuOpen(false); }}
                            className={cn(
                              "w-full rounded-xl border p-2.5 text-left transition-all",
                              currentRegime === key ? "border-primary/40 bg-primary/5" : "hover:bg-accent",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{preset.emoji}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-snug">{preset.label}</p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{preset.description}</p>
                              </div>
                              {currentRegime === key && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-1.5">
                        <button onClick={() => { setRenaming(true); setMenuOpen(false); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent">
                          <PenLine className="h-4 w-4 text-muted-foreground" />Umbenennen
                        </button>
                        <button onClick={() => setRegimePicker(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent">
                          <span className="text-base leading-none">{REGIME_PRESETS[currentRegime].emoji}</span>
                          <span>Lernmodus</span>
                          <span className="ml-auto text-[11px] text-muted-foreground">{REGIME_PRESETS[currentRegime].label}</span>
                        </button>
                        <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
                          <Share2 className="h-4 w-4" />Teilen
                          <span className="ml-auto text-[11px] opacity-50">Bald</span>
                        </button>
                        <div className="my-1 border-t" />
                        <button onClick={() => setConfirmDelete(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />Löschen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>}
          </>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{mastered} gemeistert</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Sub-Kapitel accordion toggle */}
      {hasSubDecks && (
        <button
          onClick={() => setSubDecksOpen((p) => !p)}
          className="mt-3 flex items-center gap-1 rounded-lg px-0.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-150", subDecksOpen && "rotate-90")} />
          {subDecks.length} Sub-Kapitel
        </button>
      )}

      {/* Sub-deck rows */}
      {subDecksOpen && hasSubDecks && (
        <div className="mt-1.5 space-y-1.5">
          {subDecks.map((sub) => (
            <SubDeckRow
              key={sub.id}
              deck={sub}
              onDelete={() => {
                deleteDeck(sub.id);
                setSubDecks(getSubDecks(deck.id));
                onRefresh();
              }}
            />
          ))}
        </div>
      )}

      {/* Inline sub-deck creation form */}
      {creatingSubDeck && (
        <InlineSubDeckForm
          onSave={(title, emoji) => {
            createUserDeck({
              id: `user-${Date.now()}`,
              title,
              emoji,
              description: "",
              category: deck.category,
              color: deck.color,
              cards: [],
              masteredCount: 0,
              parentId: deck.id,
            });
            setCreatingSubDeck(false);
            setSubDecks(getSubDecks(deck.id));
            setSubDecksOpen(true);
            onRefresh();
          }}
          onCancel={() => setCreatingSubDeck(false)}
        />
      )}

      {/* Lernen / Quiz buttons */}
      <div className="mt-4 flex gap-2">
        <Link
          href={hasSubDecks ? `/study/${deck.id}?includeSubDecks=true` : `/study/${deck.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <Play className="h-3.5 w-3.5" />Lernen
        </Link>
        <Link
          href={hasSubDecks ? `/quiz/${deck.id}?includeSubDecks=true` : `/quiz/${deck.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:bg-muted"
        >
          <Zap className="h-3.5 w-3.5" />Quiz
        </Link>
      </div>
    </div>
  );
}

// ─── Document Item ────────────────────────────────────────────────────────────

function DocItem({ doc, onDelete }: { doc: FolderDoc; onDelete: () => void }) {
  const isImage = doc.mimeType.startsWith("image/");
  const isPDF = doc.mimeType === "application/pdf";

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` :
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` :
    `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const date = new Date(doc.uploadedAt).toLocaleDateString("de-DE", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="group flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-sm">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doc.dataUrl} alt={doc.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          {isPDF
            ? <FileText className="h-6 w-6 text-rose-500" />
            : <File className="h-6 w-6 text-muted-foreground" />}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatSize(doc.size)} · {date}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={doc.dataUrl}
          download={doc.name}
          title="Herunterladen"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={onDelete}
          title="Löschen"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Folder Detail ────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

function FolderDetail({ folder, onBack, onRefresh }: {
  folder: UserFolder;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const processFiles = useCallback((files: File[]) => {
    setSizeError(null);
    const tooBig = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooBig.length > 0) {
      setSizeError(`${tooBig.map((f) => f.name).join(", ")} überschreiten das Limit von 4 MB.`);
    }
    const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);

    // Process sequentially to avoid localStorage race conditions
    const processNext = (index: number) => {
      if (index >= valid.length) { onRefresh(); return; }
      const file = valid[index];
      const reader = new FileReader();
      reader.onload = (ev) => {
        addDocToFolder(folder.id, {
          id: `doc-${Date.now()}-${index}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: ev.target?.result as string,
        });
        processNext(index + 1);
      };
      reader.readAsDataURL(file);
    };
    processNext(0);
  }, [folder.id, onRefresh]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{folder.emoji} {folder.name}</h2>
          <p className="text-sm text-muted-foreground">
            {folder.documents.length} Datei{folder.documents.length !== 1 ? "en" : ""}
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all select-none",
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted hover:border-primary/40 hover:bg-primary/5",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Dateien hier ablegen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">oder klicken zum Auswählen · max. 4 MB pro Datei</p>
        </div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {/* Size error */}
      {sizeError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{sizeError}</span>
        </div>
      )}

      {/* Document list */}
      {folder.documents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Noch keine Dateien in diesem Ordner.
        </p>
      ) : (
        <div className="space-y-2">
          {folder.documents.map((doc) => (
            <DocItem
              key={doc.id}
              doc={doc}
              onDelete={() => { deleteDocFromFolder(folder.id, doc.id); onRefresh(); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Folder Card ──────────────────────────────────────────────────────────────

function FolderCard({ folder, onClick, onDelete, onRename }: {
  folder: UserFolder;
  onClick: () => void;
  onDelete: () => void;
  onRename: (name: string, emoji: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [newEmoji, setNewEmoji] = useState(folder.emoji);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNewName(folder.name);
    setNewEmoji(folder.emoji);
  }, [folder.name, folder.emoji]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleRename = () => {
    if (!newName.trim()) return;
    onRename(newName.trim(), newEmoji);
    setRenaming(false);
  };

  return (
    <div
      className="group relative flex cursor-pointer flex-col rounded-2xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
      onClick={() => { if (!menuOpen && !renaming) onClick(); }}
    >
      {renaming ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            maxLength={2}
            className="w-11 shrink-0 rounded-xl border bg-background px-1.5 py-1 text-center text-xl outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleRename} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setRenaming(false)} className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/30">
              {folder.emoji}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-snug">{folder.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {folder.documents.length} Datei{folder.documents.length !== 1 ? "en" : ""}
              </p>
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setMenuOpen(!menuOpen); setConfirmDelete(false); }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                menuOpen ? "opacity-100 bg-muted text-foreground" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-2xl border bg-popover shadow-2xl ring-1 ring-black/5">
                {!confirmDelete ? (
                  <div className="p-1.5">
                    <button
                      onClick={() => { setRenaming(true); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                    >
                      <PenLine className="h-4 w-4 text-muted-foreground" />Umbenennen
                    </button>
                    <div className="my-1 border-t" />
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />Löschen
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-sm">Ordner löschen?</p>
                      <p className="mt-1 text-xs text-muted-foreground">Alle enthaltenen Dateien werden dauerhaft entfernt.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setMenuOpen(false); setConfirmDelete(false); onDelete(); }} className="flex-1 rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors">Löschen</button>
                      <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors">Abbrechen</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ordner Tab ───────────────────────────────────────────────────────────────

function OrdnerTab() {
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const createInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setFolders(getFolders()), []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (creating) createInputRef.current?.focus(); }, [creating]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createUserFolder({
      id: `folder-${Date.now()}`,
      name: newName.trim(),
      emoji: newEmoji,
      createdAt: new Date().toISOString(),
      documents: [],
    });
    setNewName("");
    setNewEmoji("📁");
    setCreating(false);
    refresh();
  };

  // Folder detail view
  const activeFolder = activeFolderId ? (folders.find((f) => f.id === activeFolderId) ?? null) : null;
  if (activeFolder) {
    return (
      <FolderDetail
        folder={activeFolder}
        onBack={() => { setActiveFolderId(null); refresh(); }}
        onRefresh={refresh}
      />
    );
  }

  // Folder grid
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onClick={() => setActiveFolderId(folder.id)}
            onDelete={() => { deleteUserFolder(folder.id); refresh(); }}
            onRename={(name, emoji) => { renameUserFolder(folder.id, name, emoji); refresh(); }}
          />
        ))}

        {/* Create tile */}
        {creating ? (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={2}
                className="w-11 shrink-0 rounded-xl border bg-background px-1.5 py-1.5 text-center text-xl outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                ref={createInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ordnername"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                className="flex-1 rounded-xl border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Erstellen
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(""); }}
                className="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted py-10 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Neuer Ordner</span>
          </button>
        )}
      </div>

      {folders.length === 0 && !creating && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Erstelle deinen ersten Ordner, um Dokumente zu organisieren.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("decks");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [filter, setFilter] = useState<"alle" | "von-dir">("von-dir");
  const [filterOpen, setFilterOpen] = useState(false);
  const studyMode = getStudyMode();
  const isSimple = studyMode === "simple";

  const refresh = () => setDecks(getAllDecks());

  useEffect(() => {
    refresh();
    // Read ?tab param without useSearchParams (avoids Suspense requirement)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as Tab | null;
    if (tabParam && ["decks", "ordner", "tests", "gruppen"].includes(tabParam)) {
      setTab(tabParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (deckId: string) => {
    getSubDecks(deckId).forEach((sub) => deleteDeck(sub.id));
    deleteDeck(deckId);
    refresh();
  };
  const rootDecks = decks.filter((d) => !d.parentId);

  const handleRename = (deckId: string, newTitle: string, newEmoji: string) => {
    renameDeck(deckId, newTitle, newEmoji);
    refresh();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "decks",   label: "Decks"       },
    { id: "ordner",  label: "Ordner"      },
    { id: "tests",   label: "Übungstests" },
    { id: "gruppen", label: "Lerngruppen" },
  ];

  const filterLabels: Record<typeof filter, string> = { "alle": "Alle", "von-dir": "Von dir" };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deine Bibliothek</h1>
        <Link
          href="/create"
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Erstellen
        </Link>
      </div>

      {/* ── Tab bar ── */}
      <div className="border-b">
        <nav className="flex gap-0">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-all",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Filter row (only on Decks tab, expert mode) ── */}
      {tab === "decks" && decks.length > 0 && !isSimple && (
        <div className="relative">
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className="flex items-center gap-1.5 rounded-full border bg-background px-4 py-1.5 text-sm font-medium transition-all hover:bg-muted"
          >
            {filterLabels[filter]}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full z-10 mt-1.5 w-36 overflow-hidden rounded-xl border bg-popover shadow-lg">
              {(["von-dir", "alle"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setFilterOpen(false); }}
                  className={cn("flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-accent", filter === f && "font-semibold text-primary")}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab content ── */}

      {tab === "decks" && (
        rootDecks.length === 0 ? (
          <EmptyState icon={BookOpen} title="Du hast noch keine Decks erstellt" description="Erstelle ein Deck, um deine Lernkarten zu organisieren." actionLabel="Deck erstellen" actionHref="/create" />
        ) : (
          <div className={cn("grid gap-4", isSimple ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {rootDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onDelete={() => handleDelete(deck.id)}
                onRename={(t, e) => handleRename(deck.id, t, e)}
                onRefresh={refresh}
                isSimple={isSimple}
              />
            ))}
            <Link href="/create" className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted py-10 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current"><Plus className="h-5 w-5" /></div>
              <span className="text-sm font-medium">Neues Deck</span>
            </Link>
          </div>
        )
      )}

      {tab === "ordner" && <OrdnerTab />}

      {tab === "tests" && (
        <EmptyState icon={ClipboardList} title="Du hast noch keine Übungstests" description="Erstelle einen Übungstest aus deinen Lernkarten." actionLabel="Übungstest erstellen" actionHref="#" />
      )}

      {tab === "gruppen" && (
        <EmptyState icon={Users} title="Du bist noch keiner Lerngruppe beigetreten" description="Lerne gemeinsam mit anderen und tausche Lernsets aus." actionLabel="Lerngruppe erstellen" actionHref="/community" />
      )}
    </div>
  );
}
