import { fetchActiveLocales, sanitizeLocalesForPublic } from "@/lib/locales";
import DirectoryClient from "@/components/DirectoryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DirectorioComunalPage() {
  const locales = await fetchActiveLocales();
  const publicLocales = sanitizeLocalesForPublic(locales);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Restaurantes y Locales Gastronómicos en Tirúa y Quidico",
    description:
      "Directorio oficial de locales gastronómicos con cartas digitales en Tirúa y Quidico, Región del Biobío.",
    itemListElement: publicLocales.map((loc, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: loc.nombre,
      url: `https://pidetirua.cl/${loc.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DirectoryClient locales={publicLocales} />
    </>
  );
}
