"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Lock,
  LogOut,
  CheckCircle2,
  ExternalLink,
  Store,
  Delete,
  Check,
  Loader2,
  ArrowLeft,
  DollarSign,
  PlusCircle,
  Camera,
  ImagePlus,
  Trash2,
  X,
  Sparkles,
  CreditCard,
  QrCode,
  Printer,
  Download,
  Smartphone,
  MessageCircle,
  Crown,
  Settings,
  FolderPlus,
  Layers,
  ShieldCheck,
  Phone,
  Clock,
  MapPin,
  KeyRound,
  BarChart3,
  Flame,
  Copy,
  Share2,
  Megaphone,
  AlertTriangle,
  Moon,
  Receipt,
  Plus,
  ChefHat,
  Utensils,
} from "lucide-react";
import { Local, Producto, GrupoOpcion } from "@/types/local";
import { formatCLP } from "@/lib/formatters";
import { getLocalTheme, getVideoPoster } from "@/lib/localTheme";
import KitchenMonitor from "@/components/KitchenMonitor";
import VentasReportes from "@/components/VentasReportes";
import ModalCierreCaja from "@/components/ModalCierreCaja";
import ModalGestionOpcionesPlato from "@/components/ModalGestionOpcionesPlato";
import { GradientBackground } from "@/components/ui/noisy-gradient-backgrounds";

interface AdminLocalClientProps {
  initialLocal: Local;
  initialAuthenticated?: boolean;
  initialSuperAdmin?: boolean;
}

interface AdminBrandPalette {
  bgBase: string;
  headerBg: string;
  panelCardBg: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  accentRing: string;
  pinActiveBox: string;
  pinBtn: string;
  subtitleText: string;
  badgeBg: string;
}

function getAdminBrandPalette(slug: string): AdminBrandPalette {
  return {
    bgBase: "bg-[#FAF8F5]",
    headerBg: "border-b border-stone-200/90 bg-[#FAF8F5]/95 backdrop-blur-md text-stone-900",
    panelCardBg: "border border-stone-200/90 bg-white text-stone-900 shadow-sm",
    accentBg: "bg-[#18181B] text-white hover:bg-black",
    accentText: "text-[#EA580C]",
    accentBorder: "border-[#EA580C]/40",
    accentRing: "focus:border-[#EA580C] focus:ring-[#EA580C]/30",
    pinActiveBox: "border-[#EA580C] bg-orange-50 text-[#EA580C] shadow-sm",
    pinBtn: "border-stone-200/90 bg-white text-stone-900 hover:border-[#EA580C] hover:bg-orange-50/50",
    subtitleText: "text-stone-500",
    badgeBg: "bg-orange-50 text-[#EA580C] border border-orange-200 font-bold",
  };
}

/**
 * Redimensiona y comprime una imagen en el navegador (máx 1000px, JPEG 82%)
 * para que las fotos tomadas directamente con la cámara del celular suban en < 1 segundo.
 */
async function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Archivo de imagen inválido"));
      img.onload = () => {
        const maxDim = 1000;
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
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminLocalClient({
  initialLocal,
  initialAuthenticated = false,
  initialSuperAdmin = false,
}: AdminLocalClientProps) {
  const sessionKey = `pidetirua_admin_session_${initialLocal.slug}`;
  const theme = getLocalTheme(initialLocal.slug);
  const brand = getAdminBrandPalette(initialLocal.slug);

  const [local, setLocal] = useState<Local>(initialLocal);
  const [esSuperAdmin, setEsSuperAdmin] = useState<boolean>(initialSuperAdmin);
  const [autenticado, setAutenticado] = useState<boolean>(
    initialAuthenticated || initialSuperAdmin
  );
  const [verificandoSesion, setVerificandoSesion] = useState<boolean>(
    !initialAuthenticated && !initialSuperAdmin
  );

  // Estado del bloqueo por PIN
  const [pin, setPin] = useState<string>("");
  const [errorPin, setErrorPin] = useState<string | null>(null);
  const [validandoPin, setValidandoPin] = useState<boolean>(false);
  const [segundosBloqueo, setSegundosBloqueo] = useState<number>(0);
  const lockoutKey = `pidetirua_admin_lockout_${initialLocal.slug}`;

  // Recuperar tiempo de bloqueo persistente contra fuerza bruta
  useEffect(() => {
    try {
      const lockUntilStr = localStorage.getItem(lockoutKey);
      if (lockUntilStr) {
        const lockUntil = Number(lockUntilStr);
        const diffSeconds = Math.ceil((lockUntil - Date.now()) / 1000);
        if (diffSeconds > 0) {
          setSegundosBloqueo(diffSeconds);
          setErrorPin(
            `Acceso temporalmente bloqueado por seguridad. Espera ${Math.ceil(
              diffSeconds / 60
            )} minutos.`
          );
        } else {
          localStorage.removeItem(lockoutKey);
        }
      }
    } catch {
      // Ignorar en navegación privada
    }
  }, [lockoutKey]);

  useEffect(() => {
    if (segundosBloqueo <= 0) {
      try {
        localStorage.removeItem(lockoutKey);
      } catch {
        // Ignorar
      }
      return;
    }
    const interval = setInterval(() => {
      setSegundosBloqueo((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(lockoutKey);
          } catch {
            // Ignorar
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [segundosBloqueo, lockoutKey]);

  // Estado de guardado y Toast de feedback inmediato
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Estado de Ajustes Básicos del Dueño (WhatsApp, horario, dirección y PIN)
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState<string>(
    initialLocal.telefono_whatsapp || initialLocal.telefonoWhatsapp || ""
  );
  const [horarioAtencion, setHorarioAtencion] = useState<string>(
    initialLocal.horario || initialLocal.horarioEntrega || ""
  );
  const [direccionLocal, setDireccionLocal] = useState<string>(
    initialLocal.direccionDetalle || ""
  );
  const [nuevoPinSeguridad, setNuevoPinSeguridad] = useState<string>(
    initialLocal.pin || ""
  );
  const [guardandoAjustes, setGuardandoAjustes] = useState<boolean>(false);

  // Estado de Gestión de Categorías
  const [nombreCategoriaCrear, setNombreCategoriaCrear] = useState<string>("");
  const [creandoCategoria, setCreandoCategoria] = useState<boolean>(false);

  // Estado de Datos Bancarios para Transferencia
  const [banco, setBanco] = useState<string>(initialLocal.banco || "");
  const [tipoCuenta, setTipoCuenta] = useState<string>(
    initialLocal.tipo_cuenta || ""
  );
  const [numeroCuenta, setNumeroCuenta] = useState<string>(
    initialLocal.numero_cuenta || ""
  );
  const [rutTitular, setRutTitular] = useState<string>(
    initialLocal.rut_titular || ""
  );
  const [nombreTitular, setNombreTitular] = useState<string>(
    initialLocal.nombre_titular || ""
  );
  const [emailTransferencia, setEmailTransferencia] = useState<string>(
    initialLocal.email_transferencia || ""
  );
  const [guardandoBancos, setGuardandoBancos] = useState<boolean>(false);

  // Estado del Generador de Cartel QR para Mesas
  const [mostrarCartelQr, setMostrarCartelQr] = useState<boolean>(false);
  const [publicOrigin, setPublicOrigin] = useState<string>(
    "https://pidetirua.vercel.app"
  );
  const [descargandoQr, setDescargandoQr] = useState<boolean>(false);

  // Estados para Micro-Herramientas de IA (Gemini)
  const [generandoDescripcionId, setGenerandoDescripcionId] = useState<string | null>(null);
  const [mostrarModalRedes, setMostrarModalRedes] = useState<boolean>(false);
  const [textoPostRedes, setTextoPostRedes] = useState<string>("");
  const [generandoPostRedes, setGenerandoPostRedes] = useState<boolean>(false);
  const [postCopiado, setPostCopiado] = useState<boolean>(false);

  // Pestaña o sección activa en el panel admin
  const [pestanaActiva, setPestañaActiva] = useState<
    "todas" | "reportes" | "cocina" | "carta" | "ajustes"
  >("carta");

  // Estado del formulario "Subir Nuevo Plato"
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState<boolean>(false);
  const [nuevoCategoriaId, setNuevoCategoriaId] = useState<string>(
    initialLocal.categorias[0]?.id ?? "__nueva__"
  );
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState<string>("");
  const [nuevoNombre, setNuevoNombre] = useState<string>("");
  const [nuevoPrecio, setNuevoPrecio] = useState<string>("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState<string>("");
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState<string>("");
  const [nuevaFotoUrl, setNuevaFotoUrl] = useState<string>("");
  const [subiendoFotoNueva, setSubiendoFotoNueva] = useState<boolean>(false);
  const [nuevoEsOferta, setNuevoEsOferta] = useState<boolean>(false);
  const [nuevoPrecioOferta, setNuevoPrecioOferta] = useState<string>("");
  const [nuevoTextoPromo, setNuevoTextoPromo] = useState<string>("");
  const [creandoPlato, setCreandoPlato] = useState<boolean>(false);
  const [errorNuevoPlato, setErrorNuevoPlato] = useState<string | null>(null);

  // Estados de Nuevas Herramientas Operativas:
  // Módulo 1: Opciones y Extras para nuevo plato y edición
  const [nuevasOpciones, setNuevasOpciones] = useState<GrupoOpcion[]>([]);
  const [platoParaEditarOpciones, setPlatoParaEditarOpciones] =
    useState<Producto | null>(null);

  // Módulo 2: Cierre de Caja de Hoy
  const [mostrarCierreCaja, setMostrarCierreCaja] = useState<boolean>(false);

  // Módulo 3: Demora y Contingencia
  const [tiempoEstimado, setTiempoEstimado] = useState<string>(
    initialLocal.tiempo_estimado || initialLocal.tiempoEstimado || "20-30 min"
  );
  const [mensajeEmergencia, setMensajeEmergencia] = useState<string>(
    initialLocal.mensaje_emergencia || ""
  );
  const [emergenciaActiva, setEmergenciaActiva] = useState<boolean>(
    Boolean(initialLocal.mensaje_emergencia)
  );

  const inputFotoNuevoRef = useRef<HTMLInputElement | null>(null);

  // Estado local de edición rápida de nombre, precio, descripción, etiqueta y oferta por producto
  const [ediciones, setEdiciones] = useState<
    Record<
      string,
      {
        nombre: string;
        precio: string;
        descripcion: string;
        etiqueta: string;
        es_oferta: boolean;
        precio_oferta: string;
        texto_promo: string;
      }
    >
  >(() => {
    const map: Record<
      string,
      {
        nombre: string;
        precio: string;
        descripcion: string;
        etiqueta: string;
        es_oferta: boolean;
        precio_oferta: string;
        texto_promo: string;
      }
    > = {};
    for (const cat of initialLocal.categorias) {
      for (const prod of cat.productos) {
        map[prod.id] = {
          nombre: prod.nombre,
          precio: String(prod.precio),
          descripcion: prod.descripcion,
          etiqueta: prod.etiqueta || "",
          es_oferta: Boolean(prod.es_oferta),
          precio_oferta:
            prod.precio_oferta != null ? String(prod.precio_oferta) : "",
          texto_promo: prod.texto_promo || "",
        };
      }
    }
    return map;
  });

  useEffect(() => {
    const map: Record<
      string,
      {
        nombre: string;
        precio: string;
        descripcion: string;
        etiqueta: string;
        es_oferta: boolean;
        precio_oferta: string;
        texto_promo: string;
      }
    > = {};
    for (const cat of local.categorias) {
      for (const prod of cat.productos) {
        map[prod.id] = {
          nombre: prod.nombre,
          precio: String(prod.precio),
          descripcion: prod.descripcion,
          etiqueta: prod.etiqueta || "",
          es_oferta: Boolean(prod.es_oferta),
          precio_oferta:
            prod.precio_oferta != null ? String(prod.precio_oferta) : "",
          texto_promo: prod.texto_promo || "",
        };
      }
    }
    setEdiciones(map);
  }, [local]);

  useEffect(() => {
    if (initialAuthenticated || initialSuperAdmin) {
      setAutenticado(true);
      try {
        document.cookie = `pidetirua_admin_${initialLocal.slug}=authenticated; path=/; max-age=604800; SameSite=Lax`;
      } catch {}
      if (initialSuperAdmin) setEsSuperAdmin(true);
      setVerificandoSesion(false);
      return;
    }
    try {
      const sesionSuperAdmin =
        localStorage.getItem("pidetirua_superadmin_session") === "authenticated";

      if (sesionSuperAdmin) {
        setEsSuperAdmin(true);
        setAutenticado(true);
        localStorage.setItem(sessionKey, "authenticated");
        document.cookie = `pidetirua_admin_${initialLocal.slug}=authenticated; path=/; max-age=604800; SameSite=Lax`;
        setVerificandoSesion(false);
        return;
      }

      const guardado = localStorage.getItem(sessionKey);
      if (guardado === "authenticated") {
        setAutenticado(true);
        document.cookie = `pidetirua_admin_${initialLocal.slug}=authenticated; path=/; max-age=604800; SameSite=Lax`;
      }
    } catch {
      // Ignorar errores de acceso a localStorage
    } finally {
      setVerificandoSesion(false);
    }
  }, [initialAuthenticated, initialSuperAdmin, initialLocal.slug, sessionKey]);

  const mostrarToast = (mensaje = "Cambio guardado") => {
    setToastMensaje(mensaje);
  };

  useEffect(() => {
    if (!toastMensaje) return;
    const timer = setTimeout(() => {
      setToastMensaje(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMensaje]);

  // Validar PIN contra Supabase
  const validarPin = async (pinAValidar: string) => {
    if (pinAValidar.length !== 4 || validandoPin || segundosBloqueo > 0) return;
    setValidandoPin(true);
    setErrorPin(null);

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-pin", pin: pinAValidar }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 429 || data.locked) {
          const waitSecs =
            Number(data.retryAfterSeconds) ||
            (Number(data.waitMinutes) || 10) * 60;
          setSegundosBloqueo(waitSecs);
          try {
            localStorage.setItem(
              lockoutKey,
              String(Date.now() + waitSecs * 1000)
            );
          } catch {
            // Ignorar
          }
        }
        setErrorPin(data.error || "PIN incorrecto. Intenta nuevamente.");
        setPin("");
        return;
      }

      try {
        localStorage.setItem(sessionKey, "authenticated");
        document.cookie = `pidetirua_admin_${local.slug}=authenticated; path=/; max-age=604800; SameSite=Lax`;
      } catch {
        // Ignorar errores en modo privado
      }

      setAutenticado(true);
      mostrarToast("Sesión iniciada correctamente");
    } catch {
      setErrorPin("Error de conexión al verificar el PIN.");
    } finally {
      setValidandoPin(false);
    }
  };

  const handleDigitoPin = (digito: string) => {
    if (pin.length >= 4 || validandoPin || segundosBloqueo > 0) return;
    const nuevoPin = `${pin}${digito}`;
    setPin(nuevoPin);
    setErrorPin(null);
    if (nuevoPin.length === 4) {
      void validarPin(nuevoPin);
    }
  };

  const handleBorrarDigito = () => {
    if (validandoPin || segundosBloqueo > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorPin(null);
  };

  const handleCerrarSesion = async () => {
    try {
      localStorage.removeItem(sessionKey);
      document.cookie = `pidetirua_admin_${local.slug}=; path=/; max-age=0`;
      await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // Ignorar
    }
    setPin("");
    setEsSuperAdmin(false);
    setAutenticado(false);
  };

  // Cambiar estado Abierto / Cerrado del local en tiempo real
  const handleToggleAbierto = async () => {
    const nuevoEstado = !local.abierto;
    const estadoAnterior = local.abierto;

    setLocal((prev) => ({ ...prev, abierto: nuevoEstado }));
    setGuardandoId("local-abierto");

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-abierto",
          abierto: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setLocal((prev) => ({ ...prev, abierto: estadoAnterior }));
        return;
      }
      if (data.local) {
        setLocal(data.local);
      }
      mostrarToast(
        nuevoEstado
          ? "Cambio guardado: 🟢 Local Abierto"
          : "Cambio guardado: 🔴 Local Cerrado"
      );
    } catch {
      setLocal((prev) => ({ ...prev, abierto: estadoAnterior }));
    } finally {
      setGuardandoId(null);
    }
  };

  // Guardar Ajustes Básicos del Local (WhatsApp, horario, dirección y PIN)
  const handleGuardarAjustesBasicos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoAjustes) return;

    const pinLimpio = nuevoPinSeguridad.replace(/\D/g, "").slice(0, 4);
    if (pinLimpio && pinLimpio.length !== 4) {
      mostrarToast("El PIN de seguridad debe tener exactamente 4 dígitos");
      return;
    }

    setGuardandoAjustes(true);
    setGuardandoId("ajustes-basicos");

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-ajustes-basicos",
          telefono_whatsapp: telefonoWhatsapp.trim(),
          horario: horarioAtencion.trim(),
          direccion: direccionLocal.trim(),
          pin: pinLimpio || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
        mostrarToast("Ajustes básicos y PIN actualizados");
      } else {
        mostrarToast(data.error || "No se pudieron guardar los ajustes");
      }
    } catch {
      mostrarToast("Error de conexión al guardar ajustes");
    } finally {
      setGuardandoAjustes(false);
      setGuardandoId(null);
    }
  };

  // Micro-Herramienta IA 1: Generar descripción gastronómica apetitosa con Gemini
  const handleGenerarDescripcionIa = async (
    nombrePlato: string,
    categoriaNombre: string,
    targetId: "nuevo" | string
  ) => {
    const nombreLimpio = nombrePlato.trim();
    if (!nombreLimpio) {
      mostrarToast("Escribe primero el nombre del plato");
      return;
    }

    setGenerandoDescripcionId(targetId);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "describe_dish",
          nombre: nombreLimpio,
          categoria: categoriaNombre,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.descripcion) {
        if (targetId === "nuevo") {
          setNuevaDescripcion(data.descripcion);
        } else {
          setEdiciones((prev) => ({
            ...prev,
            [targetId]: {
              ...prev[targetId],
              descripcion: data.descripcion,
            },
          }));
        }
        mostrarToast("✨ ¡Descripción generada con IA!");
      } else {
        mostrarToast(data.error || "No se pudo generar la descripción");
      }
    } catch {
      mostrarToast("Error al conectar con el servicio de IA");
    } finally {
      setGenerandoDescripcionId(null);
    }
  };

  // Micro-Herramienta IA 2: Generar publicación para redes sociales con Gemini
  const handleGenerarPostRedes = async () => {
    setGenerandoPostRedes(true);
    try {
      const platosDestacadosNombres = local.categorias
        .flatMap((c) => c.productos)
        .filter((p) => p.disponible !== false)
        .slice(0, 5)
        .map((p) => p.nombre)
        .join(", ");

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "social_post",
          nombre_local: local.nombre,
          rubro: local.rubro,
          platos_destacados: platosDestacadosNombres,
          link: `${publicOrigin}/${local.slug}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.post) {
        setTextoPostRedes(data.post);
      } else {
        mostrarToast(data.error || "No se pudo generar el anuncio");
      }
    } catch {
      mostrarToast("Error al generar anuncio con IA");
    } finally {
      setGenerandoPostRedes(false);
    }
  };

  const handleCopiarPostRedes = async () => {
    if (!textoPostRedes) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textoPostRedes);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textoPostRedes;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setPostCopiado(true);
      mostrarToast("📋 ¡Texto copiado al portapapeles!");
      setTimeout(() => setPostCopiado(false), 2500);
    } catch {
      mostrarToast("No se pudo copiar automáticamente");
    }
  };

  const handleCompartirEstadoWhatsapp = () => {
    if (!textoPostRedes) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoPostRedes)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Crear nueva categoría para ordenar la carta
  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombreCategoriaCrear.trim();
    if (!nombreLimpio || creandoCategoria) return;

    setCreandoCategoria(true);
    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-categoria",
          nombre: nombreLimpio,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
        setNombreCategoriaCrear("");
        if (data.categoriaId) {
          setNuevoCategoriaId(data.categoriaId);
        }
        mostrarToast(`Categoría "${nombreLimpio}" creada`);
      } else {
        mostrarToast(data.error || "No se pudo crear la categoría");
      }
    } catch {
      mostrarToast("Error de conexión al crear la categoría");
    } finally {
      setCreandoCategoria(false);
    }
  };

  // Eliminar una categoría de la carta
  const handleEliminarCategoria = async (
    categoriaId: string,
    categoriaNombre: string
  ) => {
    setGuardandoId(`del-cat-${categoriaId}`);
    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-categoria",
          categoriaId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
        mostrarToast(`Categoría "${categoriaNombre}" eliminada`);
      }
    } finally {
      setGuardandoId(null);
    }
  };

  // Subir archivo de imagen a Supabase Storage y obtener su URL pública
  const subirArchivoImagen = async (file: File): Promise<string | null> => {
    const dataUrl = await compressImageFileToDataUrl(file);
    const res = await fetch(`/api/admin/${local.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upload-foto",
        dataUrl,
        fileName: file.name,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.url) {
      throw new Error(data.error || "Error al subir la foto");
    }
    return String(data.url);
  };

  // Seleccionar foto para un plato nuevo
  const handleSeleccionarFotoNuevoPlato = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFotoNueva(true);
    setErrorNuevoPlato(null);
    try {
      const publicUrl = await subirArchivoImagen(file);
      if (publicUrl) {
        setNuevaFotoUrl(publicUrl);
        mostrarToast("Foto cargada correctamente");
      }
    } catch (err) {
      setErrorNuevoPlato(
        err instanceof Error ? err.message : "No se pudo subir la foto"
      );
    } finally {
      setSubiendoFotoNueva(false);
      e.target.value = "";
    }
  };

  // Cambiar la foto de un plato existente directamente
  const handleCambiarFotoProductoExistente = async (
    producto: Producto,
    file: File
  ) => {
    setGuardandoId(`foto-${producto.id}`);
    try {
      const publicUrl = await subirArchivoImagen(file);
      if (!publicUrl) return;

      // Actualización optimista
      setLocal((prev) => ({
        ...prev,
        categorias: prev.categorias.map((cat) => ({
          ...cat,
          productos: cat.productos.map((p) =>
            p.id === producto.id
              ? { ...p, imagen: publicUrl, imagen_url: publicUrl }
              : p
          ),
        })),
      }));

      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-producto",
          productoId: producto.id,
          imagen_url: publicUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast(`Foto actualizada en "${producto.nombre}"`);
    } catch {
      mostrarToast("No se pudo actualizar la foto");
    } finally {
      setGuardandoId(null);
    }
  };

  // Crear un nuevo plato en la carta del negocio
  const handleCrearNuevoPlato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creandoPlato) return;

    const nombreLimpio = nuevoNombre.trim();
    const precioNum = Number(String(nuevoPrecio).replace(/[^0-9]/g, ""));

    if (!nombreLimpio) {
      setErrorNuevoPlato("Por favor escribe el nombre del plato.");
      return;
    }
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      setErrorNuevoPlato(
        "Por favor ingresa un precio válido en pesos (ej: 8500)."
      );
      return;
    }
    if (nuevoCategoriaId === "__nueva__" && !nuevaCategoriaNombre.trim()) {
      setErrorNuevoPlato("Escribe el nombre de la nueva categoría.");
      return;
    }

    setCreandoPlato(true);
    setErrorNuevoPlato(null);

    try {
      const precioOfertaNum = Number(
        String(nuevoPrecioOferta).replace(/[^0-9]/g, "")
      );

      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-producto",
          categoriaId:
            nuevoCategoriaId === "__nueva__" ? undefined : nuevoCategoriaId,
          nuevaCategoriaNombre:
            nuevoCategoriaId === "__nueva__"
              ? nuevaCategoriaNombre.trim()
              : undefined,
          nombre: nombreLimpio,
          descripcion: nuevaDescripcion.trim(),
          precio: precioNum,
          imagen_url: nuevaFotoUrl.trim(),
          etiqueta: nuevaEtiqueta.trim() || undefined,
          disponible: true,
          es_oferta: nuevoEsOferta,
          precio_oferta:
            nuevoEsOferta && precioOfertaNum > 0 ? precioOfertaNum : undefined,
          texto_promo:
            nuevoEsOferta && nuevoTextoPromo.trim()
              ? nuevoTextoPromo.trim()
              : undefined,
          opciones: nuevasOpciones,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorNuevoPlato(data.error || "No se pudo guardar el plato.");
        return;
      }

      if (data.local) {
        setLocal(data.local);
      }

      // Limpiar formulario
      setNuevoNombre("");
      setNuevoPrecio("");
      setNuevaDescripcion("");
      setNuevaEtiqueta("");
      setNuevaFotoUrl("");
      setNuevaCategoriaNombre("");
      setNuevoEsOferta(false);
      setNuevoPrecioOferta("");
      setNuevoTextoPromo("");
      setNuevasOpciones([]);
      setMostrarFormNuevo(false);

      if (nuevoEsOferta) {
        mostrarToast("Oferta activada en la portada de Tirúa");
      } else {
        mostrarToast(`Plato "${nombreLimpio}" publicado en la carta`);
      }
    } catch {
      setErrorNuevoPlato("Error de conexión al guardar el plato.");
    } finally {
      setCreandoPlato(false);
    }
  };

  // Actualizar Tiempo Estimado (Módulo 3)
  const handleActualizarTiempoEstimado = async (nuevoTiempo: string) => {
    setTiempoEstimado(nuevoTiempo);
    setLocal((prev) => ({
      ...prev,
      tiempoEstimado: nuevoTiempo,
      tiempo_estimado: nuevoTiempo,
    }));
    setGuardandoId("tiempo-estimado");
    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-demora-emergencia",
          tiempo_estimado: nuevoTiempo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast(`Tiempo estimado actualizado a ${nuevoTiempo}`);
    } catch {
      mostrarToast("Error al guardar tiempo estimado");
    } finally {
      setGuardandoId(null);
    }
  };

  // Guardar Aviso de Emergencia (Módulo 3)
  const handleGuardarAvisoEmergencia = async (desactivar = false) => {
    const textoFinal = desactivar ? null : mensajeEmergencia.trim() || null;
    if (!desactivar && !textoFinal) {
      mostrarToast("Escribe un aviso o selecciona una sugerencia rápida");
      return;
    }

    setGuardandoId("aviso-emergencia");
    if (desactivar) {
      setEmergenciaActiva(false);
      setMensajeEmergencia("");
    }
    setLocal((prev) => ({
      ...prev,
      mensaje_emergencia: textoFinal,
    }));

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-demora-emergencia",
          mensaje_emergencia: textoFinal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast(
        desactivar
          ? "Aviso de emergencia retirado de la carta"
          : "Aviso de contingencia activado en vivo"
      );
    } catch {
      mostrarToast("Error al guardar aviso de emergencia");
    } finally {
      setGuardandoId(null);
    }
  };

  // Pausador Masivo de Categoría (Módulo 4)
  const handleToggleCategoriaPausa = async (
    categoriaId: string,
    nuevaActiva: boolean
  ) => {
    setGuardandoId(`cat-pause-${categoriaId}`);
    setLocal((prev) => ({
      ...prev,
      categorias: prev.categorias.map((cat) => {
        if (cat.id !== categoriaId) return cat;
        return {
          ...cat,
          activa: nuevaActiva,
          productos: cat.productos.map((p) => ({
            ...p,
            disponible: nuevaActiva,
          })),
        };
      }),
    }));

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-categoria-disponible",
          categoriaId,
          activa: nuevaActiva,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast(
        nuevaActiva
          ? "Categoría y platos reanudados"
          : "Categoría pausada por hoy (stock agotado)"
      );
    } catch {
      mostrarToast("Error al cambiar estado de categoría");
    } finally {
      setGuardandoId(null);
    }
  };

  // Guardar Opciones / Extras de un Plato Existente (Módulo 1)
  const handleGuardarOpcionesProducto = async (
    productoId: string,
    opciones: GrupoOpcion[]
  ) => {
    setGuardandoId(`opciones-${productoId}`);
    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-producto",
          productoId,
          opciones,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
        mostrarToast("Personalización y extras guardados con éxito");
      } else {
        mostrarToast("Error al actualizar opciones del plato");
      }
    } catch {
      mostrarToast("Error de conexión al guardar opciones");
    } finally {
      setGuardandoId(null);
    }
  };

  // Cambiar switch Disponible / Agotado de un producto en tiempo real
  const handleToggleDisponible = async (producto: Producto) => {
    const disponibleActual = producto.disponible !== false;
    const nuevoDisponible = !disponibleActual;

    setLocal((prev) => ({
      ...prev,
      categorias: prev.categorias.map((cat) => ({
        ...cat,
        productos: cat.productos.map((p) =>
          p.id === producto.id ? { ...p, disponible: nuevoDisponible } : p
        ),
      })),
    }));
    setGuardandoId(`disp-${producto.id}`);

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-producto",
          productoId: producto.id,
          disponible: nuevoDisponible,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast(
        nuevoDisponible
          ? `Cambio guardado: "${producto.nombre}" Disponible`
          : `Cambio guardado: "${producto.nombre}" Agotado`
      );
    } finally {
      setGuardandoId(null);
    }
  };

  // Guardar edición rápida de Nombre, Precio, Descripción, Etiqueta y Oferta de un producto
  const handleGuardarEdicionProducto = async (producto: Producto) => {
    const edicion = ediciones[producto.id];
    if (!edicion) return;

    const nombreLimpio = edicion.nombre.trim();
    const descripcionLimpia = edicion.descripcion.trim();
    const etiquetaLimpia = edicion.etiqueta.trim();
    const precioNumero = Number(
      String(edicion.precio).replace(/[^0-9]/g, "")
    );
    const esOferta = Boolean(edicion.es_oferta);
    const precioOfertaNum = Number(
      String(edicion.precio_oferta || "").replace(/[^0-9]/g, "")
    );
    const textoPromoLimpio = edicion.texto_promo?.trim() || "";

    if (!nombreLimpio || Number.isNaN(precioNumero) || precioNumero <= 0) {
      return;
    }

    if (
      nombreLimpio === producto.nombre &&
      precioNumero === producto.precio &&
      descripcionLimpia === producto.descripcion &&
      etiquetaLimpia === (producto.etiqueta || "") &&
      esOferta === Boolean(producto.es_oferta) &&
      (precioOfertaNum || 0) === (producto.precio_oferta || 0) &&
      textoPromoLimpio === (producto.texto_promo || "")
    ) {
      return;
    }

    setLocal((prev) => ({
      ...prev,
      categorias: prev.categorias.map((cat) => ({
        ...cat,
        productos: cat.productos.map((p) =>
          p.id === producto.id
            ? {
                ...p,
                nombre: nombreLimpio,
                precio: precioNumero,
                descripcion: descripcionLimpia,
                etiqueta: etiquetaLimpia || undefined,
                es_oferta: esOferta,
                precio_oferta:
                  esOferta && precioOfertaNum > 0 ? precioOfertaNum : undefined,
                texto_promo:
                  esOferta && textoPromoLimpio ? textoPromoLimpio : undefined,
              }
            : p
        ),
      })),
    }));
    setGuardandoId(`edit-${producto.id}`);

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-producto",
          productoId: producto.id,
          nombre: nombreLimpio,
          precio: precioNumero,
          descripcion: descripcionLimpia,
          etiqueta: etiquetaLimpia,
          es_oferta: esOferta,
          precio_oferta:
            esOferta && precioOfertaNum > 0 ? precioOfertaNum : null,
          texto_promo: esOferta && textoPromoLimpio ? textoPromoLimpio : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }

      if (esOferta) {
        mostrarToast("Oferta activada en la portada de Tirúa");
      } else {
        mostrarToast("Cambio guardado");
      }
    } finally {
      setGuardandoId(null);
    }
  };

  // Eliminar un plato
  const handleEliminarProducto = async (producto: Producto) => {
    setGuardandoId(`del-${producto.id}`);
    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-producto",
          productoId: producto.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
        mostrarToast(`Plato "${producto.nombre}" eliminado`);
      }
    } finally {
      setGuardandoId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setPublicOrigin(window.location.origin);
    }
  }, []);

  // Guardar Datos Bancarios para Transferencia en Supabase
  const handleGuardarDatosBancarios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoBancos) return;
    setGuardandoBancos(true);
    setGuardandoId("datos-bancarios");

    const payloadBancario = {
      banco: banco.trim(),
      tipo_cuenta: tipoCuenta.trim(),
      numero_cuenta: numeroCuenta.trim(),
      rut_titular: rutTitular.trim(),
      nombre_titular: nombreTitular.trim(),
      email_transferencia: emailTransferencia.trim(),
    };

    // Actualización optimista
    setLocal((prev) => ({
      ...prev,
      ...payloadBancario,
    }));

    try {
      const res = await fetch(`/api/admin/${local.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-datos-bancarios",
          ...payloadBancario,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.local) {
        setLocal(data.local);
      }
      mostrarToast("Datos bancarios actualizados");
    } catch {
      mostrarToast("Error al guardar datos bancarios");
    } finally {
      setGuardandoBancos(false);
      setGuardandoId(null);
    }
  };

  const urlPublicaLocal = `${publicOrigin}/${local.slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&margin=20&format=png&data=${encodeURIComponent(
    urlPublicaLocal
  )}`;

  const handleImprimirCartel = () => {
    if (!mostrarCartelQr) {
      setMostrarCartelQr(true);
      setTimeout(() => {
        window.print();
      }, 250);
    } else {
      window.print();
    }
  };

  const handleDescargarQrPng = async () => {
    if (descargandoQr) return;
    setDescargandoQr(true);
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `qr-mesa-${local.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      mostrarToast("Código QR (PNG) descargado");
    } catch {
      window.open(qrImageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDescargandoQr(false);
    }
  };

  const logoOficial = local.logo_url || local.logo;
  const bannerOficial = local.banner_url || local.fotoPortada;
  const videoDeFondo = local.videoFondo || local.videoPortada;
  const posterFondo = getVideoPoster(videoDeFondo, bannerOficial);

  if (verificandoSesion) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${brand.bgBase} text-white`}
      >
        <Loader2 className={`h-8 w-8 animate-spin ${brand.accentText}`} />
      </div>
    );
  }

  const soporteWhatsapp =
    process.env.NEXT_PUBLIC_SOPORTE_WHATSAPP || "56994761692";
  const urlRecuperarPinWhatsapp = `https://wa.me/${soporteWhatsapp}?text=${encodeURIComponent(
    `Hola, soy del local ${local.nombre} en Tirúa y olvidé el PIN de mi panel.`
  )}`;

  // ============================================================================
  // 1. PANTALLA DE BLOQUEO POR PIN CON LA PALETA DE COLORES DEL NEGOCIO
  // ============================================================================
  if (!autenticado) {
    return (
      <div
        className={`relative flex min-h-screen flex-col justify-between px-4 py-6 text-stone-900 ${brand.bgBase} overflow-hidden`}
      >
        {/* Fondo con degradado y textura de ruido estática (Zero GPU loop) */}
        <GradientBackground
          gradientType="radial-gradient"
          gradientOrigin="center"
          gradientSize="140% 140%"
          colors={[
            { color: "rgba(254, 240, 218, 0.65)", stop: "0%" },
            { color: "rgba(254, 215, 170, 0.4)", stop: "35%" },
            { color: "rgba(250, 248, 245, 0.8)", stop: "70%" },
            { color: "rgba(250, 248, 245, 1)", stop: "100%" },
          ]}
          noiseIntensity={0.6}
          noisePatternAlpha={34}
          noisePatternSize={90}
          noisePatternRefreshInterval={0}
        />

        {/* Fondo ambiental sutil */}
        {posterFondo && (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <img
              src={posterFondo}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover blur-2xl opacity-10"
            />
          </div>
        )}

        {/* Barra superior */}
        <div className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-between">
          <Link
            href={`/${local.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-xs backdrop-blur-md transition hover:bg-stone-100 hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a la carta</span>
          </Link>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${brand.badgeBg}`}
          >
            <Lock className="h-3 w-3" />
            Admin Móvil
          </span>
        </div>

        {/* Tarjeta central de PIN con identidad del local */}
        <div
          className={`relative z-10 mx-auto my-auto w-full max-w-sm rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm`}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 border-stone-200 bg-white p-1 shadow-sm"
            >
              <img
                src={logoOficial}
                alt={local.nombre}
                className="h-full w-full rounded-xl object-contain"
              />
            </div>
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${brand.accentText}`}
            >
              {local.rubro}
            </span>
            <h1 className="mt-0.5 text-2xl font-display uppercase tracking-wide text-stone-900">
              {local.nombre}
            </h1>
            <p className={`mt-1 text-xs ${brand.subtitleText}`}>
              Ingresa el PIN de 4 dígitos para administrar tu carta digital
            </p>
          </div>

          {/* Indicadores visuales de los 4 dígitos + Input directo */}
          <div className="mt-5 flex flex-col items-center">
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const digito = pin[idx];
                const activo = pin.length === idx;
                return (
                  <div
                    key={idx}
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all ${
                      digito
                        ? brand.pinActiveBox
                        : activo
                        ? "border-[#EA580C] bg-orange-50 text-[#EA580C]"
                        : "border-stone-200 bg-stone-50 text-stone-400"
                    }`}
                  >
                    {digito ? "●" : ""}
                  </div>
                );
              })}
            </div>

            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              disabled={validandoPin || segundosBloqueo > 0}
              value={pin}
              onChange={(e) => {
                const soloNumeros = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 4);
                setPin(soloNumeros);
                setErrorPin(null);
                if (soloNumeros.length === 4) {
                  void validarPin(soloNumeros);
                }
              }}
              placeholder={segundosBloqueo > 0 ? "Bloqueado temporalmente" : "Escribe tu PIN de 4 dígitos"}
              aria-label="PIN de 4 dígitos"
              className="mt-3 w-52 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-center text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            />

            {segundosBloqueo > 0 ? (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-center text-xs font-bold text-amber-800">
                <Clock className="h-4 w-4 animate-spin text-amber-600" />
                <span>
                  Bloqueo por seguridad: reintenta en {Math.floor(segundosBloqueo / 60)}:{(segundosBloqueo % 60).toString().padStart(2, "0")}
                </span>
              </div>
            ) : errorPin ? (
              <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-center text-xs font-bold text-rose-700">
                {errorPin}
              </p>
            ) : null}
          </div>

          {/* Teclado Numérico Táctil con los colores del negocio */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                disabled={validandoPin || segundosBloqueo > 0}
                onClick={() => handleDigitoPin(num)}
                className={`flex h-13 items-center justify-center rounded-2xl border py-3 text-xl font-extrabold shadow-xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${brand.pinBtn}`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={validandoPin || pin.length === 0 || segundosBloqueo > 0}
              onClick={() => {
                setPin("");
                setErrorPin(null);
              }}
              className="flex items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>

            <button
              type="button"
              disabled={validandoPin || segundosBloqueo > 0}
              onClick={() => handleDigitoPin("0")}
              className={`flex items-center justify-center rounded-2xl border py-3 text-xl font-extrabold shadow-xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${brand.pinBtn}`}
            >
              0
            </button>

            <button
              type="button"
              disabled={validandoPin || pin.length === 0 || segundosBloqueo > 0}
              onClick={handleBorrarDigito}
              aria-label="Borrar último dígito"
              className="flex items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 py-3 text-stone-600 transition hover:bg-stone-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            disabled={pin.length !== 4 || validandoPin || segundosBloqueo > 0}
            onClick={() => void validarPin(pin)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-display uppercase tracking-wider text-white bg-[#18181B] hover:bg-black shadow-md transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {validandoPin ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando PIN...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Entrar al Panel de {local.nombre}</span>
              </>
            )}
          </button>

          {/* Enlace de Recuperación de PIN por WhatsApp */}
          <div className="mt-4 border-t border-stone-200 pt-3.5 text-center">
            <a
              href={urlRecuperarPinWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
              <span>¿Olvidaste tu PIN de acceso? Contáctanos por WhatsApp</span>
            </a>
          </div>
        </div>

        <p
          className={`relative z-10 text-center text-[11px] ${brand.subtitleText}`}
        >
          PideTirúa Admin · Conectado a Supabase en tiempo real
        </p>
      </div>
    );
  }

  // ============================================================================
  // 2. PANEL PRINCIPAL DE ADMINISTRACIÓN CON PALETA DEL NEGOCIO
  // ============================================================================
  const totalProductos = local.categorias.reduce(
    (acc, cat) => acc + cat.productos.length,
    0
  );
  const productosDisponibles = local.categorias.reduce(
    (acc, cat) =>
      acc + cat.productos.filter((p) => p.disponible !== false).length,
    0
  );

  return (
    <div
      className={`relative min-h-screen pb-24 print:min-h-0 print:bg-white print:pb-0 ${brand.bgBase} overflow-hidden`}
    >
      {/* Fondo ambiental con degradado suave y textura de ruido estática (Zero GPU loop) */}
      <GradientBackground
        gradientType="radial-gradient"
        gradientOrigin="top-middle"
        gradientSize="140% 110%"
        colors={[
          { color: "rgba(254, 240, 218, 0.45)", stop: "0%" },
          { color: "rgba(250, 248, 245, 0.75)", stop: "40%" },
          { color: "rgba(250, 248, 245, 1)", stop: "100%" },
        ]}
        noiseIntensity={0.5}
        noisePatternAlpha={28}
        noisePatternSize={85}
        noisePatternRefreshInterval={0}
      />

      {/* Fondo ambiental del negocio */}
      {posterFondo && (
        <div className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <img
            src={posterFondo}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover blur-xl opacity-35"
          />
          {videoDeFondo && (
            <video
              src={videoDeFondo}
              poster={posterFondo}
              preload="metadata"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              className="pointer-events-none select-none absolute inset-0 h-full w-full object-contain blur-[3px] opacity-45"
            />
          )}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${theme.videoOverlayGradient}`}
          />
        </div>
      )}

      {/* Toast flotante de confirmación inmediata ("Cambio guardado") */}
      {toastMensaje && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-2xl transition-all"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Barra superior especial si se accedió desde el Panel SuperAdmin */}
      {esSuperAdmin && (
        <div className="no-print relative z-40 border-b border-amber-400/35 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 px-4 py-2 text-amber-200 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 text-xs">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-300">
              <Crown className="h-4 w-4 shrink-0" />
              Modo SuperAdmin · Gestionando Carta de {local.nombre}
            </span>
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400 px-3 py-1 text-[11px] font-black text-stone-950 shadow-xs transition hover:bg-amber-300"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Volver a SuperAdmin</span>
            </Link>
          </div>
        </div>
      )}

      {/* Cabecera Fija de Escritorio con la paleta del local */}
      <header
        className={`no-print sticky top-0 z-30 border-b backdrop-blur-xl shadow-xs ${brand.headerBg}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white p-0.5 shadow-xs"
            >
              <img
                src={logoOficial}
                alt={local.nombre}
                className="h-full w-full rounded-lg object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`block text-[10px] font-extrabold uppercase tracking-wider ${brand.accentText}`}
                >
                  Administración · {local.rubro}
                </span>
                {local.plan === "llave_en_mano" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-800">
                    <Crown className="h-2.5 w-2.5" />
                    VIP Llave en Mano
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[9px] font-black uppercase text-sky-800">
                    Autogestionado
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    local.abierto
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {local.abierto ? "🟢 En línea" : "🔴 Cerrado"}
                </span>
              </div>
              <h1 className="truncate text-lg sm:text-xl font-display uppercase tracking-wide text-stone-900">
                {local.nombre}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/${local.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white bg-[#18181B] hover:bg-black shadow-xs transition"
              title="Abrir carta pública del cliente"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Carta Pública</span>
            </Link>

            <button
              type="button"
              onClick={handleCerrarSesion}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 active:scale-95 shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8 pt-6 pb-16 print:max-w-none print:space-y-0 print:p-0">
        {/* PREVISUALIZACIÓN DE IDENTIDAD VISUAL / HERO DE ESCRITORIO */}
        <section
          className={`no-print overflow-hidden rounded-3xl border shadow-sm ${brand.panelCardBg}`}
        >
          <div className="relative h-32 w-full overflow-hidden bg-stone-900 sm:h-44 md:h-52">
            <img
              src={bannerOficial}
              alt={`Portada de ${local.nombre}`}
              className="h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/80 bg-white p-1 shadow-md"
                >
                  <img
                    src={logoOficial}
                    alt={local.nombre}
                    className="h-full w-full rounded-xl object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-white/95 backdrop-blur-xs">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Panel Administrativo Oficial
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                        local.abierto
                          ? "bg-emerald-500 text-slate-950 shadow-xs"
                          : "bg-rose-500 text-white shadow-xs"
                      }`}
                    >
                      {local.abierto ? "🟢 Local Abierto" : "🔴 Local Cerrado"}
                    </span>
                  </div>
                  <h1 className="mt-1 truncate text-xl sm:text-2xl md:text-3xl font-display uppercase tracking-wide text-white drop-shadow-sm">
                    {local.nombre}
                  </h1>
                  <p className="hidden sm:block text-xs font-semibold text-white/85">
                    {local.rubro} · {local.ubicacion} · Horario: {local.horario} · Tel: {local.telefono_whatsapp || local.telefonoWhatsapp || "No configurado"}
                  </p>
                </div>
              </div>
              {esSuperAdmin && (
                <Link
                  href="/superadmin"
                  className="shrink-0 rounded-full border border-amber-400/50 bg-amber-400 px-3.5 py-2 text-xs font-black uppercase text-stone-950 shadow-xs transition hover:bg-amber-300"
                >
                  Cambiar Logo/Banner en SuperAdmin
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-stone-500 bg-stone-50/50 border-t border-stone-200/60">
            <span>
              🎨 El Logo y la Foto de Portada son administrados por{" "}
              <strong>PideTirúa</strong> para garantizar máxima calidad visual en computadores y celulares.
            </span>
            <span className="font-semibold text-stone-600">
              Tiempo estimado de retiro: <strong>{local.tiempo_estimado || "20-30 min"}</strong>
            </span>
          </div>
        </section>

        {/* NAVEGACIÓN MODERNA DE ESCRITORIO POR PESTAÑAS */}
        <div
          role="tablist"
          aria-label="Secciones del panel de administración"
          className="no-print flex items-center gap-2 overflow-x-auto rounded-2xl border border-stone-200/90 bg-white p-2 shadow-sm scrollbar-none"
        >
          <button
            type="button"
            role="tab"
            id="tab-carta"
            aria-selected={pestanaActiva === "carta"}
            aria-controls="panel-carta"
            onClick={() => setPestañaActiva("carta")}
            className={`flex min-h-[44px] flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-display uppercase tracking-wider transition active:scale-95 ${
              pestanaActiva === "carta"
                ? "bg-[#18181B] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>🍽️ Carta & Platos</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-cocina"
            aria-selected={pestanaActiva === "cocina"}
            aria-controls="panel-cocina"
            onClick={() => setPestañaActiva("cocina")}
            className={`flex min-h-[44px] flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-display uppercase tracking-wider transition active:scale-95 ${
              pestanaActiva === "cocina"
                ? "bg-amber-500 text-stone-950 shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>👨‍🍳 Monitor Cocina</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-reportes"
            aria-selected={pestanaActiva === "reportes"}
            aria-controls="panel-reportes"
            onClick={() => setPestañaActiva("reportes")}
            className={`flex min-h-[44px] flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-display uppercase tracking-wider transition active:scale-95 ${
              pestanaActiva === "reportes"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>📊 Ventas & Métricas</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-ajustes"
            aria-selected={pestanaActiva === "ajustes"}
            aria-controls="panel-ajustes"
            onClick={() => setPestañaActiva("ajustes")}
            className={`flex min-h-[44px] flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-display uppercase tracking-wider transition active:scale-95 ${
              pestanaActiva === "ajustes"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>⚙️ Ajustes & Local</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-todas"
            aria-selected={pestanaActiva === "todas"}
            aria-controls="panel-ajustes panel-reportes panel-cocina panel-carta"
            onClick={() => setPestañaActiva("todas")}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-display uppercase tracking-wider transition active:scale-95 ${
              pestanaActiva === "todas"
                ? "bg-stone-800 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            }`}
            title="Mostrar todas las secciones organizadas en una sola página"
          >
            <span>👁️ Ver Todo</span>
          </button>
        </div>

        {/* PESTAÑA: AJUSTES & OPERACIÓN DEL LOCAL (2 COLUMNAS EN ESCRITORIO) */}
        {(pestanaActiva === "ajustes" || pestanaActiva === "todas") && (
          <div
            role="tabpanel"
            id="panel-ajustes"
            aria-labelledby="tab-ajustes"
            className="space-y-6"
          >
            <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-display uppercase tracking-wide text-stone-900">
                    ⚙️ Configuración &amp; Operación del Local
                  </h2>
                  <p className={`text-xs ${brand.subtitleText}`}>
                    Control de apertura, tiempo estimado de retiro, WhatsApp, datos de pago y cartel QR para mesas.
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                  local.abierto
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {local.abierto ? "🟢 Local Abierto" : "🔴 Local Cerrado"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Columna Izquierda: Control Maestro y Ajustes Básicos */}
              <div className="space-y-6">
                {/* 1. CONTROL MAESTRO: Switch grande para estado Abierto / Cerrado */}
                <section
                  className={`no-print rounded-3xl border p-5 shadow-sm ${brand.panelCardBg}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
                    >
                      <Store className="h-4 w-4" />
                      Control Maestro del Local
                    </span>
                    <span className={`text-xs font-semibold ${brand.subtitleText}`}>
                      Horario: {local.horario}
                    </span>
                  </div>

                  <p className={`mt-1 text-xs ${brand.subtitleText}`}>
                    Toca el interruptor para abrir o cerrar la recepción de pedidos en tu carta digital al instante:
                  </p>

                  <button
                    type="button"
                    disabled={guardandoId === "local-abierto"}
                    onClick={handleToggleAbierto}
                    className={`mt-4 flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left shadow-md transition-all active:scale-[0.99] ${
                      local.abierto
                        ? "border-emerald-400 bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500"
                        : "border-rose-400 bg-rose-600 text-white shadow-rose-900/20 hover:bg-rose-500"
                    }`}
                  >
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-white/85">
                        Estado actual en vivo
                      </span>
                      <span className="mt-0.5 block text-lg font-black sm:text-xl">
                        {local.abierto ? "🟢 Local Abierto" : "🔴 Local Cerrado"}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-white/90">
                        {local.abierto
                          ? "Recibiendo pedidos por WhatsApp"
                          : "Carrito bloqueado · Solo lectura de carta"}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={`relative flex h-9 w-16 items-center rounded-full p-1 transition-colors ${
                          local.abierto ? "bg-emerald-950/45" : "bg-rose-950/45"
                        }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-full bg-white shadow-md transition-transform ${
                            local.abierto ? "translate-x-7" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                        {guardandoId === "local-abierto"
                          ? "Guardando..."
                          : "Tocar para cambiar"}
                      </span>
                    </div>
                  </button>

                  {/* Resumen rápido de platos */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-2.5">
                      <span className="block text-xl font-display text-emerald-800">
                        {productosDisponibles}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        Platos Disponibles
                      </span>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-2.5">
                      <span className="block text-xl font-display text-stone-800">
                        {totalProductos - productosDisponibles}
                      </span>
                      <span className={`text-[11px] font-bold ${brand.subtitleText}`}>
                        Platos Agotados
                      </span>
                    </div>
                  </div>

                  {/* MÓDULO 3: Control de Demora y Avisos de Contingencia en Vivo */}
                  <div className="mt-4 pt-4 border-t border-stone-200/90">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600" />
                        Tiempo Estimado de Espera
                      </span>
                      <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {tiempoEstimado}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-stone-500">
                      Selecciona la demora actual para informar a tus clientes en la cabecera de la carta:
                    </p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {[
                        { valor: "15-25 min", etiqueta: "⚡ 15-25 min", desc: "Rápido" },
                        { valor: "30-45 min", etiqueta: "🟡 30-45 min", desc: "Normal" },
                        { valor: "50-60 min", etiqueta: "🔥 50-60 min", desc: "Demorado" },
                      ].map((item) => {
                        const activo = tiempoEstimado === item.valor;
                        return (
                          <button
                            key={item.valor}
                            type="button"
                            disabled={guardandoId === "tiempo-estimado"}
                            onClick={() => handleActualizarTiempoEstimado(item.valor)}
                            className={`flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 border text-xs font-extrabold transition-all active:scale-95 ${
                              activo
                                ? "border-amber-500 bg-amber-50 text-amber-950 shadow-xs ring-2 ring-amber-400"
                                : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                            }`}
                          >
                            <span className="font-display tracking-wide">{item.etiqueta}</span>
                            <span className="text-[10px] font-medium opacity-75">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interruptor de Aviso de Emergencia o Contingencia */}
                  <div className="mt-4 pt-4 border-t border-stone-200/90">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                          Aviso de Emergencia o Contingencia
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nuevo = !emergenciaActiva;
                          setEmergenciaActiva(nuevo);
                          if (!nuevo) {
                            void handleGuardarAvisoEmergencia(true);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          emergenciaActiva ? "bg-amber-600" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            emergenciaActiva ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {emergenciaActiva && (
                      <div className="mt-3 space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                        <p className="text-[11px] font-semibold text-amber-950">
                          Escribe un mensaje de advertencia que se mostrará en un banner destacado a todos los clientes:
                        </p>
                        <input
                          type="text"
                          value={mensajeEmergencia}
                          onChange={(e) => setMensajeEmergencia(e.target.value)}
                          placeholder="Ej: ⚠️ Corte de luz comunal: demoras de 45 min"
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-600"
                        />

                        {/* Sugerencias Rápidas */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                            Sugerencias de un toque:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "⚠️ Corte de luz comunal: demoras de 45 min",
                              "⚠️ Solo atención por orden de llegada",
                              "⚠️ Alta demanda: tiempo de espera extendido",
                              "⚠️ Sin sistema Transbank: solo efectivo o CuentaRUT",
                            ].map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setMensajeEmergencia(sug)}
                                className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-100 transition active:scale-95 text-left"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            disabled={guardandoId === "aviso-emergencia"}
                            onClick={() => void handleGuardarAvisoEmergencia(false)}
                            className="flex-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 text-xs font-display uppercase tracking-wider shadow-xs transition active:scale-95 disabled:opacity-50 font-bold"
                          >
                            {guardandoId === "aviso-emergencia" ? "Guardando..." : "Publicar Aviso en Carta"}
                          </button>
                          {local.mensaje_emergencia && (
                            <button
                              type="button"
                              onClick={() => void handleGuardarAvisoEmergencia(true)}
                              className="rounded-full border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 py-2 px-3 text-xs font-bold transition"
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MÓDULO 2: Botón Cierre de Caja Diario y Cuadre de Turno */}
                  <button
                    type="button"
                    onClick={() => setMostrarCierreCaja(true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3.5 text-xs font-display uppercase tracking-wider text-stone-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] sm:text-sm font-extrabold"
                  >
                    <Moon className="h-4 w-4 shrink-0 text-stone-950" />
                    <span>🌙 Cierre de Caja de Hoy</span>
                    <Receipt className="h-4 w-4 shrink-0 text-stone-950" />
                  </button>

                  {/* Botón destacado para Generar Publicación para Redes / Estados con IA */}
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModalRedes(true);
                      if (!textoPostRedes) {
                        void handleGenerarPostRedes();
                      }
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 active:scale-[0.99] sm:text-sm"
                  >
                    <Megaphone className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>📢 Generar Publicación para Redes / Estados con IA</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  </button>
                </section>

                {/* 2.5 AJUSTES BÁSICOS Y SEGURIDAD DEL LOCAL (WhatsApp, Horario, Dirección y PIN) */}
                <section
                  className={`no-print rounded-3xl border p-5 shadow-sm ${brand.panelCardBg}`}
                >
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
                    >
                      <Settings className="h-4 w-4" />
                      Configuración Operativa
                    </span>
                    <h2 className="mt-0.5 text-lg font-display uppercase tracking-wide text-stone-900 sm:text-xl">
                      ⚙️ Ajustes Básicos y PIN de Seguridad
                    </h2>
                  </div>

                  <p className={`mt-1 text-xs ${brand.subtitleText}`}>
                    Actualiza tu número de recepción de pedidos por WhatsApp, horario de atención, dirección o tu clave PIN de 4 dígitos:
                  </p>

                  <form
                    onSubmit={handleGuardarAjustesBasicos}
                    className="mt-4 space-y-3 border-t border-stone-200 pt-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="al-telefono" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          Teléfono WhatsApp (+569...)
                        </label>
                        <input
                          id="al-telefono"
                          type="text"
                          value={telefonoWhatsapp}
                          onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                          placeholder="Ej: 56987654321"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="al-horario" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
                          <Clock className="h-3.5 w-3.5 text-sky-600" />
                          Horario de atención
                        </label>
                        <input
                          id="al-horario"
                          type="text"
                          value={horarioAtencion}
                          onChange={(e) => setHorarioAtencion(e.target.value)}
                          placeholder="Ej: 12:30 a 22:30 hrs"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="al-direccion" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
                          <MapPin className="h-3.5 w-3.5 text-amber-600" />
                          Dirección del local
                        </label>
                        <input
                          id="al-direccion"
                          type="text"
                          value={direccionLocal}
                          onChange={(e) => setDireccionLocal(e.target.value)}
                          placeholder="Ej: Av. Costanera 240, Tirúa"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="al-pin" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
                          <KeyRound className="h-3.5 w-3.5 text-rose-600" />
                          PIN de Seguridad (4 dígitos)
                        </label>
                        <input
                          id="al-pin"
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={nuevoPinSeguridad}
                          onChange={(e) =>
                            setNuevoPinSeguridad(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="Ej: 1234"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-mono text-xs font-extrabold tracking-widest text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={guardandoAjustes}
                      className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-display uppercase tracking-wider shadow-sm transition active:scale-[0.99] disabled:opacity-50 sm:text-sm ${brand.accentBg}`}
                    >
                      {guardandoAjustes ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Guardando ajustes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Guardar ajustes básicos y PIN</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>
              </div>

              {/* Columna Derecha: Datos Bancarios y Cartel QR */}
              <div className="space-y-6">
                {/* 3. DATOS PARA TRANSFERENCIA BANCARIA */}
                <section
                  className={`no-print rounded-3xl border p-5 shadow-sm ${brand.panelCardBg}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
                      >
                        <CreditCard className="h-4 w-4" />
                        Pagos del Cliente en Checkout
                      </span>
                      <h2 className="mt-0.5 text-lg font-display uppercase tracking-wide text-stone-900 sm:text-xl">
                        💳 Datos para Transferencia Bancaria
                      </h2>
                    </div>
                  </div>

                  <p className={`mt-1 text-xs ${brand.subtitleText}`}>
                    Estos datos se mostrarán automáticamente cuando un cliente elija pagar con <strong>Transferencia Bancaria</strong> en el carrito:
                  </p>

                  <form
                    onSubmit={handleGuardarDatosBancarios}
                    className="mt-4 space-y-3 border-t border-stone-200 pt-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="banco-nombre" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                          Banco
                        </label>
                        <input
                          id="banco-nombre"
                          type="text"
                          value={banco}
                          onChange={(e) => setBanco(e.target.value)}
                          placeholder="Ej: BancoEstado, Banco de Chile..."
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="banco-tipo" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                          Tipo de cuenta
                        </label>
                        <input
                          id="banco-tipo"
                          type="text"
                          value={tipoCuenta}
                          onChange={(e) => setTipoCuenta(e.target.value)}
                          placeholder="Ej: CuentaRUT / Cuenta Vista / Corriente"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="banco-numero" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                          N° de cuenta
                        </label>
                        <input
                          id="banco-numero"
                          type="text"
                          value={numeroCuenta}
                          onChange={(e) => setNumeroCuenta(e.target.value)}
                          placeholder="Ej: 18234567"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="banco-rut" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                          RUT del titular
                        </label>
                        <input
                          id="banco-rut"
                          type="text"
                          value={rutTitular}
                          onChange={(e) => setRutTitular(e.target.value)}
                          placeholder="Ej: 18.234.567-8"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="banco-titular" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                          Nombre del titular
                        </label>
                        <input
                          id="banco-titular"
                          type="text"
                          value={nombreTitular}
                          onChange={(e) => setNombreTitular(e.target.value)}
                          placeholder="Ej: Juan Pérez"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="banco-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                          Correo de confirmación
                        </label>
                        <input
                          id="banco-email"
                          type="email"
                          value={emailTransferencia}
                          onChange={(e) => setEmailTransferencia(e.target.value)}
                          placeholder="Ej: contacto@local.cl"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={guardandoBancos}
                      className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-display uppercase tracking-wider shadow-sm transition active:scale-[0.99] disabled:opacity-50 sm:text-sm ${brand.accentBg}`}
                    >
                      {guardandoBancos ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Guardando datos bancarios...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Guardar datos bancarios</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>

                {/* 2. GENERADOR DE CARTEL QR LISTO PARA IMPRIMIR */}
                <section
                  className={`rounded-3xl border p-5 shadow-sm print:border-none print:bg-transparent print:p-0 print:shadow-none ${brand.panelCardBg}`}
                >
                  <div className="no-print flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
                      >
                        <QrCode className="h-4 w-4" />
                        Código QR de Carta Digital
                      </span>
                      <h2 className="mt-0.5 text-lg font-display uppercase tracking-wide text-stone-900 sm:text-xl">
                        📱 Mi Cartel QR para Mesas
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMostrarCartelQr((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-xs transition active:scale-95 ${
                        mostrarCartelQr
                          ? "border border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200"
                          : brand.accentBg
                      }`}
                    >
                      {mostrarCartelQr ? (
                        <>
                          <X className="h-4 w-4" />
                          <span>Ocultar Cartel</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4" />
                          <span>Ver Cartel</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!mostrarCartelQr && (
                    <p className={`no-print mt-2 text-xs ${brand.subtitleText}`}>
                      Genera e imprime el cartel con código QR oficial de <strong>{local.nombre}</strong> para poner en tus mesas o mostrador.
                    </p>
                  )}

                  {/* Contenedor del Cartel QR (siempre disponible para @media print) */}
                  <div
                    id="printable-qr-flyer-wrapper"
                    className={`${
                      mostrarCartelQr ? "mt-5 flex flex-col items-center" : "hidden"
                    }`}
                  >
                    {/* Botones de Acción (No se imprimen) */}
                    <div className="no-print mb-5 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleImprimirCartel}
                        className={`flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-xs font-display uppercase tracking-wider shadow-sm transition active:scale-95 sm:text-sm ${brand.accentBg}`}
                      >
                        <Printer className="h-4 w-4 shrink-0" />
                        <span>🖨️ Imprimir Cartel</span>
                      </button>

                      <button
                        type="button"
                        disabled={descargandoQr}
                        onClick={() => void handleDescargarQrPng()}
                        className="flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3.5 text-xs font-bold text-stone-800 shadow-sm transition hover:bg-stone-50 active:scale-95 disabled:opacity-50 sm:text-sm"
                      >
                        {descargandoQr ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 shrink-0" />
                        )}
                        <span>⬇️ Descargar solo QR (PNG)</span>
                      </button>
                    </div>

                    {/* Vista Previa Visual del Flyer / Cartel de Mesa Listo para Imprimir */}
                    <div
                      id="printable-qr-flyer"
                      className="w-full max-w-md overflow-hidden rounded-3xl border-4 border-[#18181B] bg-white p-6 text-center text-[#18181B] shadow-2xl sm:p-8"
                    >
                      {/* Cinta / Título Superior */}
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#18181B] px-4 py-1.5 text-xs font-display uppercase tracking-wider text-white">
                        <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                        <span>¡Pide directo desde tu celular!</span>
                      </div>

                      {/* Logo, Nombre del Local Grande y su Rubro */}
                      <div className="mt-4 flex flex-col items-center">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-stone-200 bg-[#18181B] p-1.5 shadow-md">
                          <img
                            src={logoOficial}
                            alt={local.nombre}
                            className="h-full w-full rounded-xl object-contain"
                          />
                        </div>
                        <h3 className="mt-3 text-3xl font-display uppercase tracking-wide text-stone-900 sm:text-4xl">
                          {local.nombre}
                        </h3>
                        <span className="mt-1 inline-block rounded-full bg-orange-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                          {local.rubro}
                        </span>
                      </div>

                      {/* Código QR en Alta Resolución */}
                      <div className="my-5 inline-flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-[#FAF8F5] p-4 shadow-inner">
                        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
                          <img
                            src={qrImageUrl}
                            alt={`Código QR de ${local.nombre}`}
                            className="h-56 w-56 object-contain sm:h-64 sm:w-64"
                          />
                        </div>
                        <span className="mt-2.5 font-mono text-[11px] font-bold text-stone-600">
                          {urlPublicaLocal}
                        </span>
                      </div>

                      {/* Instrucciones al pie del QR en 3 pasos con iconos */}
                      <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4 text-left">
                        <p className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                          ¿Cómo hacer tu pedido en 3 pasos?
                        </p>
                        <ol className="space-y-2.5 text-xs font-bold text-stone-800 sm:text-sm">
                          <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-2xs border border-stone-100">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#18181B] text-white">
                              <Camera className="h-4 w-4" />
                            </span>
                            <span>
                              <strong>1.</strong> Abre la cámara de tu celular.
                            </span>
                          </li>
                          <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-2xs border border-stone-100">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#18181B] text-white">
                              <QrCode className="h-4 w-4" />
                            </span>
                            <span>
                              <strong>2.</strong> Escanea este código QR.
                            </span>
                          </li>
                          <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-2xs border border-stone-100">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                              <MessageCircle className="h-4 w-4" />
                            </span>
                            <span>
                              <strong>3.</strong> Revisa la carta y envía tu pedido a WhatsApp.
                            </span>
                          </li>
                        </ol>
                      </div>

                      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        PideTirúa · Carta Digital &amp; Pedidos Directos
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* 1.25 REPORTE DE VENTAS Y MÉTRICAS PARA EL DUEÑO */}
        {(pestanaActiva === "reportes" || pestanaActiva === "todas") && (
          <div
            role="tabpanel"
            id="panel-reportes"
            aria-labelledby="tab-reportes"
          >
            <VentasReportes
              localSlug={local.slug}
              localNombre={local.nombre}
              accentBg={brand.accentBg}
              accentText={brand.accentText}
              panelCardBg={brand.panelCardBg}
              subtitleText={brand.subtitleText}
              onNotify={mostrarToast}
            />
          </div>
        )}

        {/* 1.5 MONITOR DE COCINA EN TIEMPO REAL CON ALERTA SONORA (KDS) */}
        <div
          role="tabpanel"
          id="panel-cocina"
          aria-labelledby="tab-cocina"
          className={
            pestanaActiva === "cocina" || pestanaActiva === "todas"
              ? "block"
              : "hidden"
          }
        >
          <KitchenMonitor
            localSlug={local.slug}
            localNombre={local.nombre}
            accentBg={brand.accentBg}
            accentText={brand.accentText}
            panelCardBg={brand.panelCardBg}
            subtitleText={brand.subtitleText}
            onNotify={mostrarToast}
          />
        </div>

        {/* 2. GESTIÓN DE CARTA Y MENÚ */}
        {(pestanaActiva === "carta" || pestanaActiva === "todas") && (
          <div
            role="tabpanel"
            id="panel-carta"
            aria-labelledby="tab-carta"
            className="space-y-6"
          >
        {/* 3.5 GESTIÓN DE CATEGORÍAS DE LA CARTA */}
        <section
          className={`no-print rounded-3xl border p-5 shadow-sm ${brand.panelCardBg}`}
        >
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
            >
              <Layers className="h-4 w-4" />
              Estructura del Menú
            </span>
            <h2 className="mt-0.5 text-lg font-display uppercase tracking-wide text-stone-900 sm:text-xl">
              📂 Gestión de Categorías de la Carta
            </h2>
          </div>

          <p className={`mt-1 text-xs ${brand.subtitleText}`}>
            Crea nuevas categorías para organizar tus platos (ej: Promociones,
            Sandwiches, Bebidas, Postres):
          </p>

          <form
            onSubmit={handleCrearCategoria}
            className="mt-3 flex flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="text"
              value={nombreCategoriaCrear}
              onChange={(e) => setNombreCategoriaCrear(e.target.value)}
              placeholder="Nombre de la nueva categoría (ej: Bebidas y Jugos)"
              className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
            />
            <button
              type="submit"
              disabled={creandoCategoria || !nombreCategoriaCrear.trim()}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-display uppercase tracking-wider shadow-xs transition active:scale-95 disabled:opacity-50 ${brand.accentBg}`}
            >
              {creandoCategoria ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4" />
              )}
              <span>Crear Categoría</span>
            </button>
          </form>

          {local.categorias.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              {local.categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700"
                >
                  <span>
                    {cat.nombre} ({cat.productos.length})
                  </span>
                  {cat.productos.length === 0 && (
                    <button
                      type="button"
                      disabled={guardandoId === `del-cat-${cat.id}`}
                      onClick={() =>
                        void handleEliminarCategoria(cat.id, cat.nombre)
                      }
                      className="rounded-full p-0.5 text-rose-500 hover:bg-rose-100"
                      title="Eliminar categoría vacía"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. SECCIÓN PARA SUBIR NUEVOS PLATOS Y FOTOS DE COMIDA */}
        <section
          className={`no-print rounded-3xl border p-5 shadow-sm ${brand.panelCardBg}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
              >
                <Sparkles className="h-4 w-4" />
                Agregar Platos a tu Carta
              </span>
              <h2 className="mt-0.5 text-lg font-display uppercase tracking-wide text-stone-900 sm:text-xl">
                Subir Nuevo Plato con Foto
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setMostrarFormNuevo((prev) => !prev);
                setErrorNuevoPlato(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-xs transition active:scale-95 ${
                mostrarFormNuevo
                  ? "border border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200"
                  : brand.accentBg
              }`}
            >
              {mostrarFormNuevo ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Cerrar</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Nuevo Plato</span>
                </>
              )}
            </button>
          </div>

          {!mostrarFormNuevo ? (
            <p className={`mt-2 text-xs ${brand.subtitleText}`}>
              Sube platos nuevos con foto tomada desde tu celular o galería,
              define su precio y publícalos al instante en la carta de{" "}
              <strong>{local.nombre}</strong>.
            </p>
          ) : (
            <form
              onSubmit={handleCrearNuevoPlato}
              className="mt-4 space-y-4 border-t border-stone-200 pt-4"
            >
              {/* Cargador de Foto de la Comida */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700">
                  1. Foto del plato (Cámara o Galería)
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50">
                    {nuevaFotoUrl ? (
                      <img
                        src={nuevaFotoUrl}
                        alt="Vista previa del plato"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center p-2 text-stone-400">
                        <Camera className="h-7 w-7 mb-1" />
                        <span className="text-[10px] font-bold">Sin foto</span>
                      </div>
                    )}
                    {subiendoFotoNueva && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2
                          className={`h-6 w-6 animate-spin ${brand.accentText}`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={inputFotoNuevoRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSeleccionarFotoNuevoPlato}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={subiendoFotoNueva}
                      onClick={() => inputFotoNuevoRef.current?.click()}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-display uppercase tracking-wider shadow-xs transition active:scale-95 sm:w-auto ${brand.accentBg}`}
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span>
                        {subiendoFotoNueva
                          ? "Subiendo foto..."
                          : nuevaFotoUrl
                          ? "Cambiar foto del plato"
                          : "Subir foto desde mi celular"}
                      </span>
                    </button>

                    <input
                      type="url"
                      value={nuevaFotoUrl}
                      onChange={(e) => setNuevaFotoUrl(e.target.value)}
                      placeholder="O pega el enlace URL de una foto (opcional)..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Categoría */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                    2. Categoría del menú *
                  </label>
                  <select
                    value={nuevoCategoriaId}
                    onChange={(e) => setNuevoCategoriaId(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                  >
                    {local.categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                    <option value="__nueva__">
                      + Crear nueva categoría...
                    </option>
                  </select>
                </div>

                {nuevoCategoriaId === "__nueva__" ? (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Nombre de la nueva categoría *
                    </label>
                    <input
                      type="text"
                      value={nuevaCategoriaNombre}
                      onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                      placeholder="Ej: Postres Caseros, Promociones..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Etiqueta destacada (opcional)
                    </label>
                    <input
                      type="text"
                      value={nuevaEtiqueta}
                      onChange={(e) => setNuevaEtiqueta(e.target.value)}
                      placeholder="Ej: Nuevo, Más pedido, Especialidad"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Nombre y Precio */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                    3. Nombre del plato *
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Churrasco Italiano Gigante + Papas"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">
                    4. Precio (CLP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={nuevoPrecio}
                      onChange={(e) => setNuevoPrecio(e.target.value)}
                      placeholder="Ej: 7500"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-7 pr-3 text-xs font-extrabold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción del plato con botón IA */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    5. Descripción de los ingredientes
                  </label>
                  <button
                    type="button"
                    disabled={generandoDescripcionId === "nuevo" || !nuevoNombre.trim()}
                    onClick={() => {
                      const cat = local.categorias.find((c) => c.id === nuevoCategoriaId);
                      void handleGenerarDescripcionIa(
                        nuevoNombre,
                        cat ? cat.nombre : nuevaCategoriaNombre || local.rubro,
                        "nuevo"
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      !nuevoNombre.trim()
                        ? "Escribe primero el nombre del plato"
                        : "Generar descripción apetitosa con Gemini"
                    }
                  >
                    {generandoDescripcionId === "nuevo" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                        <span>Generando texto apetitoso...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        <span>✨ Describir con IA</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Describe los ingredientes o pulsa '✨ Describir con IA'..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] focus:bg-white"
                />
              </div>

              {/* 6. Interruptor de Oferta del Día */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-500 fill-rose-500" />
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-900">
                        ¿Activar como Oferta del Día?
                      </span>
                      <span className="block text-[11px] font-medium text-stone-500">
                        Se promocionará en el carrusel de ofertas de la portada comunal
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNuevoEsOferta((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      nuevoEsOferta ? "bg-[#EA580C]" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        nuevoEsOferta ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {nuevoEsOferta && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-rose-700">
                        Precio Oferta (CLP) *
                      </label>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={nuevoPrecioOferta}
                          onChange={(e) => setNuevoPrecioOferta(e.target.value)}
                          placeholder="Ej: 6000"
                          className="w-full rounded-xl border border-rose-300 bg-white py-2 pl-7 pr-3 text-xs font-black text-stone-900 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-rose-700">
                        Etiqueta de Promo (ej: 20% OFF, 2x1)
                      </label>
                      <input
                        type="text"
                        value={nuevoTextoPromo}
                        onChange={(e) => setNuevoTextoPromo(e.target.value)}
                        placeholder="Ej: 20% OFF, 2x1, Promo del Día"
                        className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ⚙️ Personalización y Extras del Plato (Módulo 1) */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-900">
                        ⚙️ Personalización y Extras del Plato
                      </span>
                      <span className="block text-[11px] font-medium text-stone-500">
                        Permite a los clientes elegir salsas, aderezos o agregados
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNuevasOpciones((prev) => [
                        ...prev,
                        {
                          titulo: "",
                          tipo: "unica",
                          items: [{ nombre: "", precio: 0 }],
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-2xs hover:bg-amber-50 active:scale-95"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Añadir grupo</span>
                  </button>
                </div>

                {nuevasOpciones.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {nuevasOpciones.map((grupo, gIdx) => (
                      <div
                        key={gIdx}
                        className="rounded-xl border border-stone-200 bg-white p-3 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Grupo #{gIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNuevasOpciones((prev) =>
                                prev.filter((_, idx) => idx !== gIdx)
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Eliminar grupo</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-600">
                              Título del grupo *
                            </label>
                            <input
                              type="text"
                              value={grupo.titulo}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNuevasOpciones((prev) =>
                                  prev.map((g, idx) =>
                                    idx === gIdx ? { ...g, titulo: val } : g
                                  )
                                );
                              }}
                              placeholder="Ej: Elige tu salsa o Agregados"
                              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-600">
                              Tipo de selección *
                            </label>
                            <select
                              value={grupo.tipo}
                              onChange={(e) => {
                                const val = e.target.value as "unica" | "multiple";
                                setNuevasOpciones((prev) =>
                                  prev.map((g, idx) =>
                                    idx === gIdx ? { ...g, tipo: val } : g
                                  )
                                );
                              }}
                              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                            >
                              <option value="unica">
                                Una sola opción obligatoria (Radio)
                              </option>
                              <option value="multiple">
                                Múltiples opciones opcionales (Checkboxes)
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-stone-100">
                          <label className="block text-[10px] font-black uppercase tracking-wider text-stone-400">
                            Opciones / Extras:
                          </label>
                          {grupo.items.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.nombre}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNuevasOpciones((prev) =>
                                    prev.map((g, idx) =>
                                      idx === gIdx
                                        ? {
                                            ...g,
                                            items: g.items.map((it, itemIdx) =>
                                              itemIdx === iIdx
                                                ? { ...it, nombre: val }
                                                : it
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                }}
                                placeholder="Nombre (ej: Mayo Casera)"
                                className="flex-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none"
                              />
                              <div className="relative w-24 shrink-0">
                                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-400">
                                  +$
                                </span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  value={item.precio || ""}
                                  onChange={(e) => {
                                    const num = Math.max(
                                      0,
                                      Number(e.target.value.replace(/[^0-9]/g, "")) || 0
                                    );
                                    setNuevasOpciones((prev) =>
                                      prev.map((g, idx) =>
                                        idx === gIdx
                                          ? {
                                              ...g,
                                              items: g.items.map((it, itemIdx) =>
                                                itemIdx === iIdx
                                                  ? { ...it, precio: num }
                                                  : it
                                              ),
                                            }
                                          : g
                                      )
                                    );
                                  }}
                                  placeholder="0 (Gratis)"
                                  className="w-full rounded-md border border-stone-200 bg-stone-50 py-1 pl-5 pr-1 text-xs font-bold text-stone-900 focus:bg-white focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNuevasOpciones((prev) =>
                                    prev.map((g, idx) =>
                                      idx === gIdx
                                        ? {
                                            ...g,
                                            items: g.items.filter(
                                              (_, itemIdx) => itemIdx !== iIdx
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                }}
                                className="flex h-6 w-6 items-center justify-center text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setNuevasOpciones((prev) =>
                                prev.map((g, idx) =>
                                  idx === gIdx
                                    ? {
                                        ...g,
                                        items: [
                                          ...g.items,
                                          { nombre: "", precio: 0 },
                                        ],
                                      }
                                    : g
                                )
                              );
                            }}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                          >
                            <Plus className="h-3 w-3" />
                            <span>+ Añadir opción a este grupo</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorNuevoPlato && (
                <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  {errorNuevoPlato}
                </p>
              )}

              <button
                type="submit"
                disabled={creandoPlato || subiendoFotoNueva}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-display uppercase tracking-wider shadow-sm transition active:scale-[0.99] disabled:opacity-50 ${brand.accentBg}`}
              >
                {creandoPlato ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Publicando plato en la carta...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Publicar Plato en la Carta</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* 5. LISTADO DE PRODUCTOS AGRUPADOS POR CATEGORÍA */}
        <div className="no-print space-y-6">
          {local.categorias.map((categoria) => (
            <section
              key={categoria.id}
              className={`rounded-3xl border p-4 shadow-xl sm:p-5 ${brand.panelCardBg}`}
            >
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-display uppercase tracking-wide text-stone-900">
                    {categoria.nombre}
                  </h2>
                  {categoria.activa === false && (
                    <span className="rounded-full bg-slate-200 border border-slate-300 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                      ⏸️ Pausada
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* MÓDULO 4: Switch Pausador Masivo de Categoría */}
                  <button
                    type="button"
                    disabled={guardandoId === `cat-pause-${categoria.id}`}
                    onClick={() =>
                      handleToggleCategoriaPausa(
                        categoria.id,
                        categoria.activa !== false ? false : true
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-xs active:scale-95 ${
                      categoria.activa !== false
                        ? "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300"
                        : "bg-amber-600 text-white hover:bg-amber-700 border border-amber-600"
                    }`}
                  >
                    {guardandoId === `cat-pause-${categoria.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : categoria.activa !== false ? (
                      <span>⏸️ Pausar por hoy</span>
                    ) : (
                      <span>▶️ Reanudar categoría</span>
                    )}
                  </button>

                  <span
                    className="rounded-full border border-stone-200 bg-stone-100 px-3 py-0.5 text-xs font-bold text-stone-600"
                  >
                    {categoria.productos.length}{" "}
                    {categoria.productos.length === 1 ? "plato" : "platos"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoria.productos.map((producto) => {
                  const disponible = producto.disponible !== false;
                  const editState = ediciones[producto.id] ?? {
                    nombre: producto.nombre,
                    precio: String(producto.precio),
                    descripcion: producto.descripcion,
                    etiqueta: producto.etiqueta || "",
                    es_oferta: Boolean(producto.es_oferta),
                    precio_oferta:
                      producto.precio_oferta != null
                        ? String(producto.precio_oferta)
                        : "",
                    texto_promo: producto.texto_promo || "",
                  };
                  const precioNumerico = Number(
                    String(editState.precio).replace(/[^0-9]/g, "")
                  );
                  const precioOfertaNumerico = Number(
                    String(editState.precio_oferta || "").replace(/[^0-9]/g, "")
                  );
                  const hayCambiosSinGuardar =
                    editState.nombre.trim() !== producto.nombre ||
                    precioNumerico !== producto.precio ||
                    editState.descripcion.trim() !== producto.descripcion ||
                    editState.etiqueta.trim() !== (producto.etiqueta || "") ||
                    Boolean(editState.es_oferta) !== Boolean(producto.es_oferta) ||
                    (precioOfertaNumerico || 0) !== (producto.precio_oferta || 0) ||
                    editState.texto_promo.trim() !== (producto.texto_promo || "");

                  return (
                    <div
                      key={producto.id}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        disponible
                          ? "border-stone-200/90 bg-white text-stone-900 shadow-sm"
                          : "border-stone-200 bg-stone-100/70 text-stone-500 opacity-80"
                      }`}
                    >
                      {/* Fila superior: Miniatura con botón para cambiar foto + Switch [Disponible / Agotado] */}
                      <div className="mb-3 flex items-center justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <label
                            className="group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-xs"
                            title="Toca para subir o cambiar la foto de este plato"
                          >
                            <img
                              src={producto.imagen_url || producto.imagen}
                              alt={producto.nombre}
                              className={`h-full w-full object-cover ${
                                !disponible ? "grayscale opacity-60" : ""
                              }`}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-[9px] font-extrabold text-white opacity-0 transition-opacity group-hover:opacity-100">
                              <Camera className="h-3.5 w-3.5 mb-0.5" />
                              <span>Foto</span>
                            </div>
                            {guardandoId === `foto-${producto.id}` && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleCambiarFotoProductoExistente(
                                    producto,
                                    file
                                  );
                                }
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                                  disponible
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-stone-200 text-stone-600 border border-stone-300"
                                }`}
                              >
                                {disponible ? "🟢 Disponible" : "⚪ Agotado"}
                              </span>

                              <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[10px] font-bold text-stone-600 hover:bg-stone-100">
                                <Camera className="h-3 w-3" />
                                <span>Cambiar foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void handleCambiarFotoProductoExistente(
                                        producto,
                                        file
                                      );
                                    }
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-sm font-display uppercase tracking-wider text-stone-900">
                                {formatCLP(producto.precio)}
                              </p>

                              {/* Botón Gestión de Extras y Opciones (Módulo 1) */}
                              <button
                                type="button"
                                onClick={() => setPlatoParaEditarOpciones(producto)}
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition active:scale-95 ${
                                  producto.opciones && producto.opciones.length > 0
                                    ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                                    : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                                }`}
                              >
                                <Sparkles className="h-3 w-3 text-amber-600" />
                                <span>
                                  {producto.opciones && producto.opciones.length > 0
                                    ? `⚙️ Extras (${producto.opciones.length} grupo${
                                        producto.opciones.length > 1 ? "s" : ""
                                      })`
                                    : "⚙️ Configurar Extras"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {/* Switch directo: [Disponible / Agotado] */}
                          <button
                            type="button"
                            disabled={guardandoId === `disp-${producto.id}`}
                            onClick={() => handleToggleDisponible(producto)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                              disponible
                                ? "border-emerald-300 bg-emerald-600 text-white shadow-xs hover:bg-emerald-500"
                                : "border-stone-300 bg-stone-200 text-stone-700 hover:bg-stone-300"
                            }`}
                          >
                            <div
                              className={`relative flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                                disponible
                                  ? "bg-emerald-950/40"
                                  : "bg-stone-400"
                              }`}
                            >
                              <div
                                className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                  disponible ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </div>
                            <span>{disponible ? "Disponible" : "Agotado"}</span>
                          </button>

                          {/* Botón eliminar plato */}
                          <button
                            type="button"
                            disabled={guardandoId === `del-${producto.id}`}
                            onClick={() => void handleEliminarProducto(producto)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:scale-95"
                            title="Eliminar plato de la carta"
                          >
                            {guardandoId === `del-${producto.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Fila inferior: Edición rápida de Nombre, Precio, Descripción y Etiqueta */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                        <div className="sm:col-span-7">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            Nombre del plato
                          </label>
                          <input
                            type="text"
                            value={editState.nombre}
                            onChange={(e) =>
                              setEdiciones((prev) => ({
                                ...prev,
                                [producto.id]: {
                                  ...editState,
                                  nombre: e.target.value,
                                },
                              }))
                            }
                            onBlur={() => {
                              if (hayCambiosSinGuardar) {
                                void handleGuardarEdicionProducto(producto);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-900 focus:border-[#EA580C] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex items-end gap-2 sm:col-span-5">
                          <div className="flex-1">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              Precio (CLP)
                            </label>
                            <div className="relative">
                              <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                              <input
                                type="number"
                                inputMode="numeric"
                                value={editState.precio}
                                onChange={(e) =>
                                  setEdiciones((prev) => ({
                                    ...prev,
                                    [producto.id]: {
                                      ...editState,
                                      precio: e.target.value,
                                    },
                                  }))
                                }
                                onBlur={() => {
                                  if (hayCambiosSinGuardar) {
                                    void handleGuardarEdicionProducto(producto);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-7 pr-2.5 text-xs font-extrabold text-stone-900 focus:border-[#EA580C] focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={
                              !hayCambiosSinGuardar ||
                              guardandoId === `edit-${producto.id}`
                            }
                            onClick={() =>
                              void handleGuardarEdicionProducto(producto)
                            }
                            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3.5 text-xs font-display uppercase tracking-wider transition ${
                              hayCambiosSinGuardar
                                ? `${brand.accentBg} shadow-xs active:scale-95`
                                : "border border-stone-200 bg-stone-100 text-stone-400"
                            }`}
                            title="Guardar cambios"
                          >
                            {guardandoId === `edit-${producto.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>Guardar</span>
                          </button>
                        </div>

                        <div className="sm:col-span-8">
                          <div className="mb-1 flex items-center justify-between">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              Descripción
                            </label>
                            <button
                              type="button"
                              disabled={
                                generandoDescripcionId === producto.id ||
                                !editState.nombre.trim()
                              }
                              onClick={() =>
                                void handleGenerarDescripcionIa(
                                  editState.nombre,
                                  categoria.nombre,
                                  producto.id
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:opacity-40"
                              title="Generar descripción apetitosa con Gemini"
                            >
                              {generandoDescripcionId === producto.id ? (
                                <>
                                  <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-600" />
                                  <span>Generando...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                                  <span>✨ Describir con IA</span>
                                </>
                              )}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={editState.descripcion}
                            onChange={(e) =>
                              setEdiciones((prev) => ({
                                ...prev,
                                [producto.id]: {
                                  ...editState,
                                  descripcion: e.target.value,
                                },
                              }))
                            }
                            onBlur={() => {
                              if (hayCambiosSinGuardar) {
                                void handleGuardarEdicionProducto(producto);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 focus:border-[#EA580C] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            Etiqueta (opcional)
                          </label>
                          <input
                            type="text"
                            value={editState.etiqueta}
                            placeholder="Ej: Nuevo, Más pedido"
                            onChange={(e) =>
                              setEdiciones((prev) => ({
                                ...prev,
                                [producto.id]: {
                                  ...editState,
                                  etiqueta: e.target.value,
                                },
                              }))
                            }
                            onBlur={() => {
                              if (hayCambiosSinGuardar) {
                                void handleGuardarEdicionProducto(producto);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:border-[#EA580C] focus:bg-white focus:outline-none"
                          />
                        </div>

                        {/* Control de Oferta del Día */}
                        <div className="mt-1 rounded-2xl border border-amber-200/90 bg-amber-50/60 p-3 sm:col-span-12">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-amber-950">
                              <input
                                type="checkbox"
                                checked={Boolean(editState.es_oferta)}
                                onChange={(e) => {
                                  const activo = e.target.checked;
                                  const updated = {
                                    ...editState,
                                    es_oferta: activo,
                                    precio_oferta:
                                      activo && !editState.precio_oferta
                                        ? String(Math.round(producto.precio * 0.85))
                                        : editState.precio_oferta,
                                    texto_promo:
                                      activo && !editState.texto_promo
                                        ? "🔥 Oferta del Día"
                                        : editState.texto_promo,
                                  };
                                  setEdiciones((prev) => ({
                                    ...prev,
                                    [producto.id]: updated,
                                  }));
                                }}
                                className="h-4 w-4 rounded border-amber-300 text-[#EA580C] focus:ring-[#EA580C]"
                              />
                              <Flame className="h-3.5 w-3.5 text-[#EA580C]" />
                              <span>¿Activar como Oferta del Día?</span>
                            </label>

                            {editState.es_oferta && (
                              <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                                Visible en portada de Tirúa
                              </span>
                            )}
                          </div>

                          {editState.es_oferta && (
                            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-950">
                                  Precio Oferta (CLP)
                                </label>
                                <div className="relative">
                                  <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-600" />
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={editState.precio_oferta}
                                    placeholder={String(Math.round(producto.precio * 0.85))}
                                    onChange={(e) =>
                                      setEdiciones((prev) => ({
                                        ...prev,
                                        [producto.id]: {
                                          ...editState,
                                          precio_oferta: e.target.value,
                                        },
                                      }))
                                    }
                                    onBlur={() => {
                                      if (hayCambiosSinGuardar) {
                                        void handleGuardarEdicionProducto(producto);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="w-full rounded-xl border border-amber-300 bg-white py-1.5 pl-7 pr-2.5 text-xs font-black text-amber-950 focus:border-[#EA580C] focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-950">
                                  Etiqueta de Promo
                                </label>
                                <input
                                  type="text"
                                  value={editState.texto_promo}
                                  placeholder="Ej: 20% OFF, Promo del Día, 2x1"
                                  onChange={(e) =>
                                    setEdiciones((prev) => ({
                                      ...prev,
                                      [producto.id]: {
                                        ...editState,
                                        texto_promo: e.target.value,
                                      },
                                    }))
                                  }
                                  onBlur={() => {
                                    if (hayCambiosSinGuardar) {
                                      void handleGuardarEdicionProducto(producto);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 placeholder:text-amber-400 focus:border-[#EA580C] focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          </div>
        </div>
        )}
      </main>

      {/* MODAL IA: GENERADOR DE PUBLICACIÓN PARA REDES Y ESTADOS DE WHATSAPP */}
      {mostrarModalRedes && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181B]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white text-stone-900 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="p-5 pb-4 bg-[#18181B] text-white flex items-start justify-between border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    Marketing con Gemini IA
                  </span>
                  <h3 className="mt-0.5 text-lg font-display uppercase tracking-wide text-white">
                    📢 Anuncio para Redes y Estados
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModalRedes(false)}
                className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="p-5 space-y-4 overflow-y-auto bg-[#FAF8F5]">
              <p className="text-xs text-stone-600">
                Texto promocional optimizado con emojis y tu enlace directo a la carta para publicar en tus Estados de WhatsApp, Facebook o Instagram:
              </p>

              {generandoPostRedes ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3 shadow-xs">
                  <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" />
                  <p className="text-xs font-bold text-stone-700">
                    Generando texto apetitoso y vendedor con IA...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={7}
                      value={textoPostRedes}
                      onChange={(e) => setTextoPostRedes(e.target.value)}
                      placeholder="Escribe o genera un anuncio para tus redes sociales..."
                      className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-xs sm:text-sm font-medium leading-relaxed text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#EA580C] shadow-xs"
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleCopiarPostRedes}
                      className="flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white py-3 px-4 text-xs font-display uppercase tracking-wider text-stone-800 shadow-xs transition hover:bg-stone-50 active:scale-95"
                    >
                      {postCopiado ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>📋 Copiar texto</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCompartirEstadoWhatsapp}
                      className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] py-3 px-4 text-xs font-display uppercase tracking-wider text-white shadow-xs transition active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <span>📲 Compartir en WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del modal con botón regenerar */}
            <div className="border-t border-stone-200 bg-white p-4 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={generandoPostRedes}
                onClick={handleGenerarPostRedes}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>🔄 Generar otra versión</span>
              </button>

              <button
                type="button"
                onClick={() => setMostrarModalRedes(false)}
                className="rounded-full border border-stone-200 bg-stone-100 px-4 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-200 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cierre de Caja Diario (Módulo 2) */}
      <ModalCierreCaja
        isOpen={mostrarCierreCaja}
        onClose={() => setMostrarCierreCaja(false)}
        localSlug={local.slug}
        localNombre={local.nombre}
        telefonoWhatsapp={local.telefono_whatsapp || local.telefonoWhatsapp || ""}
      />

      {/* Modal de Gestión de Opciones y Extras (Módulo 1) */}
      <ModalGestionOpcionesPlato
        isOpen={Boolean(platoParaEditarOpciones)}
        onClose={() => setPlatoParaEditarOpciones(null)}
        producto={platoParaEditarOpciones}
        onGuardar={handleGuardarOpcionesProducto}
      />
    </div>
  );
}
