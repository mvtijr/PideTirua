import type { Metadata, Viewport } from "next";
import InstallPWA from "@/components/InstallPWA";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#EA580C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pidetirua.cl"),
  alternates: {
    canonical: "https://www.pidetirua.cl",
  },
  title: "PideTirúa — Sabores de nuestra tierra | Tirúa y Quidico",
  description:
    "Plataforma de pedidos con retiro en local y cartas digitales QR de la comuna de Tirúa y Quidico (Región del Biobío, Chile). Revisa el menú digital y realiza tu pedido directo al WhatsApp de cada local.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PideTirúa",
  },
  openGraph: {
    title: "PideTirúa — Sabores de nuestra tierra | Tirúa y Quidico",
    description:
      "Plataforma gastronómica de Tirúa y Quidico. Revisa cartas digitales, pide antes de salir y coordina directo por WhatsApp con cada restaurante.",
    url: "https://pidetirua.cl",
    siteName: "PideTirúa",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PideTirúa — Sabores de Nuestra Tierra",
        type: "image/jpeg",
      },
      {
        url: "/og-image-square.jpg",
        width: 1024,
        height: 1024,
        alt: "Logo Oficial PideTirúa",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PideTirúa — Sabores de nuestra tierra | Tirúa y Quidico",
    description:
      "Plataforma gastronómica de Tirúa y Quidico. Revisa cartas digitales y pide directo por WhatsApp.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <head>
        {/* Google tag (gtag.js) — Google Analytics & Tag Manager */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-C636MXRRBH"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-C636MXRRBH');`,
          }}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EA580C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PideTirúa" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta property="og:site_name" content="PideTirúa" />
        <meta property="og:image" content="https://pidetirua.cl/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://pidetirua.cl/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Schema.org WebSite & Organization for Google Search branding & favicon */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.pidetirua.cl/#website",
                  "url": "https://www.pidetirua.cl",
                  "name": "PideTirúa",
                  "alternateName": ["Pide Tirua", "pidetirua.cl"],
                  "description": "Plataforma gastronómica de Tirúa y Quidico",
                  "inLanguage": "es-CL"
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.pidetirua.cl/#organization",
                  "name": "PideTirúa",
                  "url": "https://www.pidetirua.cl",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.pidetirua.cl/logo-pidetirua.jpg",
                    "width": "1024",
                    "height": "1024"
                  }
                }
              ]
            })
          }}
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FAF8F5] font-body text-[#18181B] antialiased selection:bg-[#EA580C] selection:text-white min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NMXRS2XW"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <InstallPWA />
        {children}
      </body>
    </html>
  );
}

