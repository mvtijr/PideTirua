import { fetchActiveLocales, sanitizeLocalesForPublic } from "@/lib/locales";
import { esOfertaValidaHoy } from "@/lib/formatters";
import DirectoryClient from "@/components/DirectoryClient";
import {
  HomeEditorialContent,
  HomeFooter,
} from "@/components/HomeEditorialFooter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DirectorioComunalPage() {
  const locales = await fetchActiveLocales();
  const publicLocales = sanitizeLocalesForPublic(locales);

  // Recorta campos profundos (grupos de opciones) no utilizados en la portada para minimizar hidratación SSR
  const directoryLocales = publicLocales.map((loc) => ({
    ...loc,
    categorias: (loc.categorias || []).map((cat) => ({
      ...cat,
      productos: (cat.productos || []).map((p) => {
        const lightProd = { ...p };
        delete lightProd.opciones;
        return lightProd;
      }),
    })),
  }));

  const hasOfertas = directoryLocales.some(
    (loc) =>
      loc.activo !== false &&
      (loc.categorias || []).some((cat) =>
        (cat.productos || []).some((p) => esOfertaValidaHoy(p))
      )
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Restaurantes y Locales Gastronómicos en Tirúa y Quidico",
    description:
      "Directorio oficial de locales gastronómicos con cartas digitales en Tirúa y Quidico, Región del Biobío.",
    itemListElement: directoryLocales.map((loc, idx) => ({
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
      <DirectoryClient
        locales={directoryLocales}
        editorialContent={<HomeEditorialContent />}
        footerContent={<HomeFooter hasOfertas={hasOfertas} />}
      />
    </>
  );
}
