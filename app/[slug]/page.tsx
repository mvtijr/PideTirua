import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchLocalBySlug,
  getAllLocales,
  stripSensitiveLocalFields,
} from "@/lib/locales";
import MenuClient from "@/components/MenuClient";

export const revalidate = 60; // Revalida cada 60 segundos en segundo plano (ISR)

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

  return {
    title: `${local.nombre} — Carta Digital QR | PideTirúa`,
    description: `${local.rubro} en ${local.ubicacion}. Revisa el menú digital de ${local.nombre} y pide directo a su WhatsApp.`,
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
