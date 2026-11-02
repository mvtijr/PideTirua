import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchLocalBySlug,
  getAllLocales,
  stripSensitiveLocalFields,
} from "@/lib/locales";
import MenuClient from "@/components/MenuClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LocalMenuPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const locales = getAllLocales();
  return locales.map((local) => ({
    slug: local.slug,
  }));
}

export async function generateMetadata({
  params,
}: LocalMenuPageProps): Promise<Metadata> {
  const { slug } = await params;
  const local = await fetchLocalBySlug(slug, true);

  if (!local) {
    return {
      title: "Local no encontrado | PideTirúa",
    };
  }

  const portada = local.banner_url || local.fotoPortada || "/og-image.jpg";
  const logoLocal = local.logo_url || local.logo;

  return {
    title: `${local.nombre} — Carta Digital QR | PideTirúa`,
    description: `${local.rubro} en ${local.ubicacion}. Revisa el menú digital de ${local.nombre} y pide directo a su WhatsApp.`,
    openGraph: {
      title: `${local.nombre} — Carta Digital QR | PideTirúa`,
      description: `${local.rubro} en ${local.ubicacion}. Revisa la carta digital completa y realiza tu pedido directo.`,
      url: `https://pidetirua.cl/${local.slug}`,
      siteName: "PideTirúa",
      locale: "es_CL",
      type: "website",
      images: [
        {
          url: portada,
          width: 1200,
          height: 630,
          alt: `Carta digital ${local.nombre}`,
        },
        ...(logoLocal
          ? [
              {
                url: logoLocal,
                width: 512,
                height: 512,
                alt: `Logo ${local.nombre}`,
              },
            ]
          : []),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${local.nombre} — Carta Digital QR | PideTirúa`,
      description: `${local.rubro} en ${local.ubicacion}.`,
      images: [portada],
    },
  };
}

export default async function LocalMenuPage({ params }: LocalMenuPageProps) {
  const { slug } = await params;
  const local = await fetchLocalBySlug(slug, true);

  if (!local) {
    notFound();
  }

  return <MenuClient local={stripSensitiveLocalFields(local)} />;
}
