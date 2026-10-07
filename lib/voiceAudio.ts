/**
 * Utilidades y gestión persistente de audio para reconocimiento de voz en PideTirúa
 * Soporta de manera optimizada Opera GX, Chrome, Safari, Firefox y dispositivos móviles.
 */

let globalMediaStream: MediaStream | null = null;

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
 * Obtiene o reutiliza un MediaStream persistente.
 * Al NO destruir las pistas con track.stop(), el navegador (especialmente Opera GX)
 * NO vuelve a solicitar permisos de micrófono en grabaciones posteriores.
 */
export async function getPersistentAudioStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Tu navegador no soporta captura de audio desde el micrófono.");
  }

  // Si ya tenemos un stream vivo en memoria, reactivamos sus pistas sin volver a pedir permisos
  if (globalMediaStream) {
    const tracks = globalMediaStream.getAudioTracks();
    const hayPistasVivas = tracks.some((t) => t.readyState === "live");

    if (hayPistasVivas) {
      tracks.forEach((track) => {
        track.enabled = true; // Desmutear pista
      });
      return globalMediaStream;
    }
  }

  // Si no hay stream o las pistas expiraron, solicitamos acceso con cancelación de eco y supresión de ruido
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  globalMediaStream = stream;

  // Escuchar si el usuario desconecta el dispositivo de audio
  stream.getAudioTracks().forEach((track) => {
    track.onended = () => {
      globalMediaStream = null;
    };
  });

  return stream;
}

/**
 * Silencia las pistas de audio sin destruirlas.
 * Esto detiene la entrada de sonido pero mantiene el permiso activo en el navegador.
 */
export function mutePersistentAudioStream(): void {
  if (!globalMediaStream) return;
  try {
    globalMediaStream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
  } catch {
    // Ignorar
  }
}

/**
 * Libera completamente el stream (por ejemplo al cerrar la pestaña o desinstalar)
 */
export function releasePersistentAudioStream(): void {
  if (!globalMediaStream) return;
  try {
    globalMediaStream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch {
    // Ignorar
  }
  globalMediaStream = null;
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
