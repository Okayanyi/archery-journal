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

/* =======================
   Helpers
======================= */

const STORAGE_KEY = "archery.athletes.v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadAthletes(): Athlete[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* =======================
   Component
======================= */

export default function ParticipantsClient({ locale }: { locale: string }) {
  const [name, setName] = useState("");

  // ✅ КЛЮЧЕВОЙ МОМЕНТ:
  // читаем localStorage сразу при инициализации state
  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    if (typeof window === "undefined") return [];
    return loadAthletes();
  });

  // сохраняем при любом изменении
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes));
    } catch {
      // Safari private mode / quota — молча игнорируем
    }
  }, [athletes]);

  const sorted = useMemo(() => {
    return [...athletes].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [athletes]);

  function addAthlete(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;

    setAthletes((prev) => [
      {
        id: uid(),
        name: clean,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setName("");
  }

  function removeAthlete(id: string) {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }

  const t =
    locale === "ru"
      ? {
          title: "Участники",
          hint: "Добавление и список участников (сохраняется в браузере).",
          placeholder: "Имя (например, Паша)",
          add: "Добавить",
          list: "Список",
          empty: "Пока пусто. Добавь первого участника.",
        }
      : locale === "tr"
      ? {
          title: "Katılımcılar",
          hint: "Katılımcı ekleme ve liste (tarayıcıda saklanır).",
          placeholder: "İsim (örn. Pasha)",
          add: "Ekle",
          list: "Liste",
          empty: "Henüz boş. İlk katılımcıyı ekle.",
        }
      : {
          title: "Participants",
          hint: "Add and list athletes (saved in browser).",
          placeholder: "Name (e.g. Pasha)",
          add: "Add",
          list: "List",
          empty: "Empty. Add your first athlete.",
        };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-gray-600">{t.hint}</p>
      </header>

      <section className="rounded-2xl border bg-white p-4">
        <form onSubmit={addAthlete} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring"
          />
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            {t.add}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">{t.list}</h2>
          <span className="text-sm text-gray-600">{sorted.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-700">
              <tr className="border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Added</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">{a.name}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <button
                      onClick={() => removeAthlete(a.id)}
                      className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && (
                <tr>
                  <td className="py-6 text-gray-600" colSpan={3}>
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
