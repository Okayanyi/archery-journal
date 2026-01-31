import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Archery Journal",
  description: "Журнал учёта результатов стрельбы из лука",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen grid grid-cols-[220px_1fr]">
          <aside className="border-r bg-white p-4">
            <div className="font-semibold mb-6">🏹 Archery</div>

            <nav className="space-y-2 text-sm">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 hover:bg-gray-100"
              >
                Home
              </Link>
              <Link
                href="/participants"
                className="block rounded-lg px-3 py-2 hover:bg-gray-100"
              >
                Participants
              </Link>
              <Link
                href="/sessions"
                className="block rounded-lg px-3 py-2 hover:bg-gray-100"
              >
                Sessions
              </Link>
            </nav>
          </aside>

          <div className="p-6">{children}</div>
        </div>
      </body>
    </html>
  );
}