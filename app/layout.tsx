import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PideTirúa — Sabores de nuestra tierra | Tirúa y Quidico",
  description:
    "Plataforma gastronómica comunal de Tirúa y Quidico (Región del Biobío, Chile). Explora cartas digitales por QR y realiza tu pedido directo al WhatsApp de cada local.",
  icons: {
    icon: "/logo-pidetirua.jpg",
    apple: "/logo-pidetirua.jpg",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Epilogue:wght@600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed">
        {children}
      </body>
    </html>
  );
}
