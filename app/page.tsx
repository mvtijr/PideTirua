import { fetchAllLocales } from "@/lib/locales";
import DirectoryClient from "@/components/DirectoryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DirectorioComunalPage() {
  const locales = await fetchAllLocales();

  return <DirectoryClient locales={locales} />;
}
