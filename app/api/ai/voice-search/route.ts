import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientIp, sanitizeString } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Clasificador algorítmico chileno de alta precisión para mapear
 * texto o platos con su restaurante específico en Tirúa y Quidico
 */
function clasificarIntencionLocal(texto: string): {
  local_slug: string | null;
  nombre_local: string | null;
  accion: "redirigir_local" | "filtrar_directorio";
} {
  const norm = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 1. SUSHI BURGER TIRÚA (sushi-burger)
  if (
    norm.includes("sushi") ||
    norm.includes("bendito") ||
    norm.includes("roll") ||
    norm.includes("handroll") ||
    norm.includes("tempura") ||
    norm.includes("furay") ||
    norm.includes("gyoza") ||
    norm.includes("hosomaki") ||
    norm.includes("smash") ||
    norm.includes("burger") ||
    norm.includes("hamburguesa") ||
    norm.includes("nikkei")
  ) {
    return {
      local_slug: "sushi-burger",
      nombre_local: "Sushi Burger Tirúa",
      accion: "redirigir_local",
    };
  }

  // 2. LAS TRANQUERAS TIRÚA (las-tranqueras)
  if (
    norm.includes("tranquera") ||
    norm.includes("pollo") ||
    norm.includes("asado") ||
    norm.includes("spiedo") ||
    norm.includes("chorrillana") ||
    norm.includes("chorillana") ||
    norm.includes("churrasco") ||
    norm.includes("completo") ||
    norm.includes("tocomple") ||
    norm.includes("italiano") ||
    norm.includes("chacarero") ||
    norm.includes("papas fritas")
  ) {
    return {
      local_slug: "las-tranqueras",
      nombre_local: "Las Tranqueras Tirúa",
      accion: "redirigir_local",
    };
  }

  // 3. CAFETERÍA Y RESTAURANTE RÍO MAR (rio-mar)
  if (
    norm.includes("rio mar") ||
    norm.includes("riomar") ||
    norm.includes("cafeteria") ||
    norm.includes("cafe") ||
    norm.includes("kuchen") ||
    norm.includes("murtilla") ||
    norm.includes("frambuesa") ||
    norm.includes("cazuela") ||
    norm.includes("pastel de choclo") ||
    norm.includes("once") ||
    norm.includes("desayuno") ||
    norm.includes("almuerzo casero") ||
    norm.includes("cappuccino")
  ) {
    return {
      local_slug: "rio-mar",
      nombre_local: "Cafetería y Restaurante Río Mar",
      accion: "redirigir_local",
    };
  }

  // 4. RESTAURANT GRAN PACÍFICO (gran-pacifico)
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
    norm.includes("caldillo") ||
    norm.includes("machas") ||
    norm.includes("camaron") ||
    norm.includes("pescado frito") ||
    norm.includes("quidico")
  ) {
    return {
      local_slug: "gran-pacifico",
      nombre_local: "Restaurant Gran Pacífico",
      accion: "redirigir_local",
    };
  }

  // Búsquedas generales que van a filtrar la portada (ej: "abierto", "delivery")
  return {
    local_slug: null,
    nombre_local: null,
    accion: "filtrar_directorio",
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(`voice_search_${ip}`, 30, 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Límite de solicitudes de voz alcanzado. Por favor espera un momento." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const audioBase64 = String(body.audioBase64 || "").trim();
    const mimeType = String(body.mimeType || "audio/webm").trim();
    const textoDirecto = sanitizeString(String(body.texto || "")).trim();

    // 1. Si el cliente ya tenía texto directo reconocido (por ejemplo Web Speech API)
    if (textoDirecto) {
      const match = clasificarIntencionLocal(textoDirecto);
      return NextResponse.json({
        ok: true,
        texto_transcrito: textoDirecto,
        local_slug: match.local_slug,
        nombre_local: match.nombre_local,
        accion: match.accion,
        origen: "texto_directo",
      });
    }

    // 2. Si no hay audio ni texto
    if (!audioBase64) {
      return NextResponse.json(
        { error: "No se recibió audio ni texto para la búsqueda." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

    // Si no hay API Key de Gemini configurada, devolvemos error comprensible
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Servicio de transcripción por IA no disponible sin GEMINI_API_KEY.",
        },
        { status: 500 }
      );
    }

    // 3. Transcribir y clasificar con Gemini 1.5 Flash (Multimodal Audio)
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1, // Determinista para comandos de voz
        },
      });

      const audioPart = {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType.split(";")[0] || "audio/webm",
        },
      };

      const systemPrompt = `Eres el asistente de voz de "PideTirúa", la plataforma gastronómica de Tirúa y Quidico, Chile.
Tu misión:
1. Escucha atentamente el audio y transcribe EXACTAMENTE lo que dijo el usuario en español chileno.
2. Identifica si el usuario pide o menciona un restaurante o plato exclusivo de Tirúa:
   - "sushi-burger" (Sushi Burger Tirúa): sushi, rolls, handroll, smash burgers, tablas de sushi.
   - "las-tranqueras" (Las Tranqueras Tirúa): pollos asados, papas fritas, churrascos, completos, chorrillanas.
   - "rio-mar" (Cafetería y Restaurante Río Mar): salmón a la plancha, cazuela sureña, pastel de choclo, kuchen, café, once.
   - "gran-pacifico" (Restaurant Gran Pacífico en Quidico): empanadas de mariscos (camarón, machas), paila marina, chupe de jaiba, reineta frita, caldillo de congrio.
3. Si el usuario pidió comida o nombró un restaurante que corresponde a uno de ellos, define "local_slug" con su slug respectivo.
4. Si es una búsqueda genérica (ej: "locales abiertos", "comida", "buscar"), define "local_slug": null.

Responde ÚNICAMENTE en formato JSON plano:
{
  "texto_transcrito": "lo que dijo el usuario",
  "local_slug": "sushi-burger" | "las-tranqueras" | "rio-mar" | "gran-pacifico" | null,
  "nombre_local": "Nombre del local si aplica" | null,
  "accion": "redirigir_local" | "filtrar_directorio"
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout Gemini Audio")), 5000)
      );

      const geminiResult = await Promise.race([
        model.generateContent([systemPrompt, audioPart]),
        timeoutPromise,
      ]);

      const rawText = geminiResult.response.text().trim();
      const cleanedJson = rawText
        .replace(/^```json/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);

      const textoReconocido = String(parsed.texto_transcrito || "").trim();
      const localSlug = parsed.local_slug ? String(parsed.local_slug).trim() : null;
      const nombreLocal = parsed.nombre_local ? String(parsed.nombre_local).trim() : null;
      const accion = localSlug ? "redirigir_local" : (parsed.accion || "filtrar_directorio");

      return NextResponse.json({
        ok: true,
        texto_transcrito: textoReconocido,
        local_slug: localSlug,
        nombre_local: nombreLocal,
        accion,
        origen: "gemini_multimodal",
      });
    } catch (geminiError: any) {
      console.warn("Fallo transcripción de audio Gemini:", geminiError);
      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo transcribir el audio. Por favor intenta hablar más claro o toca un acceso directo.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en API voice-search:", error);
    return NextResponse.json(
      { error: "Error procesando búsqueda por voz." },
      { status: 500 }
    );
  }
}
