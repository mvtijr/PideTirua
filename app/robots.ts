import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/pedidos/", "/api/", "/superadmin/"],
    },
    sitemap: "https://www.pidetirua.cl/sitemap.xml",
  };
}
