"use client";

import { useMemo, useState } from "react";

type Athlete = {
  id: string;
  name: string;
  createdAt: string; // ISO date string
};

function uid() {
  // достаточно для локального MVP (позже заменим на uuid из БД)
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function ParticipantsPage() {
  const [name, setName] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([
    { id: uid(), name: "Татьяна", createdAt: new Date().toISOString() },
  ]);

  const sorted = useMemo(() => {
    return [...athletes].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [athletes]);

  function addAthlete(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;

    setAthletes((prev) => [
      { id: uid(), name: clean, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setName("");
  }

  function removeAthlete(id: string) {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Participants</h1>
        <p className="text-sm text-gray-600">
          Первый экран журнала: добавление и список участников (пока без базы).
        </p>
      </header>

      <section className="rounded-2xl border p-4">
        <h2 className="font-medium mb-3">Добавить участника</h2>

        <form onSubmit={addAthlete} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя (например, Паша)"
            className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring"
          />
          <button
            type="submit"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Добавить
          </button>
        </form>
      </section>

      <section className="rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Список</h2>
          <span className="text-sm text-gray-600">
            {sorted.length} шт.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b">
                <th className="py-2 pr-4">Имя</th>
                <th className="py-2 pr-4">Добавлен</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">{a.name}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {new Date(a.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <button
                      onClick={() => removeAthlete(a.id)}
                      className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td className="py-6 text-gray-600" colSpan={3}>
                    Пока пусто. Добавь первого участника.
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
