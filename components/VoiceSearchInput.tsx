"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Search,
  X,
  Loader2,
  Sparkles,
  Store,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Local, Producto } from "@/types/local";
import { formatCLP } from "@/lib/formatters";
import {
  getFreshAudioStream,
  stopAudioStream,
  getOrCreateLiveAudioStream,
  isStreamLive,
  createAudioLevelAnalyser,
  getSupportedAudioMimeType,
  audioBlobToBase64,
  canUseWebSpeechAPI,
  isOperaBrowser,
} from "@/lib/voiceAudio";

interface VoiceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  locales?: Local[];
}

/**
 * Clasificador instantáneo del lado del cliente para redirigir a un local en 0ms
 */
function clasificarLocalCliente(
  texto: string,
  locales: Local[]
): { slug: string; nombre: string } | null {
  const norm = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 1. Coincidencia directa por nombre o slug
  for (const loc of locales) {
    const normNombre = loc.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const slugPalabras = loc.slug.replace(/-/g, " ");

    if (norm.includes(normNombre) || norm.includes(slugPalabras)) {
      return { slug: loc.slug, nombre: loc.nombre };
    }
  }

  // 2. Coincidencia por especialidad exclusiva de cada local en Tirúa
  if (
    norm.includes("sushi") ||
    norm.includes("bendito") ||
    norm.includes("roll") ||
    norm.includes("handroll") ||
    norm.includes("tempura") ||
    norm.includes("furay") ||
    norm.includes("smash") ||
    norm.includes("burger") ||
    norm.includes("hamburguesa")
  ) {
    return { slug: "sushi-burger", nombre: "Sushi Burger Tirúa" };
  }

  if (
    norm.includes("tranquera") ||
    norm.includes("pollo") ||
    norm.includes("chorrillana") ||
    norm.includes("chorillana") ||
    norm.includes("churrasco") ||
    norm.includes("completo") ||
    norm.includes("tocomple") ||
    norm.includes("italiano") ||
    norm.includes("chacarero") ||
    norm.includes("spiedo")
  ) {
    return { slug: "las-tranqueras", nombre: "Las Tranqueras Tirúa" };
  }

  if (
    norm.includes("rio mar") ||
    norm.includes("riomar") ||
    norm.includes("cafeteria") ||
    norm.includes("cafe") ||
    norm.includes("kuchen") ||
    norm.includes("murtilla") ||
    norm.includes("cazuela") ||
    norm.includes("pastel de choclo") ||
    norm.includes("once")
  ) {
    return { slug: "rio-mar", nombre: "Cafetería y Restaurante Río Mar" };
  }

  if (
    norm.includes("pacifico") ||
    norm.includes("empanada") ||
    norm.includes("paila marina") ||
    norm.includes("paila") ||
    norm.includes("marisco") ||
    norm.includes("reineta") ||
    norm.includes("chupe") ||
    norm.includes("jaiba") ||
    norm.includes("congrio") ||
    norm.includes("quidico")
  ) {
    return { slug: "gran-pacifico", nombre: "Restaurant Gran Pacífico" };
  }

  return null;
}

export default function VoiceSearchInput({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Buscar local, sushi, empanadas, abierto ahora...",
  className = "",
  locales = [],
}: VoiceSearchInputProps) {
  const router = useRouter();

  const [modalVozAbierto, setModalVozAbierto] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [procesandoIa, setProcesandoIa] = useState(false);
  const [redirigiendoA, setRedirigiendoA] = useState<string | null>(null);
  const [transcripcionVoz, setTranscripcionVoz] = useState("");
  const [errorVoz, setErrorVoz] = useState<string | null>(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [montado, setMontado] = useState(false);

  // Estados para ecualizador en vivo y cuenta regresiva visible
  const [volumenVoz, setVolumenVoz] = useState(0);
  const [matchPendiente, setMatchPendiente] = useState<{
    slug: string;
    nombre: string;
    texto: string;
  } | null>(null);
  const [tiempoRestanteMs, setTiempoRestanteMs] = useState(2500);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<{ stop: () => void; getMaxVolume: () => number } | null>(null);
  const transcripcionCapturadaRef = useRef<string>("");
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cuentaRegresivaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  // Cerrar dropdown al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Limpiar recursos de audio al desmontar
  useEffect(() => {
    return () => {
      liberarMicrofonoYRecursos();
    };
  }, []);

  /**
   * Detiene la grabación activa y el análisis sin destruir el MediaStream subyacente
   * para permitir grabaciones sucesivas instantáneas sin pedir permisos de nuevo.
   */
  const detenerGrabacionActiva = () => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.stop();
      } catch {
        // Ignorar
      }
      analyserRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignorar
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.ondataavailable = null;
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignorar
      }
      mediaRecorderRef.current = null;
    }
    setEscuchando(false);
    setVolumenVoz(0);
  };

  /**
   * Libera completamente el micrófono y cierra todas las pistas.
   * Se invoca únicamente al cerrar el modal o al navegar.
   */
  const liberarMicrofonoYRecursos = () => {
    detenerGrabacionActiva();
    if (cuentaRegresivaIntervalRef.current) {
      clearInterval(cuentaRegresivaIntervalRef.current);
      cuentaRegresivaIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      stopAudioStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }
  };

  const cerrarModal = () => {
    liberarMicrofonoYRecursos();
    setModalVozAbierto(false);
    setMatchPendiente(null);
    setRedirigiendoA(null);
    setErrorVoz(null);
    setProcesandoIa(false);
  };

  /**
   * Navegación inmediata manual al presionar "Ir ahora"
   */
  const ejecutarNavegacionInmediata = (slug: string) => {
    liberarMicrofonoYRecursos();
    setModalVozAbierto(false);
    setDropdownAbierto(false);
    setMatchPendiente(null);
    router.push(`/${slug}`);
  };

  /**
   * Cancelar la redirección en curso si el usuario prefiere quedarse o corregir
   */
  const cancelarRedireccion = () => {
    if (cuentaRegresivaIntervalRef.current) {
      clearInterval(cuentaRegresivaIntervalRef.current);
      cuentaRegresivaIntervalRef.current = null;
    }
    setMatchPendiente(null);
    setRedirigiendoA(null);
  };

  /**
   * Procesa la frase y activa la cuenta regresiva visible de 2.5 segundos con confirmación clara
   */
  const procesarResultadoYRedirigir = (
    texto: string,
    localSlugForzado?: string | null,
    nombreLocalForzado?: string | null
  ) => {
    detenerGrabacionActiva();
    const textoLimpio = texto.trim();
    if (!textoLimpio) return;

    setTranscripcionVoz(textoLimpio);

    // Verificar si corresponde a un local específico
    const match =
      localSlugForzado
        ? { slug: localSlugForzado, nombre: nombreLocalForzado || localSlugForzado }
        : clasificarLocalCliente(textoLimpio, locales);

    if (match) {
      // Activar cuenta regresiva visible de 2.5 segundos para que el usuario pueda leer
      setMatchPendiente({
        slug: match.slug,
        nombre: match.nombre,
        texto: textoLimpio,
      });
      setTiempoRestanteMs(2500);
      setErrorVoz(null);

      if (cuentaRegresivaIntervalRef.current) {
        clearInterval(cuentaRegresivaIntervalRef.current);
      }

      const inicio = Date.now();
      const duracionTotal = 2500;

      cuentaRegresivaIntervalRef.current = setInterval(() => {
        const transcurrido = Date.now() - inicio;
        const restante = Math.max(0, duracionTotal - transcurrido);
        setTiempoRestanteMs(restante);

        if (restante <= 0) {
          if (cuentaRegresivaIntervalRef.current) {
            clearInterval(cuentaRegresivaIntervalRef.current);
            cuentaRegresivaIntervalRef.current = null;
          }
          liberarMicrofonoYRecursos();
          setModalVozAbierto(false);
          setDropdownAbierto(false);
          setMatchPendiente(null);
          router.push(`/${match.slug}`);
        }
      }, 100);

      return;
    }

    // Si es búsqueda comunal general (ej: "abiertos", "comida rápida")
    setRedirigiendoA("Filtrando en Directorio...");
    setTimeout(() => {
      liberarMicrofonoYRecursos();
      onChange(textoLimpio);
      setModalVozAbierto(false);
      setDropdownAbierto(false);
      onSubmit?.();
    }, 1500);
  };

  /**
   * Procesa el archivo de audio capturado con Gemini 1.5 Flash (Opera GX, Safari, Chrome, etc.)
   */
  const procesarAudioConGemini = async (audioBlob: Blob, mimeType: string) => {
    // Si ya capturamos texto por Web Speech API (en Chrome), no es necesario consultar Gemini
    if (transcripcionCapturadaRef.current.trim()) {
      procesarResultadoYRedirigir(transcripcionCapturadaRef.current);
      return;
    }

    setProcesandoIa(true);
    setErrorVoz(null);

    try {
      const base64 = await audioBlobToBase64(audioBlob);
      if (!base64 || audioBlob.size < 400) {
        setErrorVoz("No se detectó audio claro. Intenta hablar más cerca del micrófono.");
        setProcesandoIa(false);
        return;
      }

      const res = await fetch("/api/ai/voice-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
        }),
      });

      const data = await res.json();

      if (data.ok && data.texto_transcrito) {
        setTranscripcionVoz(data.texto_transcrito);
        procesarResultadoYRedirigir(
          data.texto_transcrito,
          data.local_slug,
          data.nombre_local
        );
      } else {
        setErrorVoz(
          data.error ||
            "No pudimos reconocer el audio. Prueba hablando de nuevo o toca un acceso directo abajo."
        );
      }
    } catch {
      setErrorVoz("Error de conexión con el servicio de voz.");
    } finally {
      setProcesandoIa(false);
    }
  };

  /**
   * Abre el modal y arranca la grabación inmediatamente
   */
  const abrirModalVoz = () => {
    setModalVozAbierto(true);
    setTranscripcionVoz("");
    transcripcionCapturadaRef.current = "";
    setErrorVoz(null);
    setRedirigiendoA(null);
    setMatchPendiente(null);
    iniciarGrabacionDual();
  };

  const iniciarGrabacionDual = async () => {
    detenerGrabacionActiva();
    if (cuentaRegresivaIntervalRef.current) {
      clearInterval(cuentaRegresivaIntervalRef.current);
      cuentaRegresivaIntervalRef.current = null;
    }
    setErrorVoz(null);
    setRedirigiendoA(null);
    setMatchPendiente(null);
    setProcesandoIa(false);
    setVolumenVoz(0);
    transcripcionCapturadaRef.current = "";
    audioChunksRef.current = [];

    // Reutilizar el stream existente si sigue activo, o pedir uno nuevo si no lo está
    let stream: MediaStream;
    try {
      stream = await getOrCreateLiveAudioStream(mediaStreamRef.current);
      mediaStreamRef.current = stream;
    } catch (err: any) {
      console.warn("Error accediendo al micrófono:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorVoz(
          "Permiso de micrófono no otorgado. En Opera GX o Chrome, haz clic en el icono del candado 🔒 en la barra de direcciones y selecciona 'Permitir'."
        );
      } else {
        setErrorVoz("No se pudo iniciar el micrófono en tu dispositivo.");
      }
      return;
    }

    // Iniciar analizador de volumen en vivo sin interferir en la grabación
    analyserRef.current = createAudioLevelAnalyser(stream, (vol) => {
      setVolumenVoz(vol);
    });

    const mimeType = getSupportedAudioMimeType();

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (analyserRef.current) {
          analyserRef.current.stop();
          analyserRef.current = null;
        }
        // NOTA: NO detenemos stream aquí para permitir múltiples intentos en el mismo modal
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size >= 400 && recorder === mediaRecorderRef.current) {
          procesarAudioConGemini(audioBlob, mimeType);
        } else if (recorder === mediaRecorderRef.current && !transcripcionCapturadaRef.current) {
          setErrorVoz("No se detectó audio claro. Intenta hablar más cerca del micrófono.");
          setEscuchando(false);
          setProcesandoIa(false);
        }
      };

      recorder.start(150);
      setEscuchando(true);

      // Auto-detener después de 4.8 segundos si el usuario no tocó antes el botón de detener
      autoStopTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setEscuchando(false);
        }
      }, 4800);
    } catch (err) {
      console.error("Error al instanciar MediaRecorder:", err);
      setErrorVoz("No se pudo iniciar la grabación en tu navegador.");
      return;
    }

    // Web Speech API en navegadores nativos compatibles (Chrome, Safari, Edge)
    if (canUseWebSpeechAPI()) {
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = "es-CL";
          recognition.interimResults = true;
          recognition.continuous = false;

          recognition.onresult = (event: any) => {
            let final = "";
            let interim = "";
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const capturado = (final || interim).trim();
            if (capturado) {
              setTranscripcionVoz(capturado);
              transcripcionCapturadaRef.current = capturado;

              const match = clasificarLocalCliente(capturado, locales);
              if (match) {
                detenerGrabacionActiva();
                procesarResultadoYRedirigir(capturado, match.slug, match.nombre);
              }
            }
          };

          recognition.onerror = () => {
            try {
              recognition.abort();
            } catch {
              // Ignorar
            }
            recognitionRef.current = null;
          };

          recognition.onend = () => {
            recognitionRef.current = null;
          };

          recognitionRef.current = recognition;
          recognition.start();
        }
      } catch {
        // Ignorar fallos de Web Speech API
      }
    }
  };

  const terminarYProcesarManual = () => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    setEscuchando(false);
  };

  const handleLimpiar = () => {
    onChange("");
    onClear?.();
    setDropdownAbierto(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDropdownAbierto(false);
      onSubmit?.();
    } else if (e.key === "Escape") {
      setDropdownAbierto(false);
    }
  };

  // Cálculo de resultados en vivo para el dropdown interactivo
  const resultadosEnVivo = (() => {
    const q = value.trim().toLowerCase();
    if (!q || locales.length === 0) return { locales: [], platos: [] };

    const localesEncontrados: Local[] = [];
    const platosEncontrados: Array<{
      localSlug: string;
      localNombre: string;
      producto: Producto;
    }> = [];

    const filtrarSoloAbiertos = q.includes("abierto") || q.includes("abiertos");
    const queryLimpia = q
      .replace(/\babiertos\b/g, "")
      .replace(/\babierto\b/g, "")
      .replace(/\bahora\b/g, "")
      .trim();

    for (const loc of locales) {
      if (loc.activo === false) continue;
      if (filtrarSoloAbiertos && !loc.abierto) continue;

      const coincideLocal =
        !queryLimpia ||
        loc.nombre.toLowerCase().includes(queryLimpia) ||
        loc.rubro.toLowerCase().includes(queryLimpia) ||
        loc.ubicacion.toLowerCase().includes(queryLimpia);

      if (coincideLocal && localesEncontrados.length < 3) {
        localesEncontrados.push(loc);
      }

      // Buscar platos coincidentes
      for (const cat of loc.categorias) {
        for (const prod of cat.productos) {
          if (prod.disponible === false) continue;
          const textoPlato = `${prod.nombre} ${prod.descripcion} ${cat.nombre}`.toLowerCase();
          if (queryLimpia && textoPlato.includes(queryLimpia)) {
            if (platosEncontrados.length < 4) {
              platosEncontrados.push({
                localSlug: loc.slug,
                localNombre: loc.nombre,
                producto: prod,
              });
            }
          }
        }
      }
    }

    return { locales: localesEncontrados, platos: platosEncontrados };
  })();

  const tieneResultadosEnVivo =
    value.trim().length > 0 &&
    (resultadosEnVivo.locales.length > 0 || resultadosEnVivo.platos.length > 0);

  return (
    <div ref={contenedorRef} className={`relative flex items-center w-full ${className}`}>
      {/* Icono de Lupa */}
      <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
        <Search className="h-4 w-4" />
      </span>

      {/* Input de Texto */}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setDropdownAbierto(true);
        }}
        onFocus={() => {
          if (value.trim()) setDropdownAbierto(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-20 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs"
      />

      {/* Acciones en la parte derecha del input */}
      <div className="absolute right-2 flex items-center gap-1">
        {/* Botón Limpiar búsqueda */}
        {value && (
          <button
            type="button"
            onClick={handleLimpiar}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition active:scale-95"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Botón Micrófono para Búsqueda por Voz (Abre Modal de Voz) */}
        <button
          type="button"
          onClick={abrirModalVoz}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-2xs"
          title="Buscar con tu voz"
          aria-label="Buscar con tu voz"
        >
          <Mic className="h-4 w-4" />
        </button>
      </div>

      {/* DROPDOWN FLOTANTE DE RESULTADOS Y SUGERENCIAS EN VIVO */}
      {dropdownAbierto && tieneResultadosEnVivo && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900">
          <div className="max-h-80 overflow-y-auto p-2 space-y-2">
            {/* Locales Encontrados */}
            {resultadosEnVivo.locales.length > 0 && (
              <div>
                <span className="block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Restaurantes y Locales
                </span>
                <div className="space-y-1">
                  {resultadosEnVivo.locales.map((loc) => (
                    <Link
                      key={loc.id}
                      href={`/${loc.slug}`}
                      onClick={() => setDropdownAbierto(false)}
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-amber-50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={loc.logo || "/logo-pidetirua.jpg"}
                          alt={loc.nombre}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 group-hover:text-amber-700 truncate">
                            {loc.nombre}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {loc.rubro} · {loc.ubicacion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                            loc.abierto
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {loc.abierto ? "Abierto" : "Cerrado"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Platos Encontrados */}
            {resultadosEnVivo.platos.length > 0 && (
              <div className="border-t border-slate-100 pt-2">
                <span className="block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Platos Disponibles en la Carta
                </span>
                <div className="space-y-1">
                  {resultadosEnVivo.platos.map((item, idx) => (
                    <Link
                      key={`${item.localSlug}-${item.producto.id}-${idx}`}
                      href={`/${item.localSlug}`}
                      onClick={() => setDropdownAbierto(false)}
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-amber-50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.producto.imagen_url || item.producto.imagen ? (
                          <div className="relative h-9 w-9 shrink-0">
                            <img
                              src={item.producto.imagen_url || item.producto.imagen}
                              alt={item.producto.nombre}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                                if (fallback) (fallback as HTMLElement).style.display = "flex";
                              }}
                              className="h-9 w-9 rounded-lg object-cover bg-slate-100"
                            />
                            <div className="img-fallback hidden h-9 w-9 rounded-lg bg-amber-100 items-center justify-center text-amber-700">
                              <UtensilsCrossed className="h-4 w-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <UtensilsCrossed className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700 truncate">
                            {item.producto.nombre}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            en {item.localNombre}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-black text-emerald-700">
                          {formatCLP(
                            item.producto.es_oferta && item.producto.precio_oferta
                              ? item.producto.precio_oferta
                              : item.producto.precio
                          )}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón inferior para ir a todos los resultados en el directorio */}
          <button
            type="button"
            onClick={() => {
              setDropdownAbierto(false);
              onSubmit?.();
            }}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition"
          >
            <span>Ver todos los resultados en el directorio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* MODAL INTERACTIVO DE BÚSQUEDA POR VOZ (MONTADO VÍA PORTAL EN BODY) */}
      {montado &&
        modalVozAbierto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
            onClick={cerrarModal}
          >
            <div
              className="relative w-full max-w-md my-auto overflow-hidden rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl flex flex-col max-h-[92vh] shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera */}
              <div className="p-5 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 flex items-start justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      <Sparkles className="h-3 w-3" />
                      Asistente por Voz con IA
                    </span>
                    <h3 className="mt-0.5 text-base sm:text-lg font-black text-white">
                      Dime qué restaurante o comida buscas
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-full bg-black/20 p-2 text-white/80 hover:bg-black/40 hover:text-white transition active:scale-95"
                  aria-label="Cerrar búsqueda por voz"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido Central con scroll si es pantalla compacta */}
              <div className="p-5 sm:p-6 overflow-y-auto flex flex-col items-center text-center space-y-4">
                {/* 1. VISTA DE LOCAL RECONOCIDO CON CUENTA REGRESIVA VISIBLE (2.5 SEGUNDOS) */}
                {matchPendiente ? (
                  <div className="w-full space-y-4 animate-in zoom-in-95 duration-200">
                    {/* Tarjeta de lo que dijo el usuario */}
                    <div className="w-full rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                        Lo que dijiste:
                      </span>
                      <p className="text-base sm:text-lg font-extrabold text-amber-200 italic">
                        &ldquo;{matchPendiente.texto}&rdquo;
                      </p>
                    </div>

                    {/* Tarjeta del Local Encontrado */}
                    <div className="w-full rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-900/40 border-2 border-emerald-500/50 p-5 text-left shadow-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                          <Store className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Restaurante Encontrado
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-white truncate">
                            {matchPendiente.nombre}
                          </h4>
                          <p className="text-xs text-emerald-300/80 font-medium mt-0.5">
                            Abriendo carta en {(tiempoRestanteMs / 1000).toFixed(1)} segundos...
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progreso de Cuenta Regresiva */}
                      <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all ease-linear duration-100"
                          style={{
                            width: `${Math.max(0, Math.min(100, (tiempoRestanteMs / 2500) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      Puedes esperar o pulsar <strong>&quot;Ir ahora mismo&quot;</strong> si estás listo.
                    </p>
                  </div>
                ) : redirigiendoA ? (
                  <div className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/20 p-5 text-center animate-in zoom-in-95 duration-200 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-base">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>{redirigiendoA}</span>
                    </div>
                    <p className="text-xs text-emerald-200/80">
                      Aplicando búsqueda en el directorio de Tirúa...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Botón Central Micrófono con Animación */}
                    <div className="relative my-2">
                      {escuchando && (
                        <>
                          <span className="animate-ping absolute inset-0 rounded-full bg-rose-500 opacity-40" />
                          <span className="animate-pulse absolute -inset-3 rounded-full bg-amber-500/30" />
                        </>
                      )}

                      <button
                        type="button"
                        onClick={escuchando ? terminarYProcesarManual : iniciarGrabacionDual}
                        disabled={procesandoIa}
                        className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-95 ${
                          procesandoIa
                            ? "bg-amber-600 ring-4 ring-amber-400/50"
                            : escuchando
                            ? "bg-rose-600 ring-4 ring-rose-400"
                            : "bg-gradient-to-tr from-amber-500 to-orange-500 hover:scale-105"
                        }`}
                        aria-label={escuchando ? "Detener grabación" : "Iniciar grabación"}
                      >
                        {procesandoIa ? (
                          <Loader2 className="h-10 w-10 animate-spin" />
                        ) : escuchando ? (
                          <Mic className="h-10 w-10 animate-bounce" />
                        ) : (
                          <Mic className="h-10 w-10" />
                        )}
                      </button>
                    </div>

                    {/* Ecualizador de Voz en Tiempo Real */}
                    {escuchando && (
                      <div className="flex flex-col items-center gap-1.5 my-1 animate-in fade-in duration-150">
                        <div className="flex items-center justify-center gap-1.5 h-7">
                          {[35, 60, 95, 75, 45, 80, 50].map((factor, i) => {
                            const h = Math.max(
                              6,
                              Math.min(26, Math.round((volumenVoz / 100) * factor * 1.3))
                            );
                            return (
                              <span
                                key={i}
                                className={`w-1.5 rounded-full transition-all duration-75 ${
                                  volumenVoz > 10 ? "bg-emerald-400 shadow-sm" : "bg-rose-400"
                                }`}
                                style={{ height: `${h}px` }}
                              />
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-bold text-slate-300">
                          {volumenVoz > 12 ? "🟢 Escuchando tu voz..." : "🔴 Te escuchamos... habla ahora"}
                        </span>
                      </div>
                    )}

                    {/* Mensaje de Estado */}
                    <div>
                      <p className="text-sm font-extrabold text-white">
                        {procesandoIa
                          ? "🤖 Procesando tu voz con IA..."
                          : escuchando
                          ? "Di el restaurante o comida que deseas"
                          : "Toca el micrófono para comenzar a hablar"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Verás lo que dijiste y la carta que abriremos antes de redirigirte.
                      </p>
                    </div>

                    {/* Transcripción en Tiempo Real */}
                    <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 min-h-[4.5rem] flex items-center justify-center text-left">
                      {transcripcionVoz ? (
                        <p className="text-sm sm:text-base font-bold text-amber-300 italic">
                          &ldquo;{transcripcionVoz}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          {escuchando
                            ? "Habla ahora, te escuchamos..."
                            : "Aquí aparecerá lo que digas..."}
                        </p>
                      )}
                    </div>

                    {/* Error si existe */}
                    {errorVoz && (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200 text-left w-full">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                          <span>{errorVoz}</span>
                        </div>
                        <button
                          type="button"
                          onClick={iniciarGrabacionDual}
                          className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-98"
                        >
                          <Mic className="h-3.5 w-3.5" />
                          <span>Hablar de nuevo</span>
                        </button>
                      </div>
                    )}

                    {/* Chips Rápidos de Redirección Inmediata (1 Toque) */}
                    <div className="w-full pt-1">
                      <span className="block text-[11px] font-bold text-slate-400 mb-2 text-left">
                        O toca un acceso directo:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { etiqueta: "🍣 Sushi", query: "sushi", slug: "sushi-burger", nombre: "Sushi Burger Tirúa" },
                          { etiqueta: "🍗 Pollos asados", query: "pollos asados", slug: "las-tranqueras", nombre: "Las Tranqueras Tirúa" },
                          { etiqueta: "🥟 Empanadas", query: "empanadas", slug: "gran-pacifico", nombre: "Restaurant Gran Pacífico" },
                          { etiqueta: "🍔 Hamburguesas", query: "hamburguesas", slug: "sushi-burger", nombre: "Sushi Burger Tirúa" },
                          { etiqueta: "🐟 Pescados y mariscos", query: "pescados", slug: "gran-pacifico", nombre: "Restaurant Gran Pacífico" },
                          { etiqueta: "🟢 Abierto ahora", query: "abierto ahora", slug: null, nombre: null },
                        ].map((chip) => (
                          <button
                            key={chip.etiqueta}
                            type="button"
                            onClick={() =>
                              procesarResultadoYRedirigir(
                                chip.query,
                                chip.slug,
                                chip.nombre
                              )
                            }
                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:border-amber-400 hover:bg-amber-500/20 transition active:scale-95"
                          >
                            {chip.etiqueta}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tip para permisos en Opera GX / Chrome */}
                    <p className="text-[10px] text-slate-400/90 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-left w-full">
                      🔒 <strong>Tip Opera GX:</strong> Si te pide permiso, haz clic en el candado de la barra superior y selecciona <em>&quot;Permitir&quot;</em> en Micrófono para guardarlo permanentemente.
                    </p>
                  </>
                )}
              </div>

              {/* Acciones Inferiores */}
              <div className="border-t border-white/10 bg-slate-950/60 p-4 flex items-center gap-2.5 shrink-0">
                {matchPendiente ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelarRedireccion}
                      className="flex-1 rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => ejecutarNavegacionInmediata(matchPendiente.slug)}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black text-slate-950 shadow-md transition hover:from-emerald-400 hover:to-teal-400 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>Ir ahora mismo</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="flex-1 rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                      Cerrar
                    </button>

                    {escuchando ? (
                      <button
                        type="button"
                        onClick={terminarYProcesarManual}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black text-slate-950 shadow-md transition hover:from-emerald-400 hover:to-teal-400 active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span>Listo, buscar ahora</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!transcripcionVoz.trim() || procesandoIa}
                        onClick={() => procesarResultadoYRedirigir(transcripcionVoz)}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {procesandoIa ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Analizando...</span>
                          </>
                        ) : (
                          <>
                            <span>Buscar</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
