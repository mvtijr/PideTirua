import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientIp, sanitizeString } from "@/lib/security";

export const dynamic = "force-dynamic";

interface MenuItemInput {
  id: string | number;
  nombre: string;
  precio: number;
  descripcion?: string;
}

interface ParsedVoiceItem {
  producto_id: string | number;
  cantidad: number;
  notas?: string;
}

/**
 * Normaliza cadenas para comparación sin tildes ni caracteres especiales
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Fallback inteligente si Gemini falla o no hay conexión:
 * Mapeo por palabras clave y modismos chilenos habituales
 */
function fallbackVoiceOrderMatching(
  transcripcion: string,
  menu: MenuItemInput[]
): { items_agregados: ParsedVoiceItem[]; respuesta_audio: string } {
  const normTrans = normalizeText(transcripcion);

  // Mapeo básico de cantidades en español
  const quantityWords: Record<string, number> = {
    un: 1,
    una: 1,
    uno: 1,
    medio: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    diez: 10,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
  };

  // Sinónimos comunes en Chile
  const syns: Record<string, string[]> = {
    completo: ["tocomple", "italiano", "completo", "dinamico"],
    papa: ["papas", "fritas", "papas fritas"],
    chorrillana: ["chorrillana", "chorillana"],
    bebida: ["refresco", "coca", "fanta", "sprite", "lata", "bebida"],
    sushi: ["roll", "handroll", "sushi", "rolls"],
    pollo: ["medio pollo", "cuarto pollo", "pollo asado", "pollo"],
    empanada: ["empanada", "empanadas"],
  };

  const itemsEncontrados: ParsedVoiceItem[] = [];
  const nombresAgregados: string[] = [];

  for (const item of menu) {
    const normNombre = normalizeText(item.nombre);
    const palabrasPlato = normNombre.split(" ").filter((w) => w.length > 2);

    let coincide = false;

    // Comprobar coincidencia exacta o por subcadena
    if (normTrans.includes(normNombre)) {
      coincide = true;
    } else {
      // Coincidencia por sinónimos o palabras clave principales
      for (const p of palabrasPlato) {
        if (normTrans.includes(p)) {
          coincide = true;
          break;
        }
        for (const [key, list] of Object.entries(syns)) {
          if (normNombre.includes(key) && list.some((s) => normTrans.includes(s))) {
            coincide = true;
            break;
          }
        }
      }
    }

    if (coincide) {
      // Detectar cantidad previa a la mención del plato
      let cantidad = 1;
      const regexCantidad = /(\d+|un|una|dos|tres|cuatro|cinco)\s+/g;
      const match = normTrans.match(regexCantidad);
      if (match && match[0]) {
        const palabra = match[0].trim();
        if (quantityWords[palabra]) {
          cantidad = quantityWords[palabra];
        } else if (!isNaN(Number(palabra))) {
          cantidad = Math.max(1, Number(palabra));
        }
      }

      itemsEncontrados.push({
        producto_id: item.id,
        cantidad,
        notas: "",
      });
      nombresAgregados.push(`${cantidad > 1 ? `${cantidad} ` : ""}${item.nombre}`);

      if (itemsEncontrados.length >= 4) break; // Limitar a un pedido razonable
    }
  }

  if (itemsEncontrados.length > 0) {
    return {
      items_agregados: itemsEncontrados,
      respuesta_audio: `¡Listo! Agregué al carrito ${nombresAgregados.join(", ")}. Revisa tu pedido en pantalla.`,
    };
  }

  return {
    items_agregados: [],
    respuesta_audio: "Disculpa, no encontré esos platos en la carta de este local. Por favor repite el nombre o selecciónalo en la pantalla.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: 20 pedidos por voz por minuto por IP
    const { allowed, retryAfterSeconds } = checkRateLimit(`voice_order_${ip}`, 20, 60 * 1000);
    if (!allowed) {
      const waitMins = Math.ceil(retryAfterSeconds / 60);
      return NextResponse.json(
        { error: `Límite alcanzado. Espera ${waitMins} minuto(s).` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const transcripcion = sanitizeString(String(body.transcripcion || "")).trim();
    const menu: MenuItemInput[] = Array.isArray(body.menu) ? body.menu : [];

    if (!transcripcion) {
      return NextResponse.json(
        { error: "No se recibió ninguna transcripción de audio." },
        { status: 400 }
      );
    }

    if (menu.length === 0) {
      return NextResponse.json(
        { error: "El menú del local está vacío o no fue provisto." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

    // Si no hay API key de Gemini configurada, ejecutamos el matcher de respaldo
    if (!apiKey) {
      const fallback = fallbackVoiceOrderMatching(transcripcion, menu);
      return NextResponse.json({ ok: true, ...fallback, isFallback: true });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2, // Respuestas deterministas y precisas para comanda
        },
      });

      // Menú simplificado para ahorrar tokens y dar contexto exacto
      const menuCompacto = menu.map((m) => ({
        id: String(m.id),
        nombre: m.nombre,
        precio: m.precio,
      }));

      const prompt = `Eres el mesero virtual de un restaurante en Tirúa, Chile.
Tu tarea es analizar lo que dijo el cliente y emparéjarlo ÚNICAMENTE con los platos disponibles en el menú provisto.

MENÚ DISPONIBLE DEL LOCAL:
${JSON.stringify(menuCompacto, null, 2)}

FRASE DICHA POR EL CLIENTE:
"${transcripcion}"

REGLAS ESTRICTAS:
1. Empareja únicamente platos que realmente existen en el menú provisto.
2. Tolera modismos chilenos y variaciones coloquiales (ej: "tocomple" = completo, "papas" = papas fritas, "chela" = cerveza, "bebida" = bebida/lata/gaseosa, "promo" = promociones).
3. Si el cliente menciona una cantidad (ej: "dos", "tres", "medio", "un par"), refléjala en el campo "cantidad". Si no menciona cantidad, asume 1.
4. Si el cliente pidió algo que NO está en el menú, NO inventes platos; infórmalo amablemente en "respuesta_audio".
5. Responde OBLIGATORIAMENTE en formato JSON PURO, sin markdown, sin etiquetas \`\`\`json. Estructura exacta:
{
  "items_agregados": [
    { "producto_id": "id_del_producto", "cantidad": 1, "notas": "opcional" }
  ],
  "respuesta_audio": "Frase corta y amable confirmando los platos agregados en tono chileno natural (máximo 20 palabras), o avisando con cariño si algún plato no está en la carta."
}`;

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini Voice Order")), 4500)
        ),
      ]);

      const rawText = result.response.text().trim();
      const cleanedJson = rawText
        .replace(/^```json/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);

      if (Array.isArray(parsed.items_agregados) && typeof parsed.respuesta_audio === "string") {
        return NextResponse.json({
          ok: true,
          items_agregados: parsed.items_agregados,
          respuesta_audio: parsed.respuesta_audio,
          isFallback: false,
        });
      }
    } catch (err) {
      console.warn("Gemini voice_order fallback activado:", err);
    }

    // Fallback de contingencia si Gemini falla
    const fallback = fallbackVoiceOrderMatching(transcripcion, menu);
    return NextResponse.json({ ok: true, ...fallback, isFallback: true });
  } catch (error) {
    console.error("Error en API voice-order:", error);
    return NextResponse.json(
      { error: "Error interno procesando la comanda por voz." },
      { status: 500 }
    );
  }
}
