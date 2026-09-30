import type { Metadata } from "next";
import { cookies } from "next/headers";
import { fetchAllLocales } from "@/lib/locales";
import SuperAdminClient from "@/components/SuperAdminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "SuperAdmin — Gestión Comercial SaaS | PideTirúa",
  description:
    "Panel Maestro de SuperAdmin para gestionar locales, planes comerciales (Autogestionado y Llave en Mano VIP) e identidad visual en PideTirúa.",
};

export default async function SuperAdminPage() {
  const locales = await fetchAllLocales();
  const cookieStore = await cookies();
  const superAdminCookie = cookieStore.get("pidetirua_superadmin");
  const initialAuthenticated = superAdminCookie?.value === "authenticated";

  return (
    <SuperAdminClient
      initialLocales={locales}
      initialAuthenticated={initialAuthenticated}
    />
  );
}
