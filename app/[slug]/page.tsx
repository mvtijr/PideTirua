import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllLocales, getLocalBySlug } from "@/lib/locales";
import MenuClient from "@/components/MenuClient";

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
  const local = getLocalBySlug(slug);

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
  const local = getLocalBySlug(slug);

  if (!local) {
    notFound();
  }

  return <MenuClient local={local} />;
}
