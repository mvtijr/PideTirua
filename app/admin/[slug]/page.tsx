import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchLocalBySlug } from "@/lib/locales";
import AdminLocalClient from "@/components/AdminLocalClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminLocalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: AdminLocalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const local = await fetchLocalBySlug(slug);

  if (!local) {
    return {
      title: "Admin no encontrado | PideTirúa",
    };
  }

  return {
    title: `Admin — ${local.nombre} | PideTirúa`,
    description: `Panel de administración móvil para gestionar estado y productos de ${local.nombre}.`,
  };
}

export default async function AdminLocalPage({ params }: AdminLocalPageProps) {
  const { slug } = await params;
  const local = await fetchLocalBySlug(slug);

  if (!local) {
    notFound();
  }

  const cookieStore = await cookies();
  const sesionCookie = cookieStore.get(`pidetirua_admin_${local.slug}`);
  const initialAuthenticated = sesionCookie?.value === "authenticated";

  return (
    <AdminLocalClient
      initialLocal={local}
      initialAuthenticated={initialAuthenticated}
    />
  );
}
