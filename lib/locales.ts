import localesData from "@/data/locales.json";
import { CategoriaFiltro, Local } from "@/types/local";

export const CATEGORIAS_DIRECTORIO: CategoriaFiltro[] = [
  "Todos",
  "Sushi",
  "Comida Rápida",
  "Pescados y Mariscos",
  "Cafetería",
];

export function getAllLocales(): Local[] {
  return localesData as Local[];
}

export function getLocalBySlug(slug: string): Local | undefined {
  const locales = getAllLocales();
  return locales.find(
    (local) => local.slug.toLowerCase() === slug.toLowerCase()
  );
}
