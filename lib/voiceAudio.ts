/**
 * Utilidades y gestión de audio para reconocimiento de voz en PideTirúa
 * Soporta Opera GX, Chrome, Safari, Firefox y dispositivos móviles.
 */

/**
 * Detecta si el navegador es Opera GX o una variante de Opera
 */
export function isOperaBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /OPR\//i.test(ua) || /Opera/i.test(ua);
}

/**
 * Determina si el navegador soporta Web Speech API de manera confiable con servidores en la nube.
 * En Opera GX y Brave, Web Speech API falla con errores de red porque Google no provee claves a terceros.
 */
export function canUseWebSpeechAPI(): boolean {
  if (typeof window === "undefined") return false;
  if (isOperaBrowser()) return false; // Opera GX debe usar 100% MediaRecorder + Gemini
  if ((navigator as any).brave) return false;

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  return Boolean(SpeechRecognition);
}

/**
 * Comprueba si un MediaStream sigue activo y con pistas de audio vivas
 */
export function isStreamLive(stream: MediaStream | null): boolean {
  if (!stream || !stream.active) return false;
  try {
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 && tracks.some((t) => t.readyState === "live" && t.enabled);
  } catch {
    return false;
  }
}

/**
 * Obtiene un nuevo MediaStream limpio desde el micrófono.
 */
export async function getFreshAudioStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Tu navegador no soporta captura de audio desde el micrófono.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  return stream;
}

/**
 * Obtiene un stream activo reutilizando el existente si sigue vivo,
 * evitando pedir permisos repetidamente en cada intento.
 */
export async function getOrCreateLiveAudioStream(
  currentStream: MediaStream | null
): Promise<MediaStream> {
  if (isStreamLive(currentStream)) {
    return currentStream!;
  }
  return await getFreshAudioStream();
}

/**
 * Detiene y libera todas las pistas de un MediaStream
 */
export function stopAudioStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignorar
      }
    });
  } catch {
    // Ignorar
  }
}

/**
 * Crea un analizador de volumen de audio en tiempo real usando Web Audio API.
 * Permite mostrar ecualizadores en vivo y verificar si el usuario realmente habló.
 */
export function createAudioLevelAnalyser(
  stream: MediaStream,
  onVolumeChange: (volumen: number) => void
): { stop: () => void; getMaxVolume: () => number } {
  let audioCtx: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let animId: number | null = null;
  let maxVolume = 0;

  try {
    const AudioCtxClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) {
      return { stop: () => {}, getMaxVolume: () => 0 };
    }

    audioCtx = new AudioCtxClass();

    // En Chromium, reanudar AudioContext si inicia suspendido
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      // Calcular promedio de amplitudes
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Normalizar de 0 a 100
      const normalized = Math.min(100, Math.round((avg / 128) * 100));

      if (normalized > maxVolume) {
        maxVolume = normalized;
      }

      onVolumeChange(normalized);
      animId = requestAnimationFrame(updateVolume);
    };

    animId = requestAnimationFrame(updateVolume);
  } catch {
    // Si Web Audio API falla en algún dispositivo, se omite silenciosamente sin alterar la grabación
  }

  return {
    stop: () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (source) {
        try {
          source.disconnect();
        } catch {}
        source = null;
      }
      if (analyser) {
        try {
          analyser.disconnect();
        } catch {}
        analyser = null;
      }
      if (audioCtx && audioCtx.state !== "closed") {
        try {
          audioCtx.close();
        } catch {
          // Ignorar
        }
        audioCtx = null;
      }
    },
    getMaxVolume: () => maxVolume,
  };
}

/**
 * Retorna el mejor formato MIME soportado por el navegador para MediaRecorder
 */
export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";

  const tipos = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const tipo of tipos) {
    if (MediaRecorder.isTypeSupported(tipo)) {
      return tipo;
    }
  }

  return "audio/webm";
}

/**
 * Convierte un Blob de audio a string Base64 limpio
 */
export function audioBlobToBase64(blob: Blob): Promise<string> {
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
