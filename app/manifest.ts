import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PideTirúa - Comida Local y Cartas Digitales",
    short_name: "PideTirúa",
    description:
      "Plataforma de pedidos con retiro en local y menús digitales de la comuna de Tirúa y Quidico",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#EA580C",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
