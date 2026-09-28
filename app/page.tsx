import { getAllLocales } from "@/lib/locales";
import DirectoryClient from "@/components/DirectoryClient";

export default function DirectorioComunalPage() {
  const locales = getAllLocales();

  return <DirectoryClient locales={locales} />;
}
