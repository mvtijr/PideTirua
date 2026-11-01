import { fetchActiveLocales, sanitizeLocalesForPublic } from "@/lib/locales";
import DirectoryClient from "@/components/DirectoryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DirectorioComunalPage() {
  const locales = await fetchActiveLocales();

  return <DirectoryClient locales={sanitizeLocalesForPublic(locales)} />;
}
