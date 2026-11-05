import { MetadataRoute } from "next";
import { getAllLocales } from "@/lib/locales";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://pidetirua.cl";
  const locales = getAllLocales().filter((l) => l.activo !== false);

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
