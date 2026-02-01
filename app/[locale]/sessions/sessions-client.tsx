"use client";

import { useEffect, useMemo, useState } from "react";

/* =======================
   Types
======================= */

type Athlete = {
  id: string;
  name: string;
  createdAt: string;
};

type ScoringMode = "normal" | "hitsOnly" | "centerOnly";
type Environment = "indoor" | "outdoor";

type SessionParticipant = {
  athleteId: string;
  target: "head" | "belly";
};

type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string; // optional but unique if present
  notes?: string;

  distance: number;
  environment: Environment;
  setsCount: number;
  arrowsPerSet: number;

  scoringMode: ScoringMode;

  participants: SessionParticipant[];

  createdAt: string; // ISO
};

/* =======================
   Helpers
======================= */

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const ATHLETES_KEY = "archery.athletes.v1";

const distanceSuggestions = [18, 35, 50, 70, 90, 120, 150] as const;

function defaultModeForDistance(distance: number): ScoringMode {
  return distance >= 70 ? "hitsOnly" : "normal";
}

/* =======================
   i18n copy (minimal)
======================= */

const copy = {
  en: {
    h1: "Sessions",
    subtitle: "Create sessions and add participants (in-memory).",
    add: "Add session",
    date: "Date",
    title: "Title (optional, unique)",
    notes: "Notes",
    distance: "Distance (m)",
    env: "Environment",
    indoor: "Indoor",
    outdoor: "Outdoor",
    sets: "Sets",
    arrows: "Arrows per set",
    mode: "Scoring mode",
    modeNormal: "Normal (hit=1, center=2/3)",
    modeHitsOnly: "Hits only (hit=1, center disabled)",
    modeCenterOnly: "Center only (center=1, hit disabled)",
    participants: "Participants",
    emptyAthletes: "No athletes yet. Add them on Participants page.",
    pickAthletes: "Select athletes and target (head/belly)",
    head: "Head (3 in normal)",
    belly: "Belly (2 in normal)",
    validationTitleTaken: "Title must be unique.",
    validationNeedAthletes: "Select at least one participant.",
    empty: "No sessions yet. Add your first one.",
    count: "total",
    del: "Delete",
    generated: "Auto name",
    colWhen: "When",
    colName: "Name",
    colFormat: "Format",
    colPeople: "People",
    badgeHitsOnly: "hits-only",
    badgeCenterOnly: "center-only",
    badgeNormal: "normal",
  },
  ru: {
    h1: "Сессии",
    subtitle: "Создание сессий и участников в них (пока без базы).",
    add: "Добавить сессию",
    date: "Дата",
    title: "Название (необяз., уникальное)",
    notes: "Заметки",
    distance: "Дистанция (м)",
    env: "Место",
    indoor: "Закрытое",
    outdoor: "Открытое",
    sets: "Кол-во сетов",
    arrows: "Стрел на сет",
    mode: "Режим подсчёта",
    modeNormal: "Обычный (попад=1, центр=2/3)",
    modeHitsOnly: "Только попадания (попад=1, центр нельзя)",
    modeCenterOnly: "Только центр (центр=1, попад нельзя)",
    participants: "Участники",
    emptyAthletes: "Нет участников. Добавь их на странице Участники.",
    pickAthletes: "Выбери участников и цель (голова/живот)",
    head: "Голова (3 в обычном)",
    belly: "Живот (2 в обычном)",
    validationTitleTaken: "Название должно быть уникальным.",
    validationNeedAthletes: "Выбери хотя бы одного участника.",
    empty: "Пока нет сессий. Добавь первую.",
    count: "шт.",
    del: "Удалить",
    generated: "Авто-имя",
    colWhen: "Когда",
    colName: "Название",
    colFormat: "Формат",
    colPeople: "Участники",
    badgeHitsOnly: "только попад.",
    badgeCenterOnly: "только центр",
    badgeNormal: "обычный",
  },
  tr: {
    h1: "Oturumlar",
    subtitle: "Oturum oluştur ve katılımcıları ekle (şimdilik bellek içi).",
    add: "Oturum ekle",
    date: "Tarih",
    title: "Başlık (opsiyonel, benzersiz)",
    notes: "Notlar",
    distance: "Mesafe (m)",
    env: "Ortam",
    indoor: "Kapalı alan",
    outdoor: "Açık alan",
    sets: "Set sayısı",
    arrows: "Set başına ok",
    mode: "Puan modu",
    modeNormal: "Normal (isabet=1, merkez=2/3)",
    modeHitsOnly: "Sadece isabet (isabet=1, merkez kapalı)",
    modeCenterOnly: "Sadece merkez (merkez=1, isabet kapalı)",
    participants: "Katılımcılar",
    emptyAthletes: "Henüz sporcu yok. Katılımcılar sayfasından ekle.",
    pickAthletes: "Sporcu seç ve hedef (kafa/göbek)",
    head: "Kafa (normalde 3)",
    belly: "Göbek (normalde 2)",
    validationTitleTaken: "Başlık benzersiz olmalı.",
    validationNeedAthletes: "En az bir katılımcı seç.",
    empty: "Henüz oturum yok. İlkini ekle.",
    count: "toplam",
    del: "Sil",
    generated: "Oto ad",
    colWhen: "Tarih",
    colName: "Ad",
    colFormat: "Format",
    colPeople: "Kişi",
    badgeHitsOnly: "sadece isabet",
    badgeCenterOnly: "sadece merkez",
    badgeNormal: "normal",
  },
} as const;

type Locale = keyof typeof copy;

/* =======================
   Component
======================= */

export default function SessionsClient({ locale }: { locale: string }) {
  const t = copy[locale as Locale] ?? copy.en;

  // load athletes from localStorage
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ATHLETES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setAthletes(parsed);
    } catch {}
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // sessions state
  const [sessions, setSessions] = useState<Session[]>([]);

  // form state
  const [date, setDate] = useState(todayStr);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [distance, setDistance] = useState<number>(18);
  const [environment, setEnvironment] = useState<Environment>("indoor");
  const [setsCount, setSetsCount] = useState<number>(7);
  const [arrowsPerSet, setArrowsPerSet] = useState<number>(5);

  const [mode, setMode] = useState<ScoringMode>(defaultModeForDistance(18));
  const [modeTouched, setModeTouched] = useState(false);

  useEffect(() => {
    if (!modeTouched) setMode(defaultModeForDistance(distance));
  }, [distance, modeTouched]);

  // participants selection
  const [selected, setSelected] = useState<Record<string, SessionParticipant>>(
    {}
  );

  const participantsArr = useMemo(() => Object.values(selected), [selected]);
  const needAthletes = participantsArr.length === 0;

  const existingTitles = useMemo(() => {
    return new Set(
      sessions
        .map((s) => (s.title ?? "").trim().toLowerCase())
        .filter(Boolean)
    );
  }, [sessions]);

  const titleClean = title.trim();
  const titleTaken = titleClean ? existingTitles.has(titleClean.toLowerCase()) : false;

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
      return b.date.localeCompare(a.date);
    });
  }, [sessions]);

  function toggleAthlete(athleteId: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[athleteId]) {
        delete next[athleteId];
      } else {
        next[athleteId] = { athleteId, target: "head" };
      }
      return next;
    });
  }

  function setTarget(athleteId: string, target: "head" | "belly") {
    setSelected((prev) => ({
      ...prev,
      [athleteId]: { athleteId, target },
    }));
  }

  function displayName(s: Session) {
    if (s.title?.trim()) return s.title.trim();
    const envLabel = s.environment === "indoor" ? t.indoor : t.outdoor;
    return `${t.generated}: ${s.date} · ${s.distance}m · ${envLabel}`;
  }

  function modeBadge(m: ScoringMode) {
    if (m === "hitsOnly") return t.badgeHitsOnly;
    if (m === "centerOnly") return t.badgeCenterOnly;
    return t.badgeNormal;
  }

  function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (titleTaken || needAthletes) return;

    const newSession: Session = {
      id: uid(),
      date,
      title: titleClean || undefined,
      notes: notes.trim() || undefined,
      distance: Number.isFinite(distance) ? distance : 18,
      environment,
      setsCount: Math.max(1, Math.floor(setsCount)),
      arrowsPerSet: Math.max(1, Math.floor(arrowsPerSet)),
      scoringMode: mode,
      participants: participantsArr,
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);

    setTitle("");
    setNotes("");
    setSelected({});
  }

  function removeSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.h1}</h1>
        <p className="text-sm text-gray-600">{t.subtitle}</p>
      </header>

      {/* Create session */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 text-gray-100 p-4">
        <h2 className="font-medium mb-3">{t.add}</h2>

        <form onSubmit={addSession} className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.date}</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-gray-200 font-medium">{t.title}</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400 ${
                titleTaken ? "border-red-400" : ""
              }`}
            />
            {titleTaken && (
              <div className="mt-1 text-xs text-red-600">
                {t.validationTitleTaken}
              </div>
            )}
          </label>

          <label className="text-sm md:col-span-3">
            <div className="mb-1 text-gray-200 font-medium">{t.notes}</div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            />
          </label>

          {/* Distance: editable number + suggestions */}
          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.distance}</div>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              list="distance-list"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            />
            <datalist id="distance-list">
              {distanceSuggestions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.env}</div>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as Environment)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            >
              <option value="indoor">{t.indoor}</option>
              <option value="outdoor">{t.outdoor}</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.mode}</div>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as ScoringMode);
                setModeTouched(true);
              }}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            >
              <option value="normal">{t.modeNormal}</option>
              <option value="hitsOnly">{t.modeHitsOnly}</option>
              <option value="centerOnly">{t.modeCenterOnly}</option>
            </select>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.sets}</div>
            <input
              type="number"
              min={1}
              value={setsCount}
              onChange={(e) => setSetsCount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.arrows}</div>
            <input
              type="number"
              min={1}
              value={arrowsPerSet}
              onChange={(e) => setArrowsPerSet(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            />
          </label>

          {/* Participants */}
          <div className="md:col-span-3 rounded-xl border border-gray-800 bg-gray-950 p-3">
            <div className="font-medium text-white mb-2">
              {t.participants}
            </div>

            {athletes.length === 0 ? (
              <div className="text-sm text-gray-300">{t.emptyAthletes}</div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-300">{t.pickAthletes}</div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {athletes
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
                    .map((a) => {
                      const on = !!selected[a.id];
                      const target = selected[a.id]?.target ?? "head";
                      return (
                        <div key={a.id}
                            className={`rounded-xl border p-3 ${
                            on ? "border-gray-500 bg-gray-900" : "border-gray-800 bg-gray-900/40"
                            }`}>
                          <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-white">{a.name}</div>  
                            <button
                              type="button"
                              onClick={() => toggleAthlete(a.id)}
                             className={`rounded-lg border px-3 py-1 text-xs ${
                              on ? "bg-white text-gray-900 border-white" : "border-gray-700 text-gray-200 hover:bg-gray-800"
                              }`}

                              title={on ? "Selected" : "Select"}
                            >
                              {on ? "✓" : "+"}
                            </button>
                          </div>

                          <div className={`mt-2 ${on ? "" : "opacity-40 pointer-events-none"}`}>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setTarget(a.id, "head")}
                                className={`flex-1 rounded-lg border px-2 py-1 text-xs ${
                                  target === "head"
    ? "bg-white text-gray-900 border-white"
    : "border-gray-700 text-gray-200 hover:bg-gray-800"
}`}
                              >
                                {t.head}
                              </button>
                              <button
                                type="button"
                                onClick={() => setTarget(a.id, "belly")}
                                className={`flex-1 rounded-lg border px-2 py-1 text-xs ${
  target === "belly"
    ? "bg-white text-gray-900 border-white"
    : "border-gray-700 text-gray-200 hover:bg-gray-800"
}`}
                              >
                                {t.belly}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {needAthletes && (
                  <div className="text-xs text-red-600 mt-1">
                    {t.validationNeedAthletes}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={titleTaken || needAthletes}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {t.add}
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 text-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium mb-3 text-white">{t.add}</h2>
          <span className="text-sm text-gray-600">
            {sortedSessions.length} {t.count}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-900">
              <tr className="border-b">
                <th className="py-3 px-4 font-medium">{t.colWhen}</th>
                <th className="py-3 px-4 font-medium">{t.colName}</th>
                <th className="py-3 px-4 font-medium">{t.colFormat}</th>
                <th className="py-3 px-4 font-medium">{t.colPeople}</th>
                <th className="py-3 px-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="text-gray-900">
              {sortedSessions.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-3 px-4 whitespace-nowrap">{s.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{displayName(s)}</div>
                    {s.notes ? (
                      <div className="text-xs text-gray-700 mt-1">{s.notes}</div>
                    ) : null}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-gray-800">
                    <div>
                      {s.distance}m · {s.environment === "indoor" ? t.indoor : t.outdoor}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {s.setsCount} × {s.arrowsPerSet} ·{" "}
                      <span className="rounded-md border px-2 py-0.5">
                        {modeBadge(s.scoringMode)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{s.participants.length}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => removeSession(s.id)}
                      className="rounded-lg border px-3 py-1 hover:bg-white"
                      title={t.del}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {sortedSessions.length === 0 && (
                <tr>
                  <td className="py-8 px-4 text-gray-700" colSpan={5}>
                    {t.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
