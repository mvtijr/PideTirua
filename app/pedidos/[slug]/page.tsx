import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  fetchLocalBySlug,
  stripSensitiveLocalFields,
  verifyTokenCocinaInSupabase,
} from "@/lib/locales";
import { isKdsAuthorized } from "@/lib/security";
import PedidosStaffClient from "@/components/PedidosStaffClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PedidosPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: PedidosPageProps): Promise<Metadata> {
  const { slug } = await params;
  const local = await fetchLocalBySlug(slug);

  if (!local) {
    return {
      title: "Monitor no encontrado | PideTirúa",
    };
  }

  return {
    title: `Monitor de Pedidos — ${local.nombre} | PideTirúa`,
    description: `Pantalla de comandas y pedidos en tiempo real para personal y cocina de ${local.nombre}.`,
    openGraph: {
      title: `Monitor de Pedidos — ${local.nombre} | PideTirúa`,
      description: `Comandas en tiempo real para personal de ${local.nombre}.`,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "PideTirúa — Monitor de Pedidos",
        },
      ],
    },
  };
}

export default async function PedidosPage({
  params,
  searchParams,
}: PedidosPageProps) {
  const { slug } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const tokenQuery = typeof queryParams.token === "string" ? queryParams.token : undefined;

  const local = await fetchLocalBySlug(slug);
  if (!local) {
    notFound();
  }

  const cookieStore = await cookies();
  let initialAuthenticated = isKdsAuthorized(cookieStore, local.slug);

  // Si viene con token válido en la URL:
  if (!initialAuthenticated && tokenQuery) {
    const tokenValido = await verifyTokenCocinaInSupabase(local.slug, tokenQuery);
    if (tokenValido) {
      initialAuthenticated = true;
    }
  }

  return (
    <PedidosStaffClient
      local={stripSensitiveLocalFields(local)}
      initialAuthenticated={initialAuthenticated}
      tokenFromQuery={tokenQuery}
    />
  );
}
