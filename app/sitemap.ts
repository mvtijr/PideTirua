import { MetadataRoute } from "next";
import { fetchActiveLocales } from "@/lib/locales";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.pidetirua.cl";
  const locales = await fetchActiveLocales(true);

  const localUrls: MetadataRoute.Sitemap = locales.map((local) => ({
    url: `${baseUrl}/${local.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...localUrls,
  ];
}
