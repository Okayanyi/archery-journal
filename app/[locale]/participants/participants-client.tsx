"use client";

import { useEffect, useMemo, useState } from "react";

/* =======================
   Types
======================= */

type AthleteV1 = {
  id: string;
  name: string;
  createdAt: string;
};

type AthleteV2 = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO
};

const STORAGE_V2 = "archery.athletes.v2";
const STORAGE_V1 = "archery.athletes.v1"; // для совместимости с Sessions

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function fullName(a: AthleteV2) {
  return `${a.firstName} ${a.lastName}`.trim();
}

function ageFromBirthDate(birthDate?: string) {
  if (!birthDate) return null;
  const d = new Date(birthDate + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

/* =======================
   Component
======================= */

export default function ParticipantsClient({ locale }: { locale: string }) {
  // i18n minimal
  const t =
    locale === "ru"
      ? {
          title: "Участники",
          hint: "Имя/фамилия/дата рождения + поиск/фильтры. Данные сохраняются в браузере.",
          first: "Имя",
          last: "Фамилия",
          birth: "Дата рождения",
          add: "Добавить",
          search: "Поиск",
          searchPh: "Введите имя или фамилию…",
          filters: "Фильтры",
          under: "Младше",
          years: "лет",
          sort: "Сортировка",
          sortName: "По имени",
          sortAge: "По возрасту",
          asc: "по возр.",
          desc: "по убыв.",
          list: "Список",
          empty: "Пока пусто. Добавь первого участника.",
          age: "Возраст",
          del: "Удалить",
        }
      : locale === "tr"
      ? {
          title: "Katılımcılar",
          hint: "Ad/soyad/doğum tarihi + arama/filtreler. Tarayıcıda saklanır.",
          first: "Ad",
          last: "Soyad",
          birth: "Doğum tarihi",
          add: "Ekle",
          search: "Ara",
          searchPh: "Ad veya soyad yaz…",
          filters: "Filtreler",
          under: "Şundan küçük",
          years: "yaş",
          sort: "Sıralama",
          sortName: "İsme göre",
          sortAge: "Yaşa göre",
          asc: "artan",
          desc: "azalan",
          list: "Liste",
          empty: "Henüz boş. İlk katılımcıyı ekle.",
          age: "Yaş",
          del: "Sil",
        }
      : {
          title: "Participants",
          hint: "First/last name + birth date + search/filters. Saved in browser.",
          first: "First name",
          last: "Last name",
          birth: "Birth date",
          add: "Add",
          search: "Search",
          searchPh: "Type first or last name…",
          filters: "Filters",
          under: "Under",
          years: "years",
          sort: "Sort",
          sortName: "By name",
          sortAge: "By age",
          asc: "asc",
          desc: "desc",
          list: "List",
          empty: "Empty. Add your first participant.",
          age: "Age",
          del: "Delete",
        };

  /* ---- state ---- */
  const [athletes, setAthletes] = useState<AthleteV2[]>(() => {
    if (typeof window === "undefined") return [];

    // 1) пробуем v2
    const v2 = safeJsonParse<AthleteV2[]>(window.localStorage.getItem(STORAGE_V2));
    if (Array.isArray(v2)) return v2;

    // 2) миграция из v1 (name -> firstName/lastName)
    const v1 = safeJsonParse<AthleteV1[]>(window.localStorage.getItem(STORAGE_V1));
    if (Array.isArray(v1)) {
      const migrated: AthleteV2[] = v1.map((a) => {
        const parts = (a.name || "").trim().split(/\s+/);
        const firstName = parts[0] ?? "";
        const lastName = parts.slice(1).join(" ");
        return {
          id: a.id,
          firstName,
          lastName,
          birthDate: undefined,
          createdAt: a.createdAt,
        };
      });
      return migrated;
    }

    return [];
  });

  // форма добавления
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // поиск/фильтры/сорт
  const [q, setQ] = useState("");
  const [maxAgeEnabled, setMaxAgeEnabled] = useState(false);
  const [maxAge, setMaxAge] = useState(12);
  const [sortBy, setSortBy] = useState<"name" | "age">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  /* ---- persist ---- */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_V2, JSON.stringify(athletes));

      // совместимость: поддерживаем v1 для sessions (name = "First Last")
      const v1: AthleteV1[] = athletes.map((a) => ({
        id: a.id,
        name: fullName(a),
        createdAt: a.createdAt,
      }));
      window.localStorage.setItem(STORAGE_V1, JSON.stringify(v1));
    } catch {
      // ignore
    }
  }, [athletes]);

  /* ---- actions ---- */
  function addAthlete(e: React.FormEvent) {
    e.preventDefault();
    const f = firstName.trim();
    const l = lastName.trim();
    const b = birthDate.trim();

    if (!f || !l) return; // имя и фамилия обязательны

    setAthletes((prev) => [
      {
        id: uid(),
        firstName: f,
        lastName: l,
        birthDate: b || undefined,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setFirstName("");
    setLastName("");
    setBirthDate("");
  }

  function removeAthlete(id: string) {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }

  /* ---- derived ---- */
  const view = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = athletes.filter((a) => {
      const name = fullName(a).toLowerCase();
      if (query && !name.includes(query)) return false;

      if (maxAgeEnabled) {
        const age = ageFromBirthDate(a.birthDate);
        if (age === null) return false; // если нет ДР — не попадает в "младше X"
        if (!(age < maxAge)) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "name") {
        const aa = fullName(a).toLowerCase();
        const bb = fullName(b).toLowerCase();
        return sortDir === "asc" ? aa.localeCompare(bb, "ru") : bb.localeCompare(aa, "ru");
      } else {
        const aa = ageFromBirthDate(a.birthDate);
        const bb = ageFromBirthDate(b.birthDate);

        // null (нет ДР) уводим вниз
        if (aa === null && bb === null) return 0;
        if (aa === null) return 1;
        if (bb === null) return -1;

        return sortDir === "asc" ? aa - bb : bb - aa;
      }
    });

    return list;
  }, [athletes, q, maxAgeEnabled, maxAge, sortBy, sortDir]);

  /* =======================
     UI
======================= */

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6 text-gray-100">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">{t.title}</h1>
        <p className="text-sm text-gray-400">{t.hint}</p>
      </header>

      {/* Add */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <form onSubmit={addAthlete} className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.first}</div>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.last}</div>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600"
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.birth}</div>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600"
            />
          </label>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
            >
              {t.add}
            </button>
          </div>
        </form>
      </section>

      {/* Search + filters */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            <div className="mb-1 text-gray-200 font-medium">{t.search}</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.searchPh}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none focus:ring focus:ring-gray-600 placeholder:text-gray-400"
            />
          </label>

          <div className="text-sm">
            <div className="mb-1 text-gray-200 font-medium">{t.sort}</div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none"
              >
                <option value="name">{t.sortName}</option>
                <option value="age">{t.sortAge}</option>
              </select>

              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
                className="w-32 rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none"
              >
                <option value="asc">{t.asc}</option>
                <option value="desc">{t.desc}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
          <div className="text-sm text-gray-200 font-medium mb-2">{t.filters}</div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={maxAgeEnabled}
                onChange={(e) => setMaxAgeEnabled(e.target.checked)}
              />
              {t.under}
            </label>

            <input
              type="number"
              min={1}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              disabled={!maxAgeEnabled}
              className="w-24 rounded-xl border border-gray-700 bg-gray-800 text-white px-3 py-2 outline-none disabled:opacity-50"
            />

            <span className="text-sm text-gray-300">{t.years}</span>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-white">{t.list}</h2>
          <span className="text-sm text-gray-400">{view.length}</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-950 text-gray-100">
              <tr className="border-b border-gray-800">
                <th className="py-3 px-4 font-medium">{t.first}</th>
                <th className="py-3 px-4 font-medium">{t.last}</th>
                <th className="py-3 px-4 font-medium">{t.birth}</th>
                <th className="py-3 px-4 font-medium">{t.age}</th>
                <th className="py-3 px-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {view.map((a, idx) => {
                const rowAge = ageFromBirthDate(a.birthDate);
                return (
                  <tr
                    key={a.id}
                    className={idx % 2 === 0 ? "bg-gray-900" : "bg-gray-950"}
                  >
                    <td className="py-3 px-4 text-white">{a.firstName}</td>
                    <td className="py-3 px-4 text-white">{a.lastName}</td>
                    <td className="py-3 px-4 text-gray-300">{a.birthDate ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-300">{rowAge ?? "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => removeAthlete(a.id)}
                        className="rounded-lg border border-gray-700 px-3 py-1 text-gray-200 hover:bg-gray-800"
                        title={t.del}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}

              {view.length === 0 && (
                <tr>
                  <td className="py-8 px-4 text-gray-400" colSpan={5}>
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
