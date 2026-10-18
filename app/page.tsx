import { fetchActiveLocales, sanitizeLocalesForPublic } from "@/lib/locales";
import DirectoryClient from "@/components/DirectoryClient";

export const revalidate = 60; // Revalida cada 60 segundos en segundo plano (ISR)

export default async function DirectorioComunalPage() {
  const locales = await fetchActiveLocales();

  return <DirectoryClient locales={sanitizeLocalesForPublic(locales)} />;
}
