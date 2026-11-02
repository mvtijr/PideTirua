import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchLocalBySlug, stripSensitiveLocalFields } from "@/lib/locales";
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

  const logoLocal = local.logo_url || local.logo;

  return {
    title: `Panel Admin — ${local.nombre} | PideTirúa`,
    description: `Acceso al panel de administración móvil para gestionar la carta y pedidos de ${local.nombre}.`,
    openGraph: {
      title: `Panel Admin — ${local.nombre} | PideTirúa`,
      description: `Acceso protegido al panel de administración de ${local.nombre} en PideTirúa.`,
      url: `https://pidetirua.cl/admin/${local.slug}`,
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
      title: `Panel Admin — ${local.nombre} | PideTirúa`,
      description: `Acceso protegido al panel de administración de ${local.nombre} en PideTirúa.`,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function AdminLocalPage({
  params,
}: AdminLocalPageProps) {
  const { slug } = await params;
  const local = await fetchLocalBySlug(slug);

  if (!local) {
    notFound();
  }

  const cookieStore = await cookies();
  const sesionCookie = cookieStore.get(`pidetirua_admin_${local.slug}`);
  const superAdminCookie = cookieStore.get("pidetirua_superadmin");
  const isSuperAdmin = superAdminCookie?.value === "authenticated";
  const initialAuthenticated =
    sesionCookie?.value === "authenticated" || isSuperAdmin;

  return (
    <AdminLocalClient
      initialLocal={initialAuthenticated ? local : stripSensitiveLocalFields(local)}
      initialAuthenticated={initialAuthenticated}
      initialSuperAdmin={isSuperAdmin}
    />
  );
}

