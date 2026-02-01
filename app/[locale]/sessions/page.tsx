import SessionsClient from "./sessions-client";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SessionsClient locale={locale} />;
}
