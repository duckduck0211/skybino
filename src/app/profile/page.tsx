"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, BookOpen, GraduationCap, MapPin, Calendar, Award, ChevronRight, Zap, Trash2, RotateCcw, CloudUpload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllDecks, getBackups, deleteBackup, restoreBackup, createBackup, setExpertMode } from "@/lib/store";
import type { Backup } from "@/lib/store";

// ─── Data ─────────────────────────────────────────────────────────────────────

const bundeslaender = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
];

const schulabschluesse = [
  { value: "abitur",        label: "Abitur (Allg. Hochschulreife)" },
  { value: "fachabitur",    label: "Fachabitur / Fachhochschulreife" },
  { value: "realschule",    label: "Mittlere Reife / Realschulabschluss" },
  { value: "hauptschule",   label: "Hauptschulabschluss" },
  { value: "studium",       label: "Studium / Hochschule" },
  { value: "berufsschule",  label: "Berufsschule / Ausbildung" },
  { value: "sonstiges",     label: "Sonstiges" },
];

const schuljahre = [
  ...Array.from({ length: 13 }, (_, i) => ({ value: `klasse-${i + 1}`, label: `Klasse ${i + 1}` })),
  { value: "berufsschule", label: "Berufsschule" },
  { value: "studium-1", label: "Studium – 1. Semester" },
  { value: "studium-2", label: "Studium – 2. Semester" },
  { value: "studium-3", label: "Studium – 3. Semester" },
  { value: "studium-4", label: "Studium – 4. Semester" },
  { value: "studium-5", label: "Studium – 5. Semester" },
  { value: "studium-6", label: "Studium – 6. Semester" },
  { value: "studium-hoeher", label: "Studium – 7. Semester oder höher" },
];

const currentYear = new Date().getFullYear();
const abschlussJahre = Array.from({ length: 12 }, (_, i) => currentYear + i);

// ─── Curriculum Data (simplified for demo) ───────────────────────────────────

const curriculumHighlights: Record<string, Record<string, string[]>> = {
  "Bayern": {
    "Klasse 11": ["Biologie: Genetik & Ökologie", "Chemie: Organische Verbindungen", "Geschichte: Imperialismus", "Deutsch: Expressionismus"],
    "Klasse 12": ["Biologie: Evolution & Neurobiologie", "Physik: Quantenphysik", "Geschichte: Weimarer Republik", "Mathe: Analysis & Stochastik"],
  },
  "Nordrhein-Westfalen": {
    "Klasse 11": ["Biologie: Zellbiologie & Genetik", "Chemie: Kohlenwasserstoffe", "Geschichte: Erster Weltkrieg", "Deutsch: Epoche der Klassik"],
    "Klasse 12": ["Biologie: Neurobiologie", "Physik: Elektromagnetismus", "Geschichte: NS-Zeit", "Mathe: Differentialrechnung"],
  },
  "Berlin": {
    "Klasse 11": ["Biologie: Genetik", "Chemie: Reaktionskinetik", "Geschichte: Weimarer Republik", "Deutsch: Literatur der Moderne"],
    "Klasse 12": ["Biologie: Ökologie", "Physik: Quantenmechanik", "Geschichte: Kalter Krieg", "Mathe: Integralrechnung"],
  },
};

// ─── Profile type ─────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  bundesland: string;
  schuljahr: string;
  abschlussJahr: string;
  angestrebterAbschluss: string;
  expertMode?: boolean;
}

const defaultProfile: UserProfile = {
  name: "Mert B.",
  bundesland: "",
  schuljahr: "",
  abschlussJahr: "",
  angestrebterAbschluss: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("synapze-profile");
    if (stored) setProfile(JSON.parse(stored));
    else setIsEditing(true); // open edit mode if no profile yet
  }, []);

  const handleSave = () => {
    localStorage.setItem("synapze-profile", JSON.stringify(profile));
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const [backups, setBackups] = useState<Backup[]>([]);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);

  useEffect(() => { setBackups(getBackups()); }, []);

  const refreshBackups = () => setBackups(getBackups());

  const handleDeleteBackup = (id: string) => {
    deleteBackup(id);
    refreshBackups();
  };

  const handleRestore = (id: string) => {
    restoreBackup(id);
    setRestoreConfirm(null);
    window.location.reload();
  };

  const handleManualSync = () => {
    createBackup("Manuelle Sicherung");
    refreshBackups();
  };

  const set = (field: keyof UserProfile, value: string) =>
    setProfile(p => ({ ...p, [field]: value }));

  const gradeMatch = profile.schuljahr.match(/^klasse-(\d+)$/);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : 99;
  const canToggleExpert = grade >= 9;
  const defaultExpert = grade >= 10;
  const currentExpertMode = profile.expertMode ?? defaultExpert;

  const handleExpertToggle = (value: boolean) => {
    setExpertMode(value);
    setProfile(p => ({ ...p, expertMode: value }));
  };

  const allDecks = getAllDecks();
  const totalCards = allDecks.reduce((s, d) => s + d.cards.length, 0);

  // Find curriculum data for current school year
  const schuljahrLabel = schuljahre.find(s => s.value === profile.schuljahr)?.label ?? "";
  const klasse = schuljahrLabel.replace("Klasse ", "Klasse ");
  const curriculumForBland = curriculumHighlights[profile.bundesland] ?? {};
  const curriculumForGrade = curriculumForBland[klasse] ?? [];
  const hasCurriculum = curriculumForGrade.length > 0;

  const abschlussLabel = schulabschluesse.find(s => s.value === profile.angestrebterAbschluss)?.label ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mein Profil</h2>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Bearbeiten
          </Button>
        )}
      </div>

      {/* Avatar + Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary">
              {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "MB"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold truncate">{profile.name || "Kein Name"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {profile.bundesland && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <MapPin className="h-3 w-3" /> {profile.bundesland}
                  </Badge>
                )}
                {schuljahrLabel && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <BookOpen className="h-3 w-3" /> {schuljahrLabel}
                  </Badge>
                )}
                {abschlussLabel && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <GraduationCap className="h-3 w-3" /> {abschlussLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{allDecks.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Decks</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalCards}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Karten</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">🔥 3</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tage Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card className="border-2 border-primary/20">
          <CardContent className="space-y-5 p-6">
            <h3 className="font-semibold">Profil bearbeiten</h3>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input type="text" value={profile.name} onChange={e => set("name", e.target.value)}
                placeholder="Dein Name"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1" />
            </div>

            {/* Bundesland */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Bundesland
              </label>
              <select value={profile.bundesland} onChange={e => set("bundesland", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                <option value="">Bundesland wählen…</option>
                {bundeslaender.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Schuljahr */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Aktuelles Schuljahr / Semester
              </label>
              <select value={profile.schuljahr} onChange={e => set("schuljahr", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                <option value="">Schuljahr wählen…</option>
                {schuljahre.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Experten-Modus Toggle (ab Klasse 9) */}
            {canToggleExpert && (
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  <Zap className="h-3.5 w-3.5 text-primary" /> Anzeigemodus
                </label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleExpertToggle(false)}
                    className={`flex-1 py-2 text-sm font-medium transition-all ${!currentExpertMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    Einfach
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpertToggle(true)}
                    className={`flex-1 py-2 text-sm font-medium transition-all ${currentExpertMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    Experten-Modus
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {currentExpertMode
                    ? "4 Bewertungs-Buttons, KI-Erklärungen, detaillierte Stats"
                    : "2 Buttons (Wusste ich / Nochmal), übersichtliches Design"}
                </p>
              </div>
            )}

            {/* Angestrebter Abschluss */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Angestrebter Abschluss
              </label>
              <select value={profile.angestrebterAbschluss} onChange={e => set("angestrebterAbschluss", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                <option value="">Abschluss wählen…</option>
                {schulabschluesse.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Abschluss Jahr */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Voraussichtlicher Abschluss
              </label>
              <select value={profile.abschlussJahr} onChange={e => set("abschlussJahr", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                <option value="">Jahr wählen…</option>
                {abschlussJahre.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
              {profile.abschlussJahr && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Noch ca. {parseInt(profile.abschlussJahr) - currentYear} Jahr{parseInt(profile.abschlussJahr) - currentYear !== 1 ? "e" : ""} bis zum Abschluss.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Speichern
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Profil gespeichert!
        </div>
      )}

      {/* ── Curriculum Section ── */}
      {profile.bundesland && profile.schuljahr && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Lehrplan-Übersicht
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {profile.bundesland} · {schuljahrLabel}
                </p>
              </div>
              {abschlussLabel && <Badge>{abschlussLabel.split(" ")[0]}</Badge>}
            </div>

            {hasCurriculum ? (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  Aktuell relevante Themen laut Lehrplan:
                </p>
                <div className="space-y-2">
                  {curriculumForGrade.map((topic, i) => {
                    const [subject, detail] = topic.split(": ");
                    return (
                      <div key={i} className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{subject}</p>
                          {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" />
                  <p className="text-xs text-primary">
                    <strong>Bald:</strong> Synapze erstellt automatisch Lernkarten für diese Themen — passend zu deinem Bundesland und Schuljahr.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-muted bg-muted/20 p-6 text-center">
                <GraduationCap className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-sm">Lehrplan in Kürze verfügbar</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Wir arbeiten daran, den Lehrplan für <strong>{profile.bundesland}</strong> zu hinterlegen. Aktuell verfügbar: Bayern, NRW, Berlin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Sicherungskopien ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Sicherungskopien</h3>
            <button
              onClick={handleManualSync}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              Jetzt sichern
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <CloudUpload className="h-8 w-8 opacity-30" />
              <p className="text-sm">Noch keine Sicherungskopien vorhanden.</p>
              <p className="text-xs opacity-60">Klicke auf das Sync-Symbol oben oder &ldquo;Jetzt sichern&rdquo;.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  {restoreConfirm === b.id ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleRestore(b.id)} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                        Wiederherstellen
                      </button>
                      <button onClick={() => setRestoreConfirm(null)} className="rounded-lg border px-2 py-1 text-xs hover:bg-muted transition-colors">
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setRestoreConfirm(b.id)} title="Wiederherstellen" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteBackup(b.id)} title="Löschen" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
