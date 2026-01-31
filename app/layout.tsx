import "./globals.css";

export const metadata = {
  title: "Archery Journal",
  description: "Archery score journal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
