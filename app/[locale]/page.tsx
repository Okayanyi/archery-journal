const copy = {
  en: {
    title: "Archery Journal",
    desc: "Training web app for archery score tracking.",
  },
  ru: {
    title: "Archery Journal",
    desc: "Учебное веб-приложение для учёта результатов стрельбы.",
  },
  tr: {
    title: "Archery Journal",
    desc: "Okçuluk sonuçlarını takip etmek için web uygulaması.",
  },
} as const;

const locales = ["en", "ru", "tr"] as const;
type Locale = (typeof locales)[number];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : "en";

  return (
    <main className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">{copy[locale].title}</h1>
      <p className="text-gray-600">{copy[locale].desc}</p>
    </main>
  );
}
