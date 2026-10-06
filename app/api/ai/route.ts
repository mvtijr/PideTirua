import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientIp, sanitizeString } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Fallback elegante para descripciones de platos si Gemini no está configurado o falla
 */
function getFallbackDishDescription(nombre: string, categoria?: string): string {
  const norm = (nombre + " " + (categoria || "")).toLowerCase();

  if (norm.includes("burger") || norm.includes("hamburguesa") || norm.includes("sandwich") || norm.includes("chacarero") || norm.includes("barros")) {
    return "Preparada con carne jugosa seleccionada, ingredientes frescos y pan suave artesanal. Un clásico contundente con el mejor sabor local.";
  }
  if (norm.includes("sushi") || norm.includes("handroll") || norm.includes("roll") || norm.includes("sashimi")) {
    return "Roll fresco y crocante elaborado al instante con ingredientes premium, textura suave y una fusión de sabores irresistible.";
  }
  if (norm.includes("pescado") || norm.includes("reineta") || norm.includes("marisco") || norm.includes("ceviche") || norm.includes("merluza") || norm.includes("salmon")) {
    return "Pesca fresca de nuestra costa de Tirúa, preparada con sazón tradicional al punto exacto para resaltar todo su sabor marino.";
  }
  if (norm.includes("pizza") || norm.includes("pasta") || norm.includes("lasaña")) {
    return "Masa suave y crujiente con abundante queso fundido e ingredientes seleccionados, horneada con el cariño de la cocina tradicional.";
  }
  if (norm.includes("papa") || norm.includes("chorillana") || norm.includes("papas")) {
    return "Papas doradas y crujientes servidas calientes, ideales para compartir y acompañar tus mejores momentos.";
  }
  if (norm.includes("postre") || norm.includes("torta") || norm.includes("helado") || norm.includes("dulce")) {
    return "El bocado dulce perfecto para cerrar tu comida con una textura suave, fresca y equilibrada.";
  }
  if (norm.includes("bebida") || norm.includes("jugo") || norm.includes("cerveza")) {
    return "Bebida refrescante servida bien fría, ideal para acompañar tu pedido y disfrutar al máximo.";
  }
  return "Exquisita preparación artesanal con ingredientes frescos y seleccionados, elaborada al momento con todo el sabor tradicional de Tirúa.";
}

/**
 * Fallback elegante para publicaciones de redes sociales
 */
function getFallbackSocialPost(
  nombreLocal: string,
  rubro: string,
  platosDestacados: string,
  link: string
): string {
  const platos = platosDestacados.trim() || "nuestras mejores especialidades";
  return `🌊🍽️ ¡Hoy se come rico en ${nombreLocal}! ✨

¿Antojo de algo delicioso? Disfruta de ${platos}, preparados al momento con ingredientes frescos y el cariño de siempre.

🕒 ¡Atendiendo ahora con entrega rápida!
📲 Revisa nuestra carta digital completa y pide directo por WhatsApp aquí:
👉 ${link}

¡No te quedes sin tu pedido! 🚀`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: 25 consultas de IA por minuto por IP
    const { allowed, retryAfterSeconds } = checkRateLimit(`ai_${ip}`, 25, 60 * 1000);
    if (!allowed) {
      const waitMinutes = Math.ceil(retryAfterSeconds / 60);
      return NextResponse.json(
        { error: `Límite de solicitudes de IA alcanzado. Por favor espera ${waitMinutes} minuto(s).` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();

    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

    // =========================================================================
    // ACCIÓN 1: Describir Plato (describe_dish)
    // =========================================================================
    if (action === "describe_dish") {
      const nombre = sanitizeString(String(body.nombre || "")).trim();
      const categoria = sanitizeString(String(body.categoria || "")).trim();

      if (!nombre) {
        return NextResponse.json(
          { error: "El nombre del plato es requerido para generar la descripción." },
          { status: 400 }
        );
      }

      // Si no hay API key de Gemini configurada, devolvemos el fallback gastronómico de inmediato
      if (!apiKey) {
        const fallback = getFallbackDishDescription(nombre, categoria);
        return NextResponse.json({ ok: true, descripcion: fallback, isFallback: true });
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como un redactor gastronómico experto en Chile.
Escribe una descripción breve, irresistible y apetitosa para un plato de restaurante en una plataforma de pedidos online.
Nombre del plato: "${nombre}".
Categoría: "${categoria || 'Plato de la carta'}".

REGLAS ESTRICTAS:
- Longitud: Entre 15 y 25 palabras como máximo.
- Tono: Chileno, cálido, natural, profesional y muy apetitoso.
- No uses comillas, ni títulos, ni viñetas. Solo el párrafo descriptivo directo.
- Enfócate en la frescura, textura o sabor característico.`;

        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout Gemini")), 4000)
          ),
        ]);

        const texto = result.response.text().trim().replace(/^["']|["']$/g, "");
        if (texto && texto.length > 10) {
          return NextResponse.json({ ok: true, descripcion: texto, isFallback: false });
        }
      } catch (err) {
        console.warn("Gemini describe_dish fallback:", err);
      }

      // En caso de error o respuesta vacía de Gemini
      return NextResponse.json({
        ok: true,
        descripcion: getFallbackDishDescription(nombre, categoria),
        isFallback: true,
      });
    }

    // =========================================================================
    // ACCIÓN 2: Generar Publicación para Redes (social_post)
    // =========================================================================
    if (action === "social_post") {
      const nombreLocal = sanitizeString(String(body.nombre_local || "Nuestro Local")).trim();
      const rubro = sanitizeString(String(body.rubro || "Gastronomía")).trim();
      const platosDestacados = sanitizeString(String(body.platos_destacados || "")).trim();
      const link = sanitizeString(String(body.link || "https://pidetirua.vercel.app")).trim();

      if (!apiKey) {
        const fallback = getFallbackSocialPost(nombreLocal, rubro, platosDestacados, link);
        return NextResponse.json({ ok: true, post: fallback, isFallback: true });
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Actúa como especialista en marketing digital gastronómico en Chile.
Escribe una publicación corta y altamente atractiva para Estados de WhatsApp, Instagram y Facebook de un restaurante en Tirúa.
Local: "${nombreLocal}".
Rubro: "${rubro}".
Platos o especialidades recomendadas: "${platosDestacados || 'Nuestra carta fresca'}".
Enlace del menú digital: "${link}".

REGLAS ESTRICTAS:
- Longitud: Entre 40 y 65 palabras.
- Estructura: Gancho llamativo al inicio con emojis gastronómicos, mención breve a los platos o frescura, y llamado a la acción claro con el enlace para pedir por WhatsApp.
- Tono: Cercano, entusiasta, chileno y convocante.
- No agregues hashtags excesivos (máximo 2 o 3 al final, ej: #PideTirúa #Tirúa).`;

        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout Gemini")), 4000)
          ),
        ]);

        const texto = result.response.text().trim();
        if (texto && texto.length > 20) {
          return NextResponse.json({ ok: true, post: texto, isFallback: false });
        }
      } catch (err) {
        console.warn("Gemini social_post fallback:", err);
      }

      return NextResponse.json({
        ok: true,
        post: getFallbackSocialPost(nombreLocal, rubro, platosDestacados, link),
        isFallback: true,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error) {
    console.error("Error en API AI:", error);
    return NextResponse.json(
      { error: "Error interno procesando la solicitud de IA." },
      { status: 500 }
    );
  }
}
