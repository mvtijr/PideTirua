import { NextRequest } from "next/server";
import crypto from "crypto";

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros vencidos cada 15 minutos para evitar fuga de memoria
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.lockedUntil && now - record.firstAttemptAt > 3600000) {
        rateLimitStore.delete(key);
      }
    }
  }, 15 * 60 * 1000);
}

/**
 * Obtiene la dirección IP del cliente desde los headers de NextRequest.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Verifica y aplica Rate Limiting contra ataques de fuerza bruta.
 * Por defecto: máximo 5 intentos fallidos en una ventana de 10 minutos (600.000 ms).
 * Si se exceden, bloquea temporalmente por lockDurationMs (10 minutos por defecto).
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 10 * 60 * 1000,
  lockDurationMs = 10 * 60 * 1000
): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // Si está actualmente bloqueado
  if (now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Si la ventana de tiempo ya expiró, se reinicia el contador
  if (now - record.firstAttemptAt > windowMs) {
    rateLimitStore.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  const remaining = Math.max(0, maxAttempts - record.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
  };
}

/**
 * Registra un intento fallido para un identificador.
 * Si se alcanza maxAttempts, activa el bloqueo temporal.
 */
export function recordFailedAttempt(
  identifier: string,
  maxAttempts = 5,
  lockDurationMs = 10 * 60 * 1000
): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    });
    return { locked: false, retryAfterSeconds: 0 };
  }

  record.attempts += 1;

  if (record.attempts >= maxAttempts) {
    record.lockedUntil = now + lockDurationMs;
    const retryAfterSeconds = Math.ceil(lockDurationMs / 1000);
    return { locked: true, retryAfterSeconds };
  }

  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Restablece los intentos tras una autenticación exitosa.
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Comparación segura contra ataques de tiempo (Timing Attacks).
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      // Comparar consigo mismo para evitar fuga de tiempo
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Sanitiza parámetros de texto para prevenir caracteres de control, scripts o desbordamiento.
 */
export function sanitizeString(input: unknown, maxLength = 255): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x1F\x7F]/g, "") // Eliminar caracteres de control ASCII
    .trim()
    .slice(0, maxLength);
}
