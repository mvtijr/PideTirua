import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PideTirúa — Sabores de nuestra tierra | Tirúa y Quidico",
  description:
    "Plataforma gastronómica comunal de Tirúa y Quidico (Región del Biobío, Chile). Explora cartas digitales por QR y realiza tu pedido directo al WhatsApp de cada local.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
