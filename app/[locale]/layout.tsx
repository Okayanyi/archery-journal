import Link from "next/link";

const locales = ["en", "ru", "tr"] as const;

const labels = {
  en: { home: "Home", participants: "Participants", sessions: "Sessions", journal: "journal" },
  ru: { home: "Главная", participants: "Участники", sessions: "Сессии", journal: "журнал" },
  tr: { home: "Ana sayfa", participants: "Katılımcılar", sessions: "Oturumlar", journal: "kayıt" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  const locale = (locales as readonly string[]).includes(rawLocale) ? rawLocale : "en";
  const t = labels[locale as (typeof locales)[number]];

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="bg-gray-900 text-gray-100 p-4">
        <div className="mb-8">
          <div className="text-lg font-semibold tracking-wide">🏹 Archery</div>
          <div className="text-xs text-gray-400">{t.journal}</div>
        </div>

        <nav className="space-y-1 text-sm mb-6">
          <Link
            href={`/${locale}`}
            className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            {t.home}
          </Link>
          <Link
            href={`/${locale}/participants`}
            className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            {t.participants}
          </Link>
          <Link
            href={`/${locale}/sessions`}
            className="block rounded-lg px-3 py-2 text-gray-200 hover:bg-gray-800 hover:text-white"
          >
            {t.sessions}
          </Link>
        </nav>

        <div className="border-t border-gray-800 pt-4 space-y-1 text-xs">
          {locales.map((l) => (
            <Link
              key={l}
              href={`/${l}`}
              className={`block px-2 py-1 rounded ${
                l === locale ? "text-white font-medium" : "text-gray-400 hover:text-white"
              }`}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
      </aside>

      <div className="p-6">{children}</div>
    </div>
  );
}
