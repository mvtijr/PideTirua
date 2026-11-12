import type { NextRequest } from "next/server";
import crypto from "crypto";

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros vencidos cada 15 minutos para evitar fuga de memoria
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.lockedUntil && now - record.firstAttemptAt > 3600000) {
        rateLimitStore.delete(key);
      }
    }
  }, 15 * 60 * 1000);
  cleanupTimer.unref?.();
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

/**
 * Normaliza un número telefónico chileno a solo dígitos (ej: "569XXXXXXXX").
 */
export function normalizePhone(rawPhone: unknown): string {
  if (typeof rawPhone !== "string") return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) {
    return `56${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("569")) {
    return digits;
  }
  return digits;
}

export interface BlacklistEntry {
  telefono: string;
  motivo: string;
  fecha: string;
  bloqueadoPor: string;
}

// Almacén en memoria de números bloqueados por no presentación, bromas o fraude
const blacklistStore = new Map<string, BlacklistEntry>();

/**
 * Verifica si un número de teléfono está en la lista negra.
 */
export function isPhoneBlacklisted(rawPhone: string): boolean {
  const norm = normalizePhone(rawPhone);
  if (!norm) return false;
  return blacklistStore.has(norm);
}

/**
 * Registra un número telefónico en la lista negra de la plataforma.
 */
export function addPhoneToBlacklist(
  rawPhone: string,
  motivo = "No se presentó a retirar comanda en efectivo",
  bloqueadoPor = "admin"
): { ok: boolean; telefono: string } {
  const norm = normalizePhone(rawPhone);
  if (!norm) return { ok: false, telefono: "" };

  blacklistStore.set(norm, {
    telefono: norm,
    motivo,
    fecha: new Date().toISOString(),
    bloqueadoPor,
  });

  return { ok: true, telefono: norm };
}

/**
 * Elimina un número de teléfono de la lista negra.
 */
export function removePhoneFromBlacklist(rawPhone: string): boolean {
  const norm = normalizePhone(rawPhone);
  if (!norm) return false;
  return blacklistStore.delete(norm);
}

export const COOKIE_SUPERADMIN = "pidetirua_superadmin";
export const cookieNameAdmin = (slug: string) =>
  `pidetirua_admin_${slug.toLowerCase().trim()}`;
export const cookieNameKds = (slug: string) =>
  `pidetirua_kds_${slug.toLowerCase().trim()}`;

export type SessionRole = "superadmin" | "admin" | "kds";

interface CookieGetter {
  get(name: string): { value: string } | undefined;
}

function getSessionSigningKey(): Buffer {
  const source =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPERADMIN_KEY ||
    "pidetirua-local-dev-signing-key";
  return crypto.createHash("sha256").update(source).digest();
}

/**
 * Crea un token de sesión firmado con HMAC-SHA256 con expiración y alcance por rol/slug.
 */
export function createSessionToken(
  role: SessionRole,
  slug = "",
  ttlSeconds = 60 * 60 * 24 * 7
): string {
  const payload = {
    r: role,
    s: slug.toLowerCase().trim(),
    e: Date.now() + ttlSeconds * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const sigB64 = crypto
    .createHmac("sha256", getSessionSigningKey())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifica integridad HMAC-SHA256, expiración, rol y slug del token de sesión.
 */
export function verifySessionToken(
  token: string | undefined,
  expectedRole: SessionRole,
  expectedSlug?: string
): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSessionSigningKey())
      .update(payloadB64)
      .digest("base64url");
    if (!timingSafeCompare(sigB64, expectedSig)) {
      return false;
    }

    const decoded = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    ) as { r?: unknown; s?: unknown; e?: unknown };

    if (decoded.r !== expectedRole) return false;
    if (typeof decoded.e !== "number" || Date.now() >= decoded.e) return false;

    if (expectedSlug !== undefined) {
      const cleanExpected = expectedSlug.toLowerCase().trim();
      if (String(decoded.s || "") !== cleanExpected) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    path: "/",
    maxAge: maxAgeSeconds,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function isSuperAdminAuthorized(cookies: CookieGetter): boolean {
  return verifySessionToken(
    cookies.get(COOKIE_SUPERADMIN)?.value,
    "superadmin"
  );
}

export function isLocalAdminAuthorized(
  cookies: CookieGetter,
  slug: string
): boolean {
  if (isSuperAdminAuthorized(cookies)) return true;
  return verifySessionToken(
    cookies.get(cookieNameAdmin(slug))?.value,
    "admin",
    slug
  );
}

export function isKdsAuthorized(cookies: CookieGetter, slug: string): boolean {
  if (isLocalAdminAuthorized(cookies, slug)) return true;
  return verifySessionToken(cookies.get(cookieNameKds(slug))?.value, "kds", slug);
}

/**
 * Obtiene todos los registros actuales de la lista negra.
 */
export function getBlacklistedPhones(): BlacklistEntry[] {
  return Array.from(blacklistStore.values());
}
