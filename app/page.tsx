export default function HomePage() {
  return (
    <main className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">
        Archery Journal
      </h1>
      <p className="text-gray-600">
        Учебное web-приложение для учёта результатов стрельбы из лука.
      </p>

      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        <li>Участники</li>
        <li>Сессии стрельбы</li>
        <li>Настраиваемые форматы</li>
        <li>Фото мишеней (позже)</li>
      </ul>
    </main>
  );
}