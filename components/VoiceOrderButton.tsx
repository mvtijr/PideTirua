"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Loader2,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { Producto } from "@/types/local";

interface VoiceOrderButtonProps {
  localNombre: string;
  menu: Producto[];
  onAgregarItems: (
    items: Array<{ producto: Producto; cantidad: number; notas?: string }>
  ) => void;
  onAbrirCarrito: () => void;
  tieneCarrito?: boolean;
  className?: string;
}

/**
 * Sintetiza y reproduce audio en voz alta usando SpeechSynthesis en español
 */
function hablarEnEspanol(texto: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-CL";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const vozChilena =
      voices.find((v) => v.lang.startsWith("es-CL")) ||
      voices.find((v) => v.lang.startsWith("es-")) ||
      voices[0];

    if (vozChilena) utterance.voice = vozChilena;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Si falla el síntesis de voz, continúa silenciosamente
  }
}

/**
 * Convierte un Blob de audio a string base64 puro
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64String = dataUrl.split(",")[1];
      resolve(base64String || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceOrderButton({
  localNombre,
  menu,
  onAgregarItems,
  onAbrirCarrito,
  tieneCarrito = false,
  className = "",
}: VoiceOrderButtonProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [procesandoIa, setProcesandoIa] = useState(false);
  const [transcripcion, setTranscripcion] = useState("");
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);
  const [errorVoz, setErrorVoz] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null);

  const detenerTodoAudio = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignorar
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignorar
      }
      mediaStreamRef.current = null;
    }
    setEscuchando(false);
  };

  useEffect(() => {
    return () => {
      detenerTodoAudio();
    };
  }, []);

  const iniciarEscucha = async () => {
    detenerTodoAudio();
    setTranscripcion("");
    setErrorVoz(null);
    setMensajeEstado("Iniciando micrófono...");
    setModalAbierto(true);
    audioChunksRef.current = [];
    audioBlobRef.current = null;

    // 1. Iniciar MediaRecorder para soporte universal (Opera GX, Safari, Chrome, etc.)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        let mimeType = "audio/webm";
        if (typeof MediaRecorder !== "undefined") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          }
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          if (blob.size > 0) {
            audioBlobRef.current = { blob, mimeType };
          }
        };

        recorder.start(250);
        setEscuchando(true);
        setMensajeEstado("Te escucho... dime qué platos deseas pedir");
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setErrorVoz("Permiso de micrófono denegado. Habilítalo en tu navegador.");
      }
    }

    // 2. Iniciar paralelamente Web Speech API si el navegador lo soporta nativamente
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
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
              setTranscripcion(capturado);
            }
          };

          recognition.onerror = () => {
            // Ignorar errores de Web Speech (MediaRecorder respalda la comanda)
          };

          recognition.onend = () => {
            setEscuchando(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch {
          // Ignorar
        }
      }
    }
  };

  const detenerEscucha = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar
      }
    }
    setEscuchando(false);
  };

  const procesarComandaConIa = async () => {
    detenerEscucha();

    // Pequeño retardo para asegurar que el blob de MediaRecorder esté listo
    await new Promise((r) => setTimeout(r, 200));

    const textoLimpio = transcripcion.trim();
    let audioBase64 = "";
    let mimeType = "audio/webm";

    if (audioBlobRef.current) {
      try {
        audioBase64 = await blobToBase64(audioBlobRef.current.blob);
        mimeType = audioBlobRef.current.mimeType;
      } catch (err) {
        console.error("Error convirtiendo audio a base64:", err);
      }
    }

    if (!textoLimpio && !audioBase64) {
      setErrorVoz("Por favor habla al micrófono antes de enviar tu comanda.");
      return;
    }

    setProcesandoIa(true);
    setMensajeEstado("Garzón virtual analizando tu pedido con IA...");
    setErrorVoz(null);

    try {
      // Filtrar platos disponibles para enviar al backend
      const menuDisponible = menu
        .filter((p) => p.disponible !== false)
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          descripcion: p.descripcion,
        }));

      const res = await fetch("/api/ai/voice-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcripcion: textoLimpio,
          audioBase64: audioBase64 || undefined,
          mimeType,
          menu: menuDisponible,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No pudimos interpretar tu comanda.");
      }

      if (data.texto_reconocido && !transcripcion) {
        setTranscripcion(data.texto_reconocido);
      }

      const itemsAgregadosRaw: Array<{
        producto_id: string | number;
        cantidad: number;
        notas?: string;
      }> = data.items_agregados || [];

      // Mapear los IDs a los productos reales
      const itemsFinales: Array<{
        producto: Producto;
        cantidad: number;
        notas?: string;
      }> = [];

      for (const item of itemsAgregadosRaw) {
        const prod = menu.find(
          (p) => String(p.id).toLowerCase() === String(item.producto_id).toLowerCase()
        );
        if (prod) {
          itemsFinales.push({
            producto: prod,
            cantidad: Math.max(1, Number(item.cantidad) || 1),
            notas: item.notas || "",
          });
        }
      }

      if (itemsFinales.length > 0) {
        // 1. Agregar items al carrito
        onAgregarItems(itemsFinales);

        // 2. Hablar respuesta por voz en altavoz
        if (data.respuesta_audio) {
          hablarEnEspanol(data.respuesta_audio);
        }

        // 3. Abrir el carrito para que el cliente confirme visualmente
        setModalAbierto(false);
        onAbrirCarrito();
      } else {
        // Si no encontró platos exactos
        if (data.respuesta_audio) {
          hablarEnEspanol(data.respuesta_audio);
          setMensajeEstado(data.respuesta_audio);
        } else {
          setErrorVoz("No pudimos reconocer ningún plato de la carta en lo que dijiste.");
        }
      }
    } catch (err) {
      console.error("Error al procesar comanda:", err);
      setErrorVoz(
        err instanceof Error
          ? err.message
          : "Hubo un error de conexión con el Garzón Virtual."
      );
    } finally {
      setProcesandoIa(false);
    }
  };

  const handleCerrarModal = () => {
    detenerEscucha();
    setModalAbierto(false);
    setTranscripcion("");
    setErrorVoz(null);
  };

  return (
    <>
      {/* Botón Flotante en la interfaz del Menú */}
      <div
        className={`fixed right-4 z-40 transition-all duration-300 sm:right-6 ${
          tieneCarrito ? "bottom-24 sm:bottom-24" : "bottom-6 sm:bottom-8"
        } ${className}`}
      >
        <button
          type="button"
          onClick={iniciarEscucha}
          className="group relative flex items-center gap-2 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-xl shadow-orange-950/20 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Pedir por Voz con Garzón Virtual"
        >
          {/* Anillo de pulso sutil */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 opacity-60 blur-xs group-hover:opacity-100 transition-opacity" />

          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-xs">
            <Mic className="h-4 w-4 animate-pulse" />
          </span>

          <span className="relative pr-1 tracking-tight drop-shadow-xs">
            🎙️ Garzón Virtual
          </span>
        </button>
      </div>

      {/* MODAL INTERACTIVO: GARZÓN VIRTUAL (MONTADO VÍA PORTAL EN BODY) */}
      {montado &&
        modalAbierto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
            onClick={handleCerrarModal}
          >
            <div
              className="relative w-full max-w-md my-auto overflow-hidden rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl flex flex-col max-h-[92vh] shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Cabecera */}
            <div className="p-5 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" />
                    Garzón Virtual con Gemini
                  </span>
                  <h3 className="mt-0.5 text-base sm:text-lg font-black text-white">
                    Pide por Voz en {localNombre}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCerrarModal}
                className="rounded-full bg-black/20 p-2 text-white/80 hover:bg-black/40 hover:text-white transition active:scale-95"
                aria-label="Cerrar garzón virtual"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido Central */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              {/* Botón Central Micrófono con Animación de Grabación */}
              <div className="relative my-2">
                {escuchando && (
                  <>
                    <span className="animate-ping absolute inset-0 rounded-full bg-rose-500 opacity-40" />
                    <span className="animate-pulse absolute -inset-3 rounded-full bg-amber-500/30" />
                  </>
                )}

                <button
                  type="button"
                  onClick={escuchando ? detenerEscucha : iniciarEscucha}
                  disabled={procesandoIa}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-95 ${
                    escuchando
                      ? "bg-rose-600 ring-4 ring-rose-400"
                      : "bg-gradient-to-tr from-amber-500 to-orange-500 hover:scale-105"
                  }`}
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

              {/* Mensaje de Estado */}
              <div className="min-h-[2.5rem]">
                <p className="text-sm font-extrabold text-white">
                  {procesandoIa
                    ? "🤖 Interpretando tu comanda con IA..."
                    : escuchando
                    ? "🔴 Escuchando... Habla libremente"
                    : "Toca el micrófono para comenzar a hablar"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Ej: <em>"Quiero dos completos italianos y una bebida express"</em>
                </p>
              </div>

              {/* Transcripción en Tiempo Real */}
              <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 min-h-[4.5rem] flex items-center justify-center text-left">
                {transcripcion ? (
                  <p className="text-xs sm:text-sm font-semibold text-amber-200 italic leading-relaxed">
                    "{transcripcion}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Aquí aparecerá lo que digas...
                  </p>
                )}
              </div>

              {/* Error si existe */}
              {errorVoz && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorVoz}</span>
                </div>
              )}
            </div>

            {/* Acciones Inferiores */}
            <div className="border-t border-white/10 bg-slate-950/60 p-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCerrarModal}
                disabled={procesandoIa}
                className="flex-1 rounded-2xl border border-white/20 bg-white/5 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!transcripcion.trim() || procesandoIa}
                onClick={procesarComandaConIa}
                className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-slate-950 shadow-md transition hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {procesandoIa ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Anotando...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Anotar comanda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
