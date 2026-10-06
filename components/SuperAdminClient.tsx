"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  LogOut,
  PlusCircle,
  Edit3,
  Store,
  Crown,
  Zap,
  Phone,
  MapPin,
  Clock,
  KeyRound,
  ImagePlus,
  ExternalLink,
  CheckCircle2,
  Loader2,
  X,
  TrendingUp,
  Users,
  ArrowLeft,
  Camera,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Video,
  Trash2,
  CreditCard,
  MessageCircle,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Local, PlanComercial, SectorComuna } from "@/types/local";
import { formatCLP, formatPhoneDisplay } from "@/lib/formatters";
import { getSupabaseClient } from "@/lib/supabase";

interface SuperAdminClientProps {
  initialLocales: Local[];
  initialAuthenticated?: boolean;
}

interface DatosCobroSuperAdmin {
  nombre: string;
  rut: string;
  banco: string;
  cuenta: string;
  correo: string;
}

const SESSION_KEY = "pidetirua_superadmin_session";
const DATOS_COBRO_KEY = "pidetirua_superadmin_datos_cobro";

const DEFAULT_DATOS_COBRO: DatosCobroSuperAdmin = {
  nombre: "",
  rut: "",
  banco: "BancoEstado",
  cuenta: "",
  correo: "",
};

function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calcularEstadoCobranza(loc: Local): {
  alDia: boolean;
  diaCobro: number;
  fechaUltimoPago: string;
} {
  const diaCobro =
    typeof loc.dia_cobro === "number" &&
    loc.dia_cobro >= 1 &&
    loc.dia_cobro <= 31
      ? Math.round(loc.dia_cobro)
      : 5;

  const fechaUltimoPago = (loc.fecha_ultimo_pago || "").slice(0, 10);
  const now = new Date();
  const hoyAnio = now.getFullYear();
  const hoyMes = now.getMonth() + 1;
  const hoyDia = now.getDate();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaUltimoPago)) {
    return {
      alDia: hoyDia <= diaCobro,
      diaCobro,
      fechaUltimoPago: getTodayDateStr(),
    };
  }

  const [pagoAnio, pagoMes] = fechaUltimoPago.split("-").map(Number);
  const mesesDiferencia = (hoyAnio - pagoAnio) * 12 + (hoyMes - pagoMes);

  // Si ya pagó en el mes en curso (o posterior), está al día.
  if (mesesDiferencia <= 0) {
    return { alDia: true, diaCobro, fechaUltimoPago };
  }

  // Si su último pago fue el mes pasado y aún no pasa el día de cobro de este mes, sigue al día.
  if (mesesDiferencia === 1 && hoyDia <= diaCobro) {
    return { alDia: true, diaCobro, fechaUltimoPago };
  }

  // En cualquier otro caso, el pago está vencido.
  return { alDia: false, diaCobro, fechaUltimoPago };
}

function buildWhatsAppCobroUrl(
  loc: Local,
  precioPlan: number,
  datosCobro: DatosCobroSuperAdmin
): string {
  const telefonoLimpio = (
    loc.telefono_whatsapp ||
    loc.telefonoWhatsapp ||
    ""
  ).replace(/\D/g, "");
  const precioTexto = `${formatCLP(precioPlan)} CLP`;
  const tuBanco = datosCobro.banco.trim() || "BancoEstado";
  const tuRut = datosCobro.rut.trim() || "Por confirmar";
  const tuCuenta = datosCobro.cuenta.trim() || "Por confirmar";
  const tuNombre = datosCobro.nombre.trim() || "Administración PideTirúa";
  const tuCorreo = datosCobro.correo.trim();

  const lineasDatos = [
    `- Banco: ${tuBanco}`,
    `- Tipo: CuentaRUT`,
    `- RUT: ${tuRut}`,
    `- N°: ${tuCuenta}`,
    `- Nombre: ${tuNombre}`,
    ...(tuCorreo ? [`- Correo: ${tuCorreo}`] : []),
  ].join("\n");

  const mensaje = `Hola ${loc.nombre}, un gusto saludarte desde PideTirúa. Te escribo para recordarte la renovación mensual de tu menú digital y sistema de pedidos (${precioTexto}).\n\nTe comparto los datos para la transferencia:\n${lineasDatos}\n\nQuedo atento a la captura de tu comprobante para mantener tu servicio al día. ¡Muchas gracias y que sigan las buenas ventas!`;

  return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
}

async function compressImageFileToDataUrl(
  file: File,
  maxDim = 1400
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Archivo de imagen inválido"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function slugifyTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SuperAdminClient({
  initialLocales,
  initialAuthenticated = false,
}: SuperAdminClientProps) {
  const [locales, setLocales] = useState<Local[]>(initialLocales);
  const [autenticado, setAutenticado] = useState<boolean>(initialAuthenticated);
  const [verificandoSesion, setVerificandoSesion] = useState<boolean>(
    !initialAuthenticated
  );

  // Estado de Clave Maestra
  const [claveMaestra, setClaveMaestra] = useState<string>("");
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [validandoClave, setValidandoClave] = useState<boolean>(false);

  // Toast de feedback
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);
  const [guardandoSlug, setGuardandoSlug] = useState<string | null>(null);
  const [registrandoPagoSlug, setRegistrandoPagoSlug] = useState<string | null>(
    null
  );

  // Estado de "💳 Mis Datos de Cobro (SuperAdmin)"
  const [datosCobro, setDatosCobro] =
    useState<DatosCobroSuperAdmin>(DEFAULT_DATOS_COBRO);
  const [mostrarDatosCobro, setMostrarDatosCobro] = useState<boolean>(false);

  // Estado para revelar/ocultar y editar de forma inmediata el PIN de Acceso por tarjeta
  const [pinVisiblePorSlug, setPinVisiblePorSlug] = useState<
    Record<string, boolean>
  >({});
  const [pinEditandoPorSlug, setPinEditandoPorSlug] = useState<
    Record<string, boolean>
  >({});
  const [pinDraftPorSlug, setPinDraftPorSlug] = useState<
    Record<string, string>
  >({});
  const [guardandoPinSlug, setGuardandoPinSlug] = useState<string | null>(null);

  // Estado del Formulario "+ Registrar Nuevo Local" / "Editar Local"
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [modoEdicionId, setModoEdicionId] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");

  const [formNombre, setFormNombre] = useState<string>("");
  const [formSlug, setFormSlug] = useState<string>("");
  const [slugEditadoManual, setSlugEditadoManual] = useState<boolean>(false);
  const [formRubro, setFormRubro] = useState<string>("");
  const [formSector, setFormSector] = useState<SectorComuna>("Tirúa Centro");
  const [formTelefono, setFormTelefono] = useState<string>("569");
  const [formDireccion, setFormDireccion] = useState<string>("");
  const [formHorario, setFormHorario] = useState<string>("12:00 a 22:30 hrs");
  const [formPin, setFormPin] = useState<string>("1234");
  const [formPlan, setFormPlan] = useState<PlanComercial>("autogestionado");
  const [formPrecioMensual, setFormPrecioMensual] = useState<number>(15000);
  const [formDiaCobro, setFormDiaCobro] = useState<number>(5);
  const [formFechaUltimoPago, setFormFechaUltimoPago] = useState<string>(() =>
    getTodayDateStr()
  );
  const [formLogoUrl, setFormLogoUrl] = useState<string>("");
  const [formBannerUrl, setFormBannerUrl] = useState<string>("");
  const [formBannerVideoUrl, setFormBannerVideoUrl] = useState<string>("");
  const [formActivo, setFormActivo] = useState<boolean>(true);

  const [subiendoLogo, setSubiendoLogo] = useState<boolean>(false);
  const [subiendoBanner, setSubiendoBanner] = useState<boolean>(false);
  const [subiendoVideo, setSubiendoVideo] = useState<boolean>(false);
  const [guardandoForm, setGuardandoForm] = useState<boolean>(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const inputLogoRef = useRef<HTMLInputElement | null>(null);
  const inputBannerRef = useRef<HTMLInputElement | null>(null);
  const inputVideoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const guardadoCobro = localStorage.getItem(DATOS_COBRO_KEY);
      if (guardadoCobro) {
        const parsed = JSON.parse(guardadoCobro) as Partial<DatosCobroSuperAdmin>;
        setDatosCobro({
          nombre: parsed.nombre || "",
          rut: parsed.rut || "",
          banco: parsed.banco || "BancoEstado",
          cuenta: parsed.cuenta || "",
          correo: parsed.correo || "",
        });
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  const recargarLocales = async () => {
    try {
      const res = await fetch("/api/superadmin", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.locales)) {
        setLocales(data.locales);
      }
    } catch {
      // Ignorar fallas de red
    }
  };

  useEffect(() => {
    if (initialAuthenticated) {
      setAutenticado(true);
      setVerificandoSesion(false);
      return;
    }
    try {
      const guardado = localStorage.getItem(SESSION_KEY);
      if (guardado === "authenticated") {
        setAutenticado(true);
        void recargarLocales();
      }
    } catch {
      // Ignorar
    } finally {
      setVerificandoSesion(false);
    }
  }, [initialAuthenticated]);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
  };

  const handleGuardarDatosCobro = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(DATOS_COBRO_KEY, JSON.stringify(datosCobro));
      mostrarToast("💳 Mis Datos de Cobro guardados correctamente");
      setMostrarDatosCobro(false);
    } catch {
      mostrarToast("No se pudieron guardar los datos en el navegador");
    }
  };

  useEffect(() => {
    if (!toastMensaje) return;
    const t = setTimeout(() => setToastMensaje(null), 3200);
    return () => clearTimeout(t);
  }, [toastMensaje]);

  const handleLoginSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveMaestra.trim() || validandoClave) return;
    setValidandoClave(true);
    setErrorClave(null);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-key",
          key: claveMaestra.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorClave(
          data.error || "Clave Maestra incorrecta. Intenta nuevamente."
        );
        return;
      }

      try {
        localStorage.setItem(SESSION_KEY, "authenticated");
        document.cookie =
          "pidetirua_superadmin=authenticated; path=/; max-age=604800; SameSite=Lax";
      } catch {
        // Ignorar
      }

      setAutenticado(true);
      void recargarLocales();
      mostrarToast("Sesión SuperAdmin iniciada");
    } catch {
      setErrorClave("Error de conexión al verificar la Clave Maestra.");
    } finally {
      setValidandoClave(false);
    }
  };

  const handleLogoutSuperAdmin = async () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      document.cookie = "pidetirua_superadmin=; path=/; max-age=0";
      await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // Ignorar
    }
    setClaveMaestra("");
    setAutenticado(false);
  };

  const abrirFormularioNuevoLocal = () => {
    setModoEdicionId(null);
    setOriginalSlug("");
    setFormNombre("");
    setFormSlug("");
    setSlugEditadoManual(false);
    setFormRubro("");
    setFormSector("Tirúa Centro");
    setFormTelefono("569");
    setFormDireccion("");
    setFormHorario("12:00 a 22:30 hrs");
    setFormPin("1234");
    setFormPlan("autogestionado");
    setFormPrecioMensual(15000);
    setFormDiaCobro(5);
    setFormFechaUltimoPago(getTodayDateStr());
    setFormLogoUrl("");
    setFormBannerUrl("");
    setFormBannerVideoUrl("");
    setFormActivo(true);
    setErrorForm(null);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirFormularioEditarLocal = (loc: Local) => {
    const planActual: PlanComercial =
      loc.plan === "llave_en_mano" ? "llave_en_mano" : "autogestionado";
    const precioActual =
      typeof loc.precio_mensual === "number" && loc.precio_mensual > 0
        ? loc.precio_mensual
        : planActual === "llave_en_mano"
        ? 28000
        : 15000;

    setModoEdicionId(loc.id);
    setOriginalSlug(loc.slug);
    setFormNombre(loc.nombre);
    setFormSlug(loc.slug);
    setSlugEditadoManual(true);
    setFormRubro(loc.rubro);
    setFormSector(loc.sector || "Tirúa Centro");
    setFormTelefono(loc.telefono_whatsapp || loc.telefonoWhatsapp);
    setFormDireccion(loc.direccion || loc.direccionDetalle);
    setFormHorario(loc.horario || "12:00 a 22:30 hrs");
    setFormPin(loc.pin || "1234");
    setFormPlan(planActual);
    setFormPrecioMensual(precioActual);
    setFormDiaCobro(
      typeof loc.dia_cobro === "number" &&
        loc.dia_cobro >= 1 &&
        loc.dia_cobro <= 31
        ? loc.dia_cobro
        : 5
    );
    setFormFechaUltimoPago(
      loc.fecha_ultimo_pago?.slice(0, 10) || getTodayDateStr()
    );
    setFormLogoUrl(loc.logo_url || loc.logo);
    setFormBannerUrl(loc.banner_url || loc.fotoPortada);
    setFormBannerVideoUrl(loc.banner_video_url || loc.videoPortada || "");
    setFormActivo(loc.activo !== false);
    setErrorForm(null);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const subirImagenSuperAdmin = async (
    file: File,
    tipo: "logo" | "banner"
  ) => {
    const slugRef = formSlug.trim() || slugifyTexto(formNombre) || "negocio";
    if (tipo === "logo") setSubiendoLogo(true);
    else setSubiendoBanner(true);
    setErrorForm(null);

    try {
      const dataUrl = await compressImageFileToDataUrl(
        file,
        tipo === "logo" ? 700 : 1600
      );
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-imagen",
          slug: slugRef,
          dataUrl,
          fileName: `${tipo}-${file.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Error al subir imagen");
      }
      if (tipo === "logo") {
        setFormLogoUrl(String(data.url));
        mostrarToast("Logo subido al bucket 'platos'");
      } else {
        setFormBannerUrl(String(data.url));
        mostrarToast("Foto de Portada (Banner) subida al bucket 'platos'");
      }
    } catch (err) {
      setErrorForm(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      if (tipo === "logo") setSubiendoLogo(false);
      else setSubiendoBanner(false);
    }
  };

  const subirVideoPortadaSuperAdmin = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setErrorForm(
        "El archivo de video supera los 25 MB. Te recomendamos un video corto de menos de 15 MB para carga rápida en celulares."
      );
      return;
    }

    const slugRef = formSlug.trim() || slugifyTexto(formNombre) || "negocio";
    setSubiendoVideo(true);
    setErrorForm(null);

    try {
      const supabase = getSupabaseClient();
      const ext = file.name.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
      const contentType =
        file.type || (ext === "webm" ? "video/webm" : "video/mp4");
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-");
      const storagePath = `${slugRef}/banner-video-${Date.now()}-${safeName}`;

      let { error: uploadErr } = await supabase.storage
        .from("platos")
        .upload(storagePath, file, {
          contentType,
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadErr) {
        await fetch("/api/superadmin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ensure-video-bucket" }),
        }).catch(() => {});

        const retry = await supabase.storage
          .from("platos")
          .upload(storagePath, file, {
            contentType,
            upsert: true,
            cacheControl: "3600",
          });
        uploadErr = retry.error;
      }

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const { data: pubData } = supabase.storage
        .from("platos")
        .getPublicUrl(storagePath);

      if (!pubData?.publicUrl) {
        throw new Error("No se pudo obtener la URL pública del video");
      }

      setFormBannerVideoUrl(pubData.publicUrl);
      mostrarToast("🎥 Video de Portada subido al bucket 'platos'");
    } catch (err) {
      setErrorForm(
        err instanceof Error
          ? `Error subiendo video: ${err.message}`
          : "No se pudo subir el video de portada"
      );
    } finally {
      setSubiendoVideo(false);
    }
  };

  const handleGuardarLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoForm) return;

    if (!formNombre.trim()) {
      setErrorForm("Por favor ingresa el nombre comercial del negocio.");
      return;
    }
    const slugFinal = formSlug.trim() || slugifyTexto(formNombre);
    if (!slugFinal) {
      setErrorForm("Por favor ingresa un slug válido (ej: don-pepe).");
      return;
    }

    setGuardandoForm(true);
    setErrorForm(null);

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert-local",
          id: modoEdicionId || undefined,
          originalSlug: originalSlug || undefined,
          nombre: formNombre.trim(),
          slug: slugFinal,
          rubro: formRubro.trim() || "Gastronomía Local",
          sector: formSector,
          telefono_whatsapp: formTelefono.trim(),
          direccion: formDireccion.trim() || "Tirúa",
          horario: formHorario.trim() || "12:00 a 22:30 hrs",
          pin: formPin.trim() || "1234",
          plan: formPlan,
          precio_mensual: formPrecioMensual,
          dia_cobro: formDiaCobro,
          fecha_ultimo_pago: formFechaUltimoPago,
          logo_url: formLogoUrl.trim(),
          banner_url: formBannerUrl.trim(),
          banner_video_url: formBannerVideoUrl.trim() || null,
          activo: formActivo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorForm(data.error || "No se pudo guardar el local.");
        return;
      }

      if (Array.isArray(data.locales)) {
        setLocales(data.locales);
      }
      setMostrarFormulario(false);
      mostrarToast(
        modoEdicionId
          ? `Local "${formNombre.trim()}" actualizado en Supabase`
          : `Nuevo local "${formNombre.trim()}" registrado con éxito`
      );
    } catch {
      setErrorForm("Error de conexión al guardar en Supabase.");
    } finally {
      setGuardandoForm(false);
    }
  };

  const handleRegistrarPago = async (loc: Local) => {
    if (registrandoPagoSlug === loc.slug) return;
    const fechaHoy = getTodayDateStr();
    setRegistrandoPagoSlug(loc.slug);

    setLocales((prev) =>
      prev.map((l) =>
        l.slug === loc.slug ? { ...l, fecha_ultimo_pago: fechaHoy } : l
      )
    );

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registrar-pago",
          slug: loc.slug,
          fecha_ultimo_pago: fechaHoy,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.locales)) {
        setLocales(data.locales);
      }
      mostrarToast("Pago registrado con éxito");
    } catch {
      mostrarToast("No se pudo registrar el pago en Supabase");
    } finally {
      setRegistrandoPagoSlug(null);
    }
  };

  const handleToggleActivo = async (loc: Local) => {
    const activoActual = loc.activo !== false;
    const nuevoActivo = !activoActual;

    setGuardandoSlug(loc.slug);
    setLocales((prev) =>
      prev.map((l) => (l.slug === loc.slug ? { ...l, activo: nuevoActivo } : l))
    );

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-activo",
          slug: loc.slug,
          activo: nuevoActivo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.locales)) {
        setLocales(data.locales);
      }
      mostrarToast(
        nuevoActivo
          ? `🟢 "${loc.nombre}" activado en el portal público`
          : `🔴 "${loc.nombre}" suspendido temporalmente`
      );
    } finally {
      setGuardandoSlug(null);
    }
  };

  const handleGuardarPinRapido = async (loc: Local) => {
    const pinNuevo = (pinDraftPorSlug[loc.slug] ?? loc.pin ?? "1234")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (pinNuevo.length !== 4) {
      mostrarToast("El PIN debe tener exactamente 4 dígitos numéricos");
      return;
    }

    setGuardandoPinSlug(loc.slug);
    setLocales((prev) =>
      prev.map((l) => (l.slug === loc.slug ? { ...l, pin: pinNuevo } : l))
    );

    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-pin",
          slug: loc.slug,
          pin: pinNuevo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.locales)) {
        setLocales(data.locales);
      }
      setPinEditandoPorSlug((prev) => ({ ...prev, [loc.slug]: false }));
      setPinVisiblePorSlug((prev) => ({ ...prev, [loc.slug]: true }));
      mostrarToast(`🔑 Nuevo PIN (${pinNuevo}) guardado para "${loc.nombre}"`);
    } catch {
      mostrarToast("No se pudo guardar el nuevo PIN");
    } finally {
      setGuardandoPinSlug(null);
    }
  };

  if (verificandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // ============================================================================
  // 1. PANTALLA DE ACCESO POR CLAVE MAESTRA
  // ============================================================================
  if (!autenticado) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-gradient-to-b from-slate-950 via-[#0F314A] to-slate-950 px-4 py-8 text-white">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ir al Portal Público</span>
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-[11px] font-extrabold text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            SuperAdmin SaaS
          </span>
        </div>

        <div className="mx-auto my-auto w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-lg">
              <Crown className="h-8 w-8" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
              Centro de Control Comercial
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              PideTirúa SuperAdmin
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Ingresa la Clave Maestra para administrar locales, planes
              (&ldquo;Autogestionado&rdquo; y &ldquo;Llave en Mano VIP&rdquo;) e
              identidad visual.
            </p>
          </div>

          <form onSubmit={handleLoginSuperAdmin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="claveMaestra"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-300"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                Clave Maestra SuperAdmin
              </label>
              <input
                id="claveMaestra"
                type="password"
                value={claveMaestra}
                onChange={(e) => {
                  setClaveMaestra(e.target.value);
                  setErrorClave(null);
                }}
                placeholder="Ingresa tu Clave Maestra..."
                className="w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {errorClave && (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/20 px-3.5 py-2 text-center text-xs font-bold text-rose-200">
                {errorClave}
              </p>
            )}

            <button
              type="submit"
              disabled={!claveMaestra.trim() || validandoClave}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] disabled:opacity-50"
            >
              {validandoClave ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando Clave Maestra...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Entrar al Panel SuperAdmin</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          PideTirúa · Arquitectura Comercial SaaS conectada a Supabase
        </p>
      </div>
    );
  }

  // ============================================================================
  // 2. PANEL PRINCIPAL SUPERADMIN
  // ============================================================================
  const localesActivos = locales.filter((l) => l.activo !== false);
  const ingresoMensualRecurrente = localesActivos.reduce(
    (sum, l) =>
      sum +
      (typeof l.precio_mensual === "number" && l.precio_mensual > 0
        ? l.precio_mensual
        : l.plan === "llave_en_mano"
        ? 28000
        : 15000),
    0
  );
  const totalAutogestionados = locales.filter(
    (l) => l.plan !== "llave_en_mano"
  ).length;
  const totalLlaveEnMano = locales.filter(
    (l) => l.plan === "llave_en_mano"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      {/* Toast flotante */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-2xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Cabecera Superior */}
      <header className="sticky top-0 z-30 border-b border-white/15 bg-slate-900/90 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                Panel Maestro · Modelo SaaS
              </span>
              <h1 className="text-base font-black text-white sm:text-xl">
                PideTirúa SuperAdmin
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarDatosCobro((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-xs font-extrabold text-amber-300 transition hover:bg-amber-400/25"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">💳 Mis Datos de Cobro</span>
              <span className="sm:hidden">💳 Cobro</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Portal</span>
            </Link>

            <button
              type="button"
              onClick={handleLogoutSuperAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-600 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        {/* A) MÉTRICAS DEL NEGOCIO (ENCABEZADO) */}
        <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {/* Total de locales activos */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                Locales Activos
              </span>
              <Store className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-white">
              {localesActivos.length}{" "}
              <span className="text-sm font-bold text-slate-400">
                / {locales.length} registrados
              </span>
            </p>
            <p className="mt-1 text-xs text-emerald-200/80">
              Visibles actualmente en el portal público
            </p>
          </div>

          {/* Ingreso mensual recurrente estimado (MRR) */}
          <div className="rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-950/50 to-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                Ingreso Mensual Estimado
              </span>
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-300">
              {formatCLP(ingresoMensualRecurrente)}
              <span className="text-xs font-bold text-amber-100/80"> /mes</span>
            </p>
            <p className="mt-1 text-xs text-amber-100/80">
              Suma de planes con estado Activo
            </p>
          </div>

          {/* Distribución de clientes */}
          <div className="rounded-3xl border border-sky-400/30 bg-gradient-to-br from-sky-950/50 to-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                Distribución de Planes
              </span>
              <Users className="h-5 w-5 text-sky-400" />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl border border-sky-400/40 bg-sky-500/20 px-3 py-1.5 text-xs font-black text-sky-200">
                <Zap className="h-3.5 w-3.5 text-sky-300" />
                {totalAutogestionados} Autogestionados
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-200">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                {totalLlaveEnMano} Llave en Mano
              </span>
            </div>
            <p className="mt-2 text-xs text-sky-200/80">
              [{totalAutogestionados} Autogestionados] | [{totalLlaveEnMano}{" "}
              Llave en Mano]
            </p>
          </div>
        </section>

        {/* APARTADO: 💳 MIS DATOS DE COBRO (SUPERADMIN) */}
        <section className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-5 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                <CreditCard className="h-4 w-4" />
                Facturación Mensual · 1 Clic
              </span>
              <h2 className="mt-0.5 text-base font-black text-white sm:text-lg">
                💳 Mis Datos de Cobro (SuperAdmin)
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {datosCobro.nombre && datosCobro.rut && datosCobro.cuenta
                  ? `Configurado: ${datosCobro.banco} · CuentaRUT ${datosCobro.cuenta} · ${datosCobro.nombre} (${datosCobro.rut})`
                  : "Configura tus datos bancarios para que el botón '💬 Cobrar por WhatsApp' envíe siempre tus datos reales."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarDatosCobro((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/25 active:scale-95"
            >
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>
                {mostrarDatosCobro
                  ? "Ocultar Mis Datos de Cobro"
                  : "Configurar Mis Datos de Cobro"}
              </span>
            </button>
          </div>

          {mostrarDatosCobro && (
            <form
              onSubmit={handleGuardarDatosCobro}
              className="mt-5 space-y-4 border-t border-white/15 pt-5"
            >
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={datosCobro.nombre}
                    onChange={(e) =>
                      setDatosCobro((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Ej: Matías Rodríguez"
                    className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Tu RUT *
                  </label>
                  <input
                    type="text"
                    value={datosCobro.rut}
                    onChange={(e) =>
                      setDatosCobro((prev) => ({
                        ...prev,
                        rut: e.target.value,
                      }))
                    }
                    placeholder="Ej: 19.876.543-2"
                    className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Tu Banco *
                  </label>
                  <input
                    type="text"
                    value={datosCobro.banco}
                    onChange={(e) =>
                      setDatosCobro((prev) => ({
                        ...prev,
                        banco: e.target.value,
                      }))
                    }
                    placeholder="Ej: BancoEstado"
                    className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Tu N° de CuentaRUT *
                  </label>
                  <input
                    type="text"
                    value={datosCobro.cuenta}
                    onChange={(e) =>
                      setDatosCobro((prev) => ({
                        ...prev,
                        cuenta: e.target.value,
                      }))
                    }
                    placeholder="Ej: 19876543"
                    className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Correo para comprobantes (opcional)
                  </label>
                  <input
                    type="email"
                    value={datosCobro.correo}
                    onChange={(e) =>
                      setDatosCobro((prev) => ({
                        ...prev,
                        correo: e.target.value,
                      }))
                    }
                    placeholder="Ej: pagos@pidetirua.cl"
                    className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg transition hover:bg-emerald-400 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Guardar Mis Datos de Cobro</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* B) FORMULARIO "+ REGISTRAR NUEVO LOCAL" Y "EDITAR LOCAL" */}
        <section className="rounded-3xl border border-white/15 bg-slate-900/90 p-5 shadow-2xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                <Sparkles className="h-4 w-4" />
                Alta de Clientes e Identidad Visual
              </span>
              <h2 className="mt-0.5 text-lg font-black text-white">
                {mostrarFormulario
                  ? modoEdicionId
                    ? `Editar Local: ${formNombre || originalSlug}`
                    : "Registrar Nuevo Local en PideTirúa"
                  : "Gestión de Locales y Planes Comerciales"}
              </h2>
            </div>

            {!mostrarFormulario ? (
              <button
                type="button"
                onClick={abrirFormularioNuevoLocal}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:from-amber-300 hover:to-amber-400 active:scale-95 sm:text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Registrar Nuevo Local</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
                <span>Cerrar formulario</span>
              </button>
            )}
          </div>

          {mostrarFormulario && (
            <form
              onSubmit={handleGuardarLocal}
              className="mt-5 space-y-5 border-t border-white/15 pt-5"
            >
              {/* 1. Datos Básicos del Negocio */}
              <div>
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  1. Datos Básicos del Negocio
                </h3>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Nombre comercial *
                    </label>
                    <input
                      type="text"
                      value={formNombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormNombre(val);
                        if (!slugEditadoManual) {
                          setFormSlug(slugifyTexto(val));
                        }
                      }}
                      placeholder="Ej: Cocinería Donde La Tía"
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Slug (URL pública: /[slug]) *
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => {
                        setSlugEditadoManual(true);
                        setFormSlug(slugifyTexto(e.target.value));
                      }}
                      placeholder="Ej: donde-la-tia"
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Rubro gastronómico *
                    </label>
                    <input
                      type="text"
                      value={formRubro}
                      onChange={(e) => setFormRubro(e.target.value)}
                      placeholder="Ej: Pescados y Mariscos, Sushi, Comida Rápida"
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Teléfono WhatsApp (+569...) *
                    </label>
                    <input
                      type="text"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      placeholder="Ej: 56912345678"
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Dirección comercial *
                    </label>
                    <input
                      type="text"
                      value={formDireccion}
                      onChange={(e) => setFormDireccion(e.target.value)}
                      placeholder="Ej: Av. Costanera 240, Tirúa Centro"
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">
                        Sector
                      </label>
                      <select
                        value={formSector}
                        onChange={(e) =>
                          setFormSector(e.target.value as SectorComuna)
                        }
                        className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Tirúa Centro">Tirúa Centro</option>
                        <option value="Quidico">Quidico</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">
                        PIN (4 dígitos) *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={formPin}
                        onChange={(e) =>
                          setFormPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="1234"
                        className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 font-mono text-xs font-black text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Selector de Plan Comercial */}
              <div>
                <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  2. Selector de Plan Comercial
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Opción 1: Plan Autogestionado - $15.000/mes */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormPlan("autogestionado");
                      setFormPrecioMensual(15000);
                    }}
                    className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition ${
                      formPlan === "autogestionado"
                        ? "border-sky-400 bg-sky-500/20 shadow-lg shadow-sky-950/40"
                        : "border-white/15 bg-black/30 hover:border-white/30"
                    }`}
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/25 text-sky-300">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          Plan Autogestionado
                        </span>
                        <span className="rounded-full bg-sky-400/25 px-2.5 py-0.5 text-xs font-black text-sky-200">
                          $15.000/mes
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        El dueño administra su carta, precios, fotos de platos y
                        monitor de cocina desde su celular con su PIN.
                      </p>
                    </div>
                  </button>

                  {/* Opción 2: Plan Llave en Mano VIP - $28.000/mes */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormPlan("llave_en_mano");
                      setFormPrecioMensual(28000);
                    }}
                    className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition ${
                      formPlan === "llave_en_mano"
                        ? "border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-950/40"
                        : "border-white/15 bg-black/30 hover:border-white/30"
                    }`}
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/25 text-amber-300">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-amber-200">
                          Plan Llave en Mano VIP
                        </span>
                        <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-slate-950">
                          $28.000/mes
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">
                        Servicio asistido VIP: tú le gestionas cambios de carta,
                        precios y fotos en 1 clic cuando te escriba por
                        WhatsApp.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Día de cobro y Fecha del último pago */}
                <div className="mt-3.5 grid grid-cols-1 gap-3.5 rounded-2xl border border-white/15 bg-black/30 p-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" />
                      Día de cobro mensual (1 al 31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formDiaCobro}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormDiaCobro(
                          Number.isFinite(val)
                            ? Math.min(31, Math.max(1, val))
                            : 5
                        );
                      }}
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      Fecha del último pago registrado
                    </label>
                    <input
                      type="date"
                      value={formFechaUltimoPago}
                      onChange={(e) => setFormFechaUltimoPago(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Identidad Visual (Exclusivo del SuperAdmin) */}
              <div>
                <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  3. Identidad Visual (Exclusivo del SuperAdmin — Bucket &apos;platos&apos;)
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Cargador de Logo */}
                  <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
                    <span className="block text-xs font-extrabold text-white">
                      Logo Oficial del Negocio
                    </span>
                    <div className="mt-3 flex items-center gap-3.5">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/25 bg-slate-900">
                        {formLogoUrl ? (
                          <img
                            src={formLogoUrl}
                            alt="Logo preview"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Camera className="h-6 w-6 text-slate-500" />
                        )}
                        {subiendoLogo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          ref={inputLogoRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void subirImagenSuperAdmin(f, "logo");
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          disabled={subiendoLogo}
                          onClick={() => inputLogoRef.current?.click()}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow transition hover:bg-amber-300"
                        >
                          <ImagePlus className="h-4 w-4" />
                          <span>
                            {subiendoLogo
                              ? "Subiendo Logo..."
                              : "Subir / Reemplazar Logo"}
                          </span>
                        </button>
                        <input
                          type="text"
                          value={formLogoUrl}
                          onChange={(e) => setFormLogoUrl(e.target.value)}
                          placeholder="O pega URL del logo..."
                          className="w-full rounded-lg border border-white/15 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cargador de Foto de Portada (Banner) */}
                  <div className="rounded-2xl border border-white/15 bg-black/30 p-4">
                    <span className="block text-xs font-extrabold text-white">
                      Foto de Portada (Banner HD)
                    </span>
                    <div className="mt-3 flex items-center gap-3.5">
                      <div className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/25 bg-slate-900">
                        {formBannerUrl ? (
                          <img
                            src={formBannerUrl}
                            alt="Banner preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Camera className="h-6 w-6 text-slate-500" />
                        )}
                        {subiendoBanner && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <input
                          ref={inputBannerRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void subirImagenSuperAdmin(f, "banner");
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          disabled={subiendoBanner}
                          onClick={() => inputBannerRef.current?.click()}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow transition hover:bg-amber-300"
                        >
                          <ImagePlus className="h-4 w-4" />
                          <span>
                            {subiendoBanner
                              ? "Subiendo Portada..."
                              : "Subir / Reemplazar Portada"}
                          </span>
                        </button>
                        <input
                          type="text"
                          value={formBannerUrl}
                          onChange={(e) => setFormBannerUrl(e.target.value)}
                          placeholder="O pega URL del banner..."
                          className="w-full rounded-lg border border-white/15 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cargador de Video de Portada (Opcional) */}
                <div className="mt-4 rounded-2xl border border-amber-400/30 bg-black/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white">
                      <Video className="h-4 w-4 text-amber-400" />
                      🎥 Video de Portada (Opcional)
                    </span>
                    {formBannerVideoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormBannerVideoUrl("");
                          mostrarToast(
                            "🗑️ Video eliminado del formulario. Se usará la Foto de Portada estática."
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-[11px] font-extrabold text-rose-200 transition hover:bg-rose-600 hover:text-white active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>🗑️ Eliminar Video</span>
                      </button>
                    )}
                  </div>

                  <p className="mt-1.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
                    💡 Recomendación: Videos cortos de 5 a 10 segundos, formato
                    horizontal y peso menor a 15 MB para carga rápida en
                    celulares
                  </p>

                  <div className="mt-3 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                    <div className="relative flex h-24 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/25 bg-slate-900">
                      {formBannerVideoUrl ? (
                        <video
                          key={formBannerVideoUrl}
                          src={formBannerVideoUrl}
                          poster={formBannerUrl || undefined}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-center text-slate-400">
                          <Video className="h-6 w-6 text-slate-500" />
                          <span className="text-[10px] font-bold">
                            Sin video (usa imagen)
                          </span>
                        </div>
                      )}
                      {subiendoVideo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/75 text-[10px] font-bold text-amber-300">
                          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                          <span>Subiendo...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        ref={inputVideoRef}
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void subirVideoPortadaSuperAdmin(f);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        disabled={subiendoVideo}
                        onClick={() => inputVideoRef.current?.click()}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow transition hover:from-amber-300 hover:to-amber-400 sm:w-auto"
                      >
                        <Video className="h-4 w-4" />
                        <span>
                          {subiendoVideo
                            ? "Subiendo video a Supabase Storage..."
                            : formBannerVideoUrl
                            ? "Reemplazar Video de Portada (MP4 / WebM)"
                            : "Subir Video de Portada (MP4 / WebM)"}
                        </span>
                      </button>

                      <input
                        type="text"
                        value={formBannerVideoUrl}
                        onChange={(e) => setFormBannerVideoUrl(e.target.value)}
                        placeholder="O pega URL del video (.mp4 / .webm)..."
                        className="w-full rounded-lg border border-white/15 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {errorForm && (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-200">
                  {errorForm}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    guardandoForm ||
                    subiendoLogo ||
                    subiendoBanner ||
                    subiendoVideo
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-black text-slate-950 shadow-lg transition hover:bg-emerald-400 disabled:opacity-50 sm:text-sm"
                >
                  {guardandoForm ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {modoEdicionId
                          ? "Guardar Cambios del Local"
                          : "Registrar Local en PideTirúa"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* C) LISTA DE NEGOCIOS Y HERRAMIENTAS DEL ADMINISTRADOR */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-200 sm:text-lg">
              Negocios Registrados ({locales.length})
            </h2>
            <span className="text-xs text-slate-400">
              Acceso en 1 clic sin PIN para clientes Llave en Mano
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {locales.map((loc) => {
              const activo = loc.activo !== false;
              const esVip = loc.plan === "llave_en_mano";
              const precioPlan =
                typeof loc.precio_mensual === "number" && loc.precio_mensual > 0
                  ? loc.precio_mensual
                  : esVip
                  ? 28000
                  : 15000;
              const logoMostrar = loc.logo_url || loc.logo;
              const bannerMostrar = loc.banner_url || loc.fotoPortada;
              const estadoCobro = calcularEstadoCobranza(loc);
              const urlCobroWhatsApp = buildWhatsAppCobroUrl(
                loc,
                precioPlan,
                datosCobro
              );

              return (
                <article
                  key={loc.id}
                  className={`overflow-hidden rounded-3xl border transition-all ${
                    activo
                      ? "border-white/15 bg-slate-900/90 shadow-xl"
                      : "border-rose-500/35 bg-slate-900/50 opacity-80"
                  }`}
                >
                  {/* Mini Banner de Portada + Badge de Plan + Switch Activo/Suspendido */}
                  <div className="relative h-28 w-full overflow-hidden bg-slate-800">
                    <img
                      src={bannerMostrar}
                      alt={loc.nombre}
                      className="h-full w-full object-cover opacity-65"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Badge del Plan Comercial */}
                    <div className="absolute left-3.5 top-3 flex flex-wrap items-center gap-1.5">
                      {esVip ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-[11px] font-black text-slate-950 shadow-md">
                          <Crown className="h-3.5 w-3.5" />
                          VIP Llave en Mano · {formatCLP(precioPlan)}/mes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/50 bg-sky-600/95 px-3 py-1 text-[11px] font-black text-white shadow-md">
                          <Zap className="h-3.5 w-3.5" />
                          Autogestionado · {formatCLP(precioPlan)}/mes
                        </span>
                      )}
                    </div>

                    {/* Switch [Activo / Suspendido] */}
                    <div className="absolute right-3.5 top-3">
                      <button
                        type="button"
                        disabled={guardandoSlug === loc.slug}
                        onClick={() => void handleToggleActivo(loc)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold shadow-md transition active:scale-95 ${
                          activo
                            ? "border-emerald-300/50 bg-emerald-600 text-white hover:bg-emerald-500"
                            : "border-rose-300/50 bg-rose-600 text-white hover:bg-rose-500"
                        }`}
                      >
                        <span>
                          {activo ? "🟢 Activo" : "🔴 Suspendido"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta del Negocio */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="-mt-10 h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30 bg-slate-950 p-1 shadow-xl">
                        <img
                          src={logoMostrar}
                          alt={loc.nombre}
                          className="h-full w-full rounded-xl object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-black text-white sm:text-lg">
                          {loc.nombre}
                        </h3>
                        <p className="truncate text-xs font-bold text-amber-300">
                          {loc.rubro}
                        </p>
                      </div>
                    </div>

                    {/* Estado de Facturación y Botones de Acción de Cobro en 1 Clic */}
                    <div
                      className={`mt-3.5 rounded-2xl border p-3 ${
                        estadoCobro.alDia
                          ? "border-emerald-500/35 bg-emerald-950/25"
                          : "border-rose-500/50 bg-rose-950/35"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {estadoCobro.alDia ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-200">
                            🟢 Al día (Vence el {estadoCobro.diaCobro} de este
                            mes)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-sm">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              ⚠️ Pago Vencido ({formatCLP(precioPlan)} CLP)
                            </span>
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-slate-400">
                          Últ. pago: {estadoCobro.fechaUltimoPago}
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <a
                          href={urlCobroWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-black text-white shadow-md transition hover:bg-[#20bd5a] active:scale-95"
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-white" />
                          <span>💬 Cobrar por WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          disabled={registrandoPagoSlug === loc.slug}
                          onClick={() => void handleRegistrarPago(loc)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-500 hover:text-slate-950 active:scale-95 disabled:opacity-50"
                        >
                          {registrandoPagoSlug === loc.slug ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>✅ Registrar Pago</span>
                        </button>
                      </div>
                    </div>

                    {/* Datos rápidos: Teléfono, Dirección y PIN de Acceso con botón 👁️ y edición inmediata */}
                    <div className="mt-3 space-y-2.5 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span className="truncate font-semibold">
                            {formatPhoneDisplay(
                              loc.telefono_whatsapp || loc.telefonoWhatsapp
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                          <span className="truncate">
                            {loc.direccion || loc.direccionDetalle}
                          </span>
                        </div>
                      </div>

                      {/* Campo PIN de Acceso: Enmascarado (••••) con botón de ojo (👁️) y edición inmediata */}
                      <div className="rounded-xl border border-amber-400/25 bg-slate-950/80 p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            <span className="font-bold text-slate-300">
                              PIN de Acceso:
                            </span>
                            <strong className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-0.5 font-mono text-sm tracking-widest text-amber-300">
                              {pinVisiblePorSlug[loc.slug]
                                ? loc.pin || "1234"
                                : "••••"}
                            </strong>
                            <button
                              type="button"
                              onClick={() =>
                                setPinVisiblePorSlug((prev) => ({
                                  ...prev,
                                  [loc.slug]: !prev[loc.slug],
                                }))
                              }
                              title={
                                pinVisiblePorSlug[loc.slug]
                                  ? "Ocultar PIN"
                                  : "Revelar PIN"
                              }
                              aria-label={
                                pinVisiblePorSlug[loc.slug]
                                  ? "Ocultar PIN"
                                  : "Revelar PIN"
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-200 transition hover:bg-white/20 active:scale-95"
                            >
                              {pinVisiblePorSlug[loc.slug] ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                                  <span>Ocultar</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-amber-300" />
                                  <span>👁️ Ver</span>
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const abriendo = !pinEditandoPorSlug[loc.slug];
                              setPinEditandoPorSlug((prev) => ({
                                ...prev,
                                [loc.slug]: abriendo,
                              }));
                              if (abriendo) {
                                setPinDraftPorSlug((prev) => ({
                                  ...prev,
                                  [loc.slug]: loc.pin || "1234",
                                }));
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-extrabold text-amber-300 transition hover:bg-amber-400/25 active:scale-95"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>
                              {pinEditandoPorSlug[loc.slug]
                                ? "Cancelar"
                                : "Cambiar PIN"}
                            </span>
                          </button>
                        </div>

                        {pinEditandoPorSlug[loc.slug] && (
                          <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={
                                pinDraftPorSlug[loc.slug] ?? loc.pin ?? "1234"
                              }
                              onChange={(e) =>
                                setPinDraftPorSlug((prev) => ({
                                  ...prev,
                                  [loc.slug]: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 4),
                                }))
                              }
                              placeholder="Nuevo PIN (4 dígitos)"
                              className="w-36 rounded-lg border border-white/20 bg-white px-2.5 py-1.5 font-mono text-xs font-black tracking-widest text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={guardandoPinSlug === loc.slug}
                              onClick={() => void handleGuardarPinRapido(loc)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                            >
                              {guardandoPinSlug === loc.slug ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              <span>Guardar nuevo PIN</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de Acción del SuperAdmin */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* Acceso Directo en 1 clic ("Gestionar Carta" sin PIN) */}
                      <Link
                        href={`/admin/${loc.slug}?superadmin=true`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-300 hover:to-amber-400 active:scale-95"
                      >
                        <Crown className="h-3.5 w-3.5 shrink-0" />
                        <span>Gestionar Carta (1 Clic)</span>
                      </Link>

                      {/* Botón Editar Identidad / Plan / Datos */}
                      <button
                        type="button"
                        onClick={() => abrirFormularioEditarLocal(loc)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-white/20 active:scale-95"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar Local</span>
                      </button>

                      {/* Ver carta pública */}
                      <Link
                        href={`/${loc.slug}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/35 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                        title="Ver menú público"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
