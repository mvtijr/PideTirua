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
} from "lucide-react";
import { Local, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";
import { getLocalTheme, getVideoPoster } from "@/lib/localTheme";
import KitchenMonitor from "@/components/KitchenMonitor";
import VentasReportes from "@/components/VentasReportes";

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
  switch (slug) {
    case "las-tranqueras":
      return {
        bgBase: "bg-[#171614]",
        headerBg: "border-[#F8DC4B]/35 bg-[#171614]/90 text-[#FFFDF2]",
        panelCardBg:
          "border-[#F8DC4B]/35 bg-[#171614]/85 text-[#FFFDF2] backdrop-blur-md",
        accentBg: "bg-[#F8DC4B] text-[#171614] hover:bg-[#f6d52b]",
        accentText: "text-[#F8DC4B]",
        accentBorder: "border-[#F8DC4B]/45",
        accentRing: "focus:border-[#F8DC4B] focus:ring-[#F8DC4B]/30",
        pinActiveBox:
          "border-[#F8DC4B] bg-[#F8DC4B]/20 text-[#F8DC4B] shadow-lg shadow-[#F8DC4B]/15",
        pinBtn:
          "border-[#F8DC4B]/25 bg-[#171614]/90 text-[#FFFDF2] hover:border-[#F8DC4B] hover:bg-[#F8DC4B]/15",
        subtitleText: "text-[#FFFDF2]/80",
        badgeBg: "bg-[#F8DC4B]/20 text-[#F8DC4B] border border-[#F8DC4B]/45",
      };
    case "sushi-burger":
      return {
        bgBase: "bg-[#141414]",
        headerBg: "border-[#E85D3F]/35 bg-[#141414]/90 text-white",
        panelCardBg:
          "border-[#E85D3F]/35 bg-[#141414]/85 text-white backdrop-blur-md",
        accentBg: "bg-[#E85D3F] text-white hover:bg-[#d44d30]",
        accentText: "text-[#FF8A70]",
        accentBorder: "border-[#E85D3F]/45",
        accentRing: "focus:border-[#E85D3F] focus:ring-[#E85D3F]/30",
        pinActiveBox:
          "border-[#E85D3F] bg-[#E85D3F]/20 text-[#FF8A70] shadow-lg shadow-[#E85D3F]/15",
        pinBtn:
          "border-[#E85D3F]/25 bg-[#141414]/90 text-white hover:border-[#E85D3F] hover:bg-[#E85D3F]/15",
        subtitleText: "text-white/80",
        badgeBg: "bg-[#E85D3F]/20 text-[#FF8A70] border border-[#E85D3F]/45",
      };
    case "rio-mar":
      return {
        bgBase: "bg-[#0A0A0A]",
        headerBg: "border-[#D4A843]/35 bg-[#0A0A0A]/90 text-white",
        panelCardBg:
          "border-[#D4A843]/35 bg-[#0A0A0A]/85 text-white backdrop-blur-md",
        accentBg: "bg-[#D4A843] text-[#0A0A0A] hover:bg-[#e0b654]",
        accentText: "text-[#D4A843]",
        accentBorder: "border-[#D4A843]/45",
        accentRing: "focus:border-[#D4A843] focus:ring-[#D4A843]/30",
        pinActiveBox:
          "border-[#D4A843] bg-[#D4A843]/20 text-[#D4A843] shadow-lg shadow-[#D4A843]/15",
        pinBtn:
          "border-[#D4A843]/25 bg-[#0A0A0A]/90 text-white hover:border-[#D4A843] hover:bg-[#D4A843]/15",
        subtitleText: "text-white/80",
        badgeBg: "bg-[#D4A843]/20 text-[#F3D078] border border-[#D4A843]/45",
      };
    case "gran-pacifico":
    default:
      return {
        bgBase: "bg-[#0F314A]",
        headerBg: "border-[#38BDF8]/35 bg-[#0F314A]/90 text-white",
        panelCardBg:
          "border-[#38BDF8]/35 bg-[#0F314A]/85 text-white backdrop-blur-md",
        accentBg: "bg-[#F06A59] text-white hover:bg-[#e05644]",
        accentText: "text-[#7DD3FC]",
        accentBorder: "border-[#38BDF8]/45",
        accentRing: "focus:border-[#38BDF8] focus:ring-[#38BDF8]/30",
        pinActiveBox:
          "border-[#38BDF8] bg-[#38BDF8]/20 text-[#7DD3FC] shadow-lg shadow-[#38BDF8]/15",
        pinBtn:
          "border-[#38BDF8]/25 bg-[#0F314A]/90 text-white hover:border-[#38BDF8] hover:bg-[#38BDF8]/15",
        subtitleText: "text-white/85",
        badgeBg: "bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/45",
      };
  }
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

  useEffect(() => {
    if (segundosBloqueo <= 0) return;
    const interval = setInterval(() => {
      setSegundosBloqueo((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [segundosBloqueo]);

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

  // Pestaña o sección activa en el panel admin
  const [pestanaActiva, setPestañaActiva] = useState<
    "todas" | "reportes" | "cocina" | "carta"
  >("todas");

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
      if (initialSuperAdmin) setEsSuperAdmin(true);
      setVerificandoSesion(false);
      return;
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const querySuperAdmin = urlParams.get("superadmin") === "true";
      const sesionSuperAdmin =
        localStorage.getItem("pidetirua_superadmin_session") === "authenticated";

      if (querySuperAdmin || sesionSuperAdmin) {
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
          const waitMins = Number(data.waitMinutes) || 10;
          setSegundosBloqueo(waitMins * 60);
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
        className={`relative flex min-h-screen flex-col justify-between px-4 py-6 text-white ${brand.bgBase}`}
      >
        {/* Fondo ambiental con la estética y video/poster del negocio */}
        {posterFondo && (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <img
              src={posterFondo}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover blur-xl opacity-35"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-b ${theme.videoOverlayGradient}`}
            />
          </div>
        )}

        {/* Barra superior */}
        <div className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-between">
          <Link
            href={`/${local.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold backdrop-blur-md transition ${theme.backBtn}`}
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
          className={`relative z-10 mx-auto my-auto w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${brand.panelCardBg}`}
        >
          <div className="text-center">
            <div
              className={`mx-auto mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 p-1 shadow-xl ${theme.logoBox}`}
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
            <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-white">
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
                        ? `${brand.accentBorder} bg-black/40 text-white`
                        : "border-white/15 bg-black/25 text-white/40"
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
              className={`mt-3 w-52 rounded-xl border border-white/20 bg-black/35 px-3 py-1.5 text-center text-xs text-white placeholder:text-white/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${brand.accentRing}`}
            />

            {segundosBloqueo > 0 ? (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2 text-center text-xs font-bold text-amber-200">
                <Clock className="h-4 w-4 animate-spin text-amber-400" />
                <span>
                  Bloqueo por seguridad: reintenta en {Math.floor(segundosBloqueo / 60)}:{(segundosBloqueo % 60).toString().padStart(2, "0")}
                </span>
              </div>
            ) : errorPin ? (
              <p className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3.5 py-2 text-center text-xs font-bold text-rose-200">
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
                className={`flex h-13 items-center justify-center rounded-2xl border py-3 text-xl font-extrabold shadow-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${brand.pinBtn}`}
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
              className="flex items-center justify-center rounded-2xl border border-white/15 bg-black/30 py-3 text-xs font-bold text-white/75 transition hover:bg-black/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>

            <button
              type="button"
              disabled={validandoPin || segundosBloqueo > 0}
              onClick={() => handleDigitoPin("0")}
              className={`flex items-center justify-center rounded-2xl border py-3 text-xl font-extrabold shadow-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${brand.pinBtn}`}
            >
              0
            </button>

            <button
              type="button"
              disabled={validandoPin || pin.length === 0 || segundosBloqueo > 0}
              onClick={handleBorrarDigito}
              aria-label="Borrar último dígito"
              className="flex items-center justify-center rounded-2xl border border-white/15 bg-black/30 py-3 text-white/80 transition hover:bg-black/50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            disabled={pin.length !== 4 || validandoPin || segundosBloqueo > 0}
            onClick={() => void validarPin(pin)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${brand.accentBg}`}
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
          <div className="mt-4 border-t border-white/15 pt-3.5 text-center">
            <a
              href={urlRecuperarPinWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25 hover:text-emerald-200 active:scale-95"
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
      className={`relative min-h-screen pb-24 print:min-h-0 print:bg-white print:pb-0 ${brand.bgBase}`}
    >
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
              className="absolute inset-0 h-full w-full object-contain blur-[3px] opacity-45"
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
          <div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-300">
              <Crown className="h-4 w-4 shrink-0" />
              Modo SuperAdmin · Gestionando Carta de {local.nombre}
            </span>
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950 shadow-xs transition hover:bg-amber-300"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Volver a SuperAdmin</span>
            </Link>
          </div>
        </div>
      )}

      {/* Cabecera Fija Mobile-First con la paleta del local */}
      <header
        className={`no-print sticky top-0 z-30 border-b backdrop-blur-xl shadow-md ${brand.headerBg}`}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 p-0.5 shadow-sm ${theme.logoBox}`}
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
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/45 bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                    <Crown className="h-2.5 w-2.5" />
                    VIP Llave en Mano
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/45 bg-sky-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-sky-200">
                    Autogestionado
                  </span>
                )}
              </div>
              <h1 className="truncate text-base font-extrabold text-white sm:text-lg">
                {local.nombre}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/${local.slug}`}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-xs transition ${brand.accentBg}`}
              title="Ver carta pública"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Carta</span>
            </Link>

            <button
              type="button"
              onClick={handleCerrarSesion}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 hover:border-rose-500 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-xl space-y-6 px-4 pt-5 print:max-w-none print:space-y-0 print:p-0">
        {/* PREVISUALIZACIÓN DE IDENTIDAD VISUAL (SOLO LECTURA PARA EL DUEÑO) */}
        <section
          className={`no-print overflow-hidden rounded-3xl border shadow-xl ${brand.panelCardBg}`}
        >
          <div className="relative h-28 w-full overflow-hidden bg-black/50 sm:h-32">
            <img
              src={bannerOficial}
              alt={`Portada de ${local.nombre}`}
              className="h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 bg-slate-900 p-1 shadow-lg ${theme.logoBox}`}
                >
                  <img
                    src={logoOficial}
                    alt={local.nombre}
                    className="h-full w-full rounded-xl object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2.5 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur-xs">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    Identidad Visual Oficial
                  </span>
                  <p className="mt-0.5 truncate text-sm font-black text-white">
                    {local.nombre}
                  </p>
                </div>
              </div>
              {esSuperAdmin && (
                <Link
                  href="/superadmin"
                  className="shrink-0 rounded-xl border border-amber-400/50 bg-amber-400/95 px-2.5 py-1.5 text-[10px] font-black text-slate-950 shadow transition hover:bg-amber-300"
                >
                  Cambiar Logo/Banner
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-[11px] text-white/80">
            <span>
              🎨 El Logo y la Foto de Portada son administrados por{" "}
              <strong>PideTirúa</strong> para garantizar máxima calidad visual.
            </span>
          </div>
        </section>

        {/* NAVEGACIÓN DESTACADA POR PESTAÑAS DEL PANEL ADMIN */}
        <div className="no-print -mt-1 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/15 bg-black/40 p-1.5 backdrop-blur-md scrollbar-none">
          <button
            type="button"
            onClick={() => setPestañaActiva("todas")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 ${
              pestanaActiva === "todas"
                ? `${brand.accentBg} shadow-sm`
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👁️ Ver Todo</span>
          </button>

          <button
            type="button"
            onClick={() => setPestañaActiva("reportes")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 ${
              pestanaActiva === "reportes"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>📊 Ventas</span>
          </button>

          <button
            type="button"
            onClick={() => setPestañaActiva("cocina")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 ${
              pestanaActiva === "cocina"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👨‍🍳 Cocina</span>
          </button>

          <button
            type="button"
            onClick={() => setPestañaActiva("carta")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 ${
              pestanaActiva === "carta"
                ? `${brand.accentBg} shadow-sm`
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🍽️ Carta</span>
          </button>
        </div>

        {/* 1. CONTROL MAESTRO: Switch grande para estado Abierto / Cerrado */}
        {(pestanaActiva === "carta" || pestanaActiva === "todas") && (
          <section
            className={`no-print rounded-3xl border p-5 shadow-xl ${brand.panelCardBg}`}
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
              Toca el interruptor para abrir o cerrar la recepción de pedidos en
              tu carta digital al instante:
            </p>

            <button
              type="button"
              disabled={guardandoId === "local-abierto"}
              onClick={handleToggleAbierto}
              className={`mt-4 flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left shadow-lg transition-all active:scale-[0.99] ${
                local.abierto
                  ? "border-emerald-400 bg-emerald-600 text-white shadow-emerald-900/30 hover:bg-emerald-500"
                  : "border-rose-400 bg-rose-600 text-white shadow-rose-900/30 hover:bg-rose-500"
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

            {/* Resumen rápido de platos y botón rápido para Cartel QR */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-2.5">
                <span className="block text-lg font-black text-emerald-300">
                  {productosDisponibles}
                </span>
                <span className="text-[11px] font-bold text-emerald-100">
                  Platos Disponibles
                </span>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5">
                <span className="block text-lg font-black text-white">
                  {totalProductos - productosDisponibles}
                </span>
                <span className={`text-[11px] font-bold ${brand.subtitleText}`}>
                  Platos Agotados
                </span>
              </div>
            </div>

            {/* Botón destacado rápido para abrir el Cartel QR para Mesas */}
            <button
              type="button"
              onClick={() => setMostrarCartelQr((prev) => !prev)}
              className={`mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold shadow-md transition active:scale-[0.99] sm:text-sm ${brand.accentBg}`}
            >
              <QrCode className="h-4 w-4 shrink-0" />
              <span>📱 Mi Cartel QR para Mesas</span>
            </button>
          </section>
        )}

        {/* 1.25 REPORTE DE VENTAS Y MÉTRICAS PARA EL DUEÑO */}
        {(pestanaActiva === "reportes" || pestanaActiva === "todas") && (
          <VentasReportes
            localSlug={local.slug}
            localNombre={local.nombre}
            accentBg={brand.accentBg}
            accentText={brand.accentText}
            panelCardBg={brand.panelCardBg}
            subtitleText={brand.subtitleText}
            onNotify={mostrarToast}
          />
        )}

        {/* 1.5 MONITOR DE COCINA EN TIEMPO REAL CON ALERTA SONORA (KDS) */}
        <div
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

        {/* SECCIONES DE GESTIÓN DE CARTA Y OPERACIÓN */}
        {(pestanaActiva === "carta" || pestanaActiva === "todas") && (
          <>
            {/* 2. GENERADOR DE CARTEL QR LISTO PARA IMPRIMIR */}
            <section
          className={`rounded-3xl border p-5 shadow-xl print:border-none print:bg-transparent print:p-0 print:shadow-none ${brand.panelCardBg}`}
        >
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
              >
                <QrCode className="h-4 w-4" />
                Código QR de Carta Digital
              </span>
              <h2 className="mt-0.5 text-base font-extrabold text-white sm:text-lg">
                📱 Mi Cartel QR para Mesas
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setMostrarCartelQr((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-extrabold shadow-md transition active:scale-95 ${
                mostrarCartelQr
                  ? "border border-white/25 bg-white/10 text-white hover:bg-white/20"
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
                  <span>📱 Mi Cartel QR para Mesas</span>
                </>
              )}
            </button>
          </div>

          {!mostrarCartelQr && (
            <p className={`no-print mt-2 text-xs ${brand.subtitleText}`}>
              Genera e imprime el cartel con código QR oficial de{" "}
              <strong>{local.nombre}</strong> para poner en tus mesas o mostrador.
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
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-extrabold shadow-lg transition active:scale-95 sm:text-sm ${brand.accentBg}`}
              >
                <Printer className="h-4 w-4 shrink-0" />
                <span>🖨️ Imprimir Cartel</span>
              </button>

              <button
                type="button"
                disabled={descargandoQr}
                onClick={() => void handleDescargarQrPng()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3.5 text-xs font-extrabold text-white shadow-md transition hover:bg-white/20 active:scale-95 disabled:opacity-50 sm:text-sm"
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
              className="w-full max-w-md overflow-hidden rounded-3xl border-4 border-slate-900 bg-white p-6 text-center text-slate-900 shadow-2xl sm:p-8"
            >
              {/* Cinta / Título Superior */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
                <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                <span>¡Pide directo desde tu celular!</span>
              </div>

              {/* Logo, Nombre del Local Grande y su Rubro */}
              <div className="mt-4 flex flex-col items-center">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900 p-1.5 shadow-md">
                  <img
                    src={logoOficial}
                    alt={local.nombre}
                    className="h-full w-full rounded-xl object-contain"
                  />
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {local.nombre}
                </h3>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  {local.rubro}
                </span>
              </div>

              {/* Código QR en Alta Resolución */}
              <div className="my-5 inline-flex flex-col items-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 shadow-inner">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <img
                    src={qrImageUrl}
                    alt={`Código QR de ${local.nombre}`}
                    className="h-56 w-56 object-contain sm:h-64 sm:w-64"
                  />
                </div>
                <span className="mt-2.5 font-mono text-[11px] font-bold text-slate-600">
                  {urlPublicaLocal}
                </span>
              </div>

              {/* Instrucciones al pie del QR en 3 pasos con iconos */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  ¿Cómo hacer tu pedido en 3 pasos?
                </p>
                <ol className="space-y-2.5 text-xs font-bold text-slate-800 sm:text-sm">
                  <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-2xs">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Camera className="h-4 w-4" />
                    </span>
                    <span>
                      <strong>1.</strong> Abre la cámara de tu celular.
                    </span>
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-2xs">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <QrCode className="h-4 w-4" />
                    </span>
                    <span>
                      <strong>2.</strong> Escanea este código QR.
                    </span>
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-2xs">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span>
                      <strong>3.</strong> Revisa la carta y envía tu pedido a
                      WhatsApp.
                    </span>
                  </li>
                </ol>
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                PideTirúa · Carta Digital &amp; Pedidos Directos
              </p>
            </div>
          </div>
        </section>

        {/* 2.5 AJUSTES BÁSICOS Y SEGURIDAD DEL LOCAL (WhatsApp, Horario, Dirección y PIN) */}
        <section
          className={`no-print rounded-3xl border p-5 shadow-xl ${brand.panelCardBg}`}
        >
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
            >
              <Settings className="h-4 w-4" />
              Configuración Operativa
            </span>
            <h2 className="mt-0.5 text-base font-extrabold text-white sm:text-lg">
              ⚙️ Ajustes Básicos y PIN de Seguridad
            </h2>
          </div>

          <p className={`mt-1 text-xs ${brand.subtitleText}`}>
            Actualiza tu número de recepción de pedidos por WhatsApp, horario de
            atención, dirección o tu clave PIN de 4 dígitos:
          </p>

          <form
            onSubmit={handleGuardarAjustesBasicos}
            className="mt-4 space-y-3 border-t border-white/15 pt-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/90">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  Teléfono WhatsApp (+569...)
                </label>
                <input
                  type="text"
                  value={telefonoWhatsapp}
                  onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                  placeholder="Ej: 56987654321"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/90">
                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                  Horario de atención
                </label>
                <input
                  type="text"
                  value={horarioAtencion}
                  onChange={(e) => setHorarioAtencion(e.target.value)}
                  placeholder="Ej: 12:30 a 22:30 hrs"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/90">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  Dirección del local
                </label>
                <input
                  type="text"
                  value={direccionLocal}
                  onChange={(e) => setDireccionLocal(e.target.value)}
                  placeholder="Ej: Av. Costanera 240, Tirúa"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/90">
                  <KeyRound className="h-3.5 w-3.5 text-rose-400" />
                  PIN de Seguridad (4 dígitos)
                </label>
                <input
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
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 font-mono text-xs font-extrabold tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoAjustes}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-extrabold shadow-lg transition active:scale-[0.99] disabled:opacity-50 sm:text-sm ${brand.accentBg}`}
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

        {/* 3. DATOS PARA TRANSFERENCIA BANCARIA */}
        <section
          className={`no-print rounded-3xl border p-5 shadow-xl ${brand.panelCardBg}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
              >
                <CreditCard className="h-4 w-4" />
                Pagos del Cliente en Checkout
              </span>
              <h2 className="mt-0.5 text-base font-extrabold text-white sm:text-lg">
                💳 Datos para Transferencia Bancaria
              </h2>
            </div>
          </div>

          <p className={`mt-1 text-xs ${brand.subtitleText}`}>
            Estos datos se mostrarán automáticamente cuando un cliente elija
            pagar con <strong>Transferencia Bancaria</strong> en el carrito:
          </p>

          <form
            onSubmit={handleGuardarDatosBancarios}
            className="mt-4 space-y-3 border-t border-white/15 pt-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  Banco
                </label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Ej: BancoEstado, Banco de Chile..."
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  Tipo de cuenta
                </label>
                <input
                  type="text"
                  value={tipoCuenta}
                  onChange={(e) => setTipoCuenta(e.target.value)}
                  placeholder="Ej: CuentaRUT / Cuenta Vista / Corriente"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  N° de cuenta
                </label>
                <input
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="Ej: 18234567"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  RUT del titular
                </label>
                <input
                  type="text"
                  value={rutTitular}
                  onChange={(e) => setRutTitular(e.target.value)}
                  placeholder="Ej: 18.234.567-8"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  value={nombreTitular}
                  onChange={(e) => setNombreTitular(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  Correo de confirmación
                </label>
                <input
                  type="email"
                  value={emailTransferencia}
                  onChange={(e) => setEmailTransferencia(e.target.value)}
                  placeholder="Ej: contacto@local.cl"
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardandoBancos}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-extrabold shadow-lg transition active:scale-[0.99] disabled:opacity-50 sm:text-sm ${brand.accentBg}`}
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

        {/* 3.5 GESTIÓN DE CATEGORÍAS DE LA CARTA */}
        <section
          className={`no-print rounded-3xl border p-5 shadow-xl ${brand.panelCardBg}`}
        >
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
            >
              <Layers className="h-4 w-4" />
              Estructura del Menú
            </span>
            <h2 className="mt-0.5 text-base font-extrabold text-white sm:text-lg">
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
              className="flex-1 rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creandoCategoria || !nombreCategoriaCrear.trim()}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-md transition active:scale-95 disabled:opacity-50 ${brand.accentBg}`}
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white"
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
                      className="rounded-full p-0.5 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
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
          className={`no-print rounded-3xl border p-5 shadow-xl ${brand.panelCardBg}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${brand.accentText}`}
              >
                <Sparkles className="h-4 w-4" />
                Agregar Platos a tu Carta
              </span>
              <h2 className="mt-0.5 text-base font-extrabold text-white sm:text-lg">
                Subir Nuevo Plato con Foto
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setMostrarFormNuevo((prev) => !prev);
                setErrorNuevoPlato(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-extrabold shadow-md transition active:scale-95 ${
                mostrarFormNuevo
                  ? "border border-white/25 bg-white/10 text-white hover:bg-white/20"
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
              className="mt-4 space-y-4 border-t border-white/15 pt-4"
            >
              {/* Cargador de Foto de la Comida */}
              <div>
                <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  1. Foto del plato (Cámara o Galería)
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/30 bg-black/40">
                    {nuevaFotoUrl ? (
                      <img
                        src={nuevaFotoUrl}
                        alt="Vista previa del plato"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center p-2 text-white/60">
                        <Camera className="h-7 w-7 mb-1" />
                        <span className="text-[10px] font-bold">Sin foto</span>
                      </div>
                    )}
                    {subiendoFotoNueva && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
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
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-md transition active:scale-95 sm:w-auto ${brand.accentBg}`}
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
                      className="w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Categoría */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                    2. Categoría del menú *
                  </label>
                  <select
                    value={nuevoCategoriaId}
                    onChange={(e) => setNuevoCategoriaId(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
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
                    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                      Nombre de la nueva categoría *
                    </label>
                    <input
                      type="text"
                      value={nuevaCategoriaNombre}
                      onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                      placeholder="Ej: Postres Caseros, Promociones..."
                      className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                      Etiqueta destacada (opcional)
                    </label>
                    <input
                      type="text"
                      value={nuevaEtiqueta}
                      onChange={(e) => setNuevaEtiqueta(e.target.value)}
                      placeholder="Ej: Nuevo, Más pedido, Especialidad"
                      className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Nombre y Precio */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8">
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                    3. Nombre del plato *
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Churrasco Italiano Gigante + Papas"
                    className="w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                    4. Precio (CLP) *
                  </label>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={nuevoPrecio}
                      onChange={(e) => setNuevoPrecio(e.target.value)}
                      placeholder="Ej: 7500"
                      className="w-full rounded-xl border border-white/20 bg-white py-2.5 pl-7 pr-3 text-xs font-extrabold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción del plato */}
              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-white/90">
                  5. Descripción de los ingredientes
                </label>
                <textarea
                  rows={2}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Describe los ingredientes o acompañamientos del plato..."
                  className="w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* 6. Interruptor de Oferta del Día */}
              <div className="rounded-2xl border border-white/20 bg-black/35 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-400 fill-rose-400" />
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-white">
                        ¿Activar como Oferta del Día?
                      </span>
                      <span className="block text-[11px] font-medium text-white/70">
                        Se promocionará en el carrusel de ofertas de la portada comunal
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNuevoEsOferta((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      nuevoEsOferta ? "bg-rose-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        nuevoEsOferta ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {nuevoEsOferta && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-rose-300">
                        Precio Oferta (CLP) *
                      </label>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={nuevoPrecioOferta}
                          onChange={(e) => setNuevoPrecioOferta(e.target.value)}
                          placeholder="Ej: 6000"
                          className="w-full rounded-xl border border-rose-300/60 bg-white py-2 pl-7 pr-3 text-xs font-black text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-rose-300">
                        Etiqueta de Promo (ej: 20% OFF, 2x1)
                      </label>
                      <input
                        type="text"
                        value={nuevoTextoPromo}
                        onChange={(e) => setNuevoTextoPromo(e.target.value)}
                        placeholder="Ej: 20% OFF, 2x1, Promo del Día"
                        className="w-full rounded-xl border border-rose-300/60 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {errorNuevoPlato && (
                <p className="rounded-xl border border-rose-400/50 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200">
                  {errorNuevoPlato}
                </p>
              )}

              <button
                type="submit"
                disabled={creandoPlato || subiendoFotoNueva}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold shadow-lg transition active:scale-[0.99] disabled:opacity-50 ${brand.accentBg}`}
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
              <div className="mb-3.5 flex items-center justify-between border-b border-white/15 pb-2.5">
                <h2
                  className={`text-base font-extrabold sm:text-lg ${brand.accentText}`}
                >
                  {categoria.nombre}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${theme.categoryCount}`}
                >
                  {categoria.productos.length}{" "}
                  {categoria.productos.length === 1 ? "plato" : "platos"}
                </span>
              </div>

              <div className="space-y-3.5">
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
                          ? "border-slate-200 bg-white text-slate-900 shadow-md"
                          : "border-slate-300 bg-slate-100 text-slate-600 opacity-85"
                      }`}
                    >
                      {/* Fila superior: Miniatura con botón para cambiar foto + Switch [Disponible / Agotado] */}
                      <div className="mb-3 flex items-center justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <label
                            className="group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs"
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
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                                  disponible
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {disponible ? "🟢 Disponible" : "⚪ Agotado"}
                              </span>

                              <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100">
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

                            <p className="mt-1 text-xs font-extrabold text-slate-700">
                              {formatCLP(producto.precio)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {/* Switch directo: [Disponible / Agotado] */}
                          <button
                            type="button"
                            disabled={guardandoId === `disp-${producto.id}`}
                            onClick={() => handleToggleDisponible(producto)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition active:scale-95 ${
                              disponible
                                ? "border-emerald-300 bg-emerald-600 text-white shadow-xs hover:bg-emerald-500"
                                : "border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            <div
                              className={`relative flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                                disponible
                                  ? "bg-emerald-900/40"
                                  : "bg-slate-400"
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
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:scale-95"
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
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="flex items-end gap-2 sm:col-span-5">
                          <div className="flex-1">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Precio (CLP)
                            </label>
                            <div className="relative">
                              <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-7 pr-2.5 text-xs font-extrabold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
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
                            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl px-3 text-xs font-extrabold transition ${
                              hayCambiosSinGuardar
                                ? `${brand.accentBg} shadow-xs active:scale-95`
                                : "border border-slate-200 bg-slate-100 text-slate-400"
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
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Descripción
                          </label>
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-slate-900 focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                          />
                        </div>

                        {/* Control de Oferta del Día */}
                        <div className="mt-1 rounded-xl border border-orange-200/90 bg-orange-50/70 p-2.5 sm:col-span-12">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-orange-950">
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
                                className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                              />
                              <Flame className="h-3.5 w-3.5 text-orange-600" />
                              <span>¿Activar como Oferta del Día?</span>
                            </label>

                            {editState.es_oferta && (
                              <span className="rounded-full bg-orange-200/80 px-2 py-0.5 text-[10px] font-extrabold text-orange-800">
                                Visible en portada de Tirúa
                              </span>
                            )}
                          </div>

                          {editState.es_oferta && (
                            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-orange-950">
                                  Precio Oferta (CLP)
                                </label>
                                <div className="relative">
                                  <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-orange-500" />
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
                                    className="w-full rounded-xl border border-orange-300 bg-white py-1.5 pl-7 pr-2.5 text-xs font-black text-orange-950 focus:border-orange-600 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-orange-950">
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
                                  className="w-full rounded-xl border border-orange-300 bg-white px-3 py-1.5 text-xs font-bold text-orange-950 placeholder:text-orange-400 focus:border-orange-600 focus:outline-none"
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
          </>
        )}
      </main>
    </div>
  );
}
