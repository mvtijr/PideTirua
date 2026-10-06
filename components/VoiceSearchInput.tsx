"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Search, X, Loader2 } from "lucide-react";

interface VoiceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceSearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Buscar local, empanadas, sushi, abierto ahora...",
  className = "",
}: VoiceSearchInputProps) {
  const [escuchando, setEscuchando] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(true);
  const [errorVoz, setErrorVoz] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSoportaVoz(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-CL";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setEscuchando(true);
        setErrorVoz(null);
      };

      recognition.onresult = (event: any) => {
        let textoTranscrito = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          textoTranscrito += event.results[i][0].transcript;
        }
        if (textoTranscrito) {
          onChange(textoTranscrito);
        }
      };

      recognition.onerror = (event: any) => {
        setEscuchando(false);
        if (event.error === "not-allowed") {
          setErrorVoz("Permiso de micrófono denegado");
        } else if (event.error === "no-speech") {
          // No se detectó audio
        } else {
          setErrorVoz("No se pudo reconocer la voz");
        }
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setSoportaVoz(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }
    };
  }, [onChange]);

  const toggleEscucha = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!soportaVoz) {
      alert("Tu navegador no soporta búsqueda por voz. Te sugerimos usar Google Chrome o Safari actualizado.");
      return;
    }

    if (!recognitionRef.current) return;

    if (escuchando) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar
      }
      setEscuchando(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        // Puede fallar si ya estaba corriendo
      }
    }
  };

  const handleLimpiar = () => {
    onChange("");
    onClear?.();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Icono de Lupa o Spinner */}
      <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
        {escuchando ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
        ) : (
          <Search className="h-4 w-4" />
        )}
      </span>

      {/* Input de Texto */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={escuchando ? "🎙️ Escuchando búsqueda... habla ahora" : placeholder}
        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-20 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
          escuchando
            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
            : "border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        }`}
      />

      {/* Acciones en la parte derecha del input */}
      <div className="absolute right-2 flex items-center gap-1">
        {/* Botón Limpiar búsqueda */}
        {value && !escuchando && (
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

        {/* Botón Micrófono para Búsqueda por Voz */}
        <button
          type="button"
          onClick={toggleEscucha}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95 ${
            escuchando
              ? "bg-rose-600 text-white shadow-md animate-pulse"
              : "bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-700"
          }`}
          title={escuchando ? "Detener grabación" : "Buscar por voz"}
          aria-label={escuchando ? "Detener grabación" : "Buscar por voz"}
        >
          {escuchando ? (
            <Mic className="h-4 w-4 animate-bounce" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Alerta de error sutil si se denegó el micrófono */}
      {errorVoz && (
        <span className="absolute -bottom-5 left-2 text-[10px] font-bold text-rose-500">
          {errorVoz}
        </span>
      )}
    </div>
  );
}
