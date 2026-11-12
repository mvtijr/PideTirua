import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

// Re-ejecutar bajo TZ=UTC para detectar bugs nocturnos entre UTC y America/Santiago
if (process.env.PIDETIRUA_UTC_CHILD !== "1") {
  const child = spawnSync(process.execPath, [process.argv[1]], {
    stdio: "inherit",
    env: { ...process.env, TZ: "UTC", PIDETIRUA_UTC_CHILD: "1" },
  });
  process.exit(child.status ?? 1);
}

const ROOT = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const rel = specifier.slice(2);
      const candidates = [
        path.join(ROOT, `${rel}.ts`),
        path.join(ROOT, `${rel}.tsx`),
        path.join(ROOT, rel, "index.ts"),
        path.join(ROOT, rel),
      ];
      for (const full of candidates) {
        if (fs.existsSync(full)) {
          return nextResolve(pathToFileURL(full).href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

const formatters = await import(pathToFileURL(path.join(ROOT, "lib/formatters.ts")).href);
const security = await import(pathToFileURL(path.join(ROOT, "lib/security.ts")).href);

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log(`Ejecutando suite logica PideTirua (TZ=${process.env.TZ})...`);

// 1. Pruebas de fecha Chile bajo TZ=UTC (evitar bugs nocturnos despues de las 21:00 CL)
test("getFechaHoyChile devuelve el dia chileno aun cuando en UTC ya es el dia siguiente", () => {
  // 2026-11-12 01:30 UTC === 2026-11-11 22:30 en America/Santiago (UTC-3)
  const utcNextDay = new Date("2026-11-12T01:30:00.000Z");
  assert.equal(formatters.getFechaHoyChile(utcNextDay), "2026-11-11");

  // 2026-11-12 03:30 UTC === 2026-11-12 00:30 en America/Santiago
  const chileSameDay = new Date("2026-11-12T03:30:00.000Z");
  assert.equal(formatters.getFechaHoyChile(chileSameDay), "2026-11-12");
});

// 2. Pruebas de cobranza mensual con dia de cobro y fecha Chile
test("calcularEstadoCobranza evalua vencimiento exactamente despues del dia de cobro", () => {
  const loc = { dia_cobro: 5, fecha_ultimo_pago: "2026-10-10" };
  assert.equal(formatters.calcularEstadoCobranza(loc, "2026-11-05").alDia, true);
  assert.equal(formatters.calcularEstadoCobranza(loc, "2026-11-06").alDia, false);

  const pagadoNov = { dia_cobro: 5, fecha_ultimo_pago: "2026-11-02" };
  assert.equal(formatters.calcularEstadoCobranza(pagadoNov, "2026-11-28").alDia, true);
});

// 3. Normalizacion de PIN sin padStart silencioso
test("normalizeFourDigitPin rechaza PIN incompleto y respeta modo opcional", () => {
  assert.deepEqual(formatters.normalizeFourDigitPin("22", { allowEmpty: true }), {
    ok: false,
    error: "El PIN debe tener exactamente 4 dígitos numéricos.",
  });
  assert.deepEqual(formatters.normalizeFourDigitPin("", { allowEmpty: true }), {
    ok: true,
    pin: null,
  });
  assert.deepEqual(
    formatters.normalizeFourDigitPin("", { defaultOnEmpty: "1234" }),
    { ok: true, pin: "1234" }
  );
  assert.deepEqual(formatters.normalizeFourDigitPin("0456"), {
    ok: true,
    pin: "0456",
  });
});

// 4. Token HMAC de sesion y comparacion en tiempo constante
test("createSessionToken/verifySessionToken respetan rol, slug y expiracion", () => {
  const token = security.createSessionToken("admin", "kai-coffee", 60);
  assert.equal(security.verifySessionToken(token, "admin", "kai-coffee"), true);
  assert.equal(security.verifySessionToken(token, "admin", "benditosushi"), false);
  assert.equal(security.verifySessionToken(token, "superadmin"), false);

  const expired = security.createSessionToken("superadmin", "", -5);
  assert.equal(security.verifySessionToken(expired, "superadmin"), false);

  assert.equal(security.timingSafeCompare("secret-1", "secret-1"), true);
  assert.equal(security.timingSafeCompare("secret-1", "secret-2"), false);
  assert.equal(security.timingSafeCompare("short", "longer-string"), false);
});

// 5. Guardas estructurales de regresion en el codigo fuente
test("Guardas CSS sticky/overflow-x-clip y logica de categorias/blacklist", () => {
  const layout = fs.readFileSync(path.join(ROOT, "app/layout.tsx"), "utf8");
  assert.equal(layout.includes("overflow-x-clip"), true, "body debe usar overflow-x-clip");
  assert.equal(layout.includes("overflow-x-hidden"), false, "body no debe usar overflow-x-hidden");

  const globalsCss = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
  assert.equal(globalsCss.includes("overflow-x: clip"), true, "globals.css debe usar overflow-x: clip");
  assert.equal(globalsCss.includes("overflow-x: hidden"), false, "globals.css no debe usar overflow-x: hidden en html/body");

  for (const rel of [
    "components/DirectoryClient.tsx",
    "components/MenuClient.tsx",
    "components/SuperAdminClient.tsx",
    "components/AdminLocalClient.tsx",
  ]) {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.equal(src.includes("overflow-x-clip"), true, `${rel} debe usar overflow-x-clip para no romper sticky`);
    assert.equal(src.includes("overflow-x-hidden"), false, `${rel} no debe usar overflow-x-hidden sobre ancestro de sticky`);
  }

  const localesSrc = fs.readFileSync(path.join(ROOT, "lib/locales.ts"), "utf8");
  assert.equal(
    localesSrc.includes('.update({ disponible: activa })'),
    false,
    "toggleCategoriaActivaInSupabase no debe sobrescribir disponibilidad individual de platos"
  );

  const blacklistSrc = fs.readFileSync(path.join(ROOT, "lib/blacklist.ts"), "utf8");
  assert.equal(
    blacklistSrc.includes("getBlacklistedPhones"),
    false,
    "lib/blacklist.ts no debe mezclar estado en memoria por instancia sobre Storage"
  );

  const recoSrc = fs.readFileSync(path.join(ROOT, "components/RecomendadorPlatosModal.tsx"), "utf8");
  assert.equal(
    recoSrc.includes("cat.activa === false"),
    true,
    "RecomendadorPlatosModal debe omitir categorias pausadas"
  );
});

// 6. formatWhatsAppMessage no marca promo cuando fecha_oferta ya expiro
test("formatWhatsAppMessage solo etiqueta PROMO cuando la oferta esta vigente hoy", () => {
  const hoyChile = formatters.getFechaHoyChile();
  const baseLocal = {
    slug: "test-local",
    nombre: "Local Test",
    ubicacion: "Tirua",
    telefonoWhatsapp: "56912345678",
  };
  const datos = {
    nombreCliente: "Ana",
    telefonoCliente: "+56912345678",
    tipoEntrega: "Retiro en local",
    direccionOMesa: "",
    metodoPago: "Efectivo",
    notasAdicionales: "",
    horaRetiroTipo: "inmediato",
    horaRetiroValor: "",
  };

  const msgVencida = formatters.formatWhatsAppMessage({
    local: baseLocal,
    codigoRetiro: "T-01",
    datos,
    items: [
      {
        id: "p1",
        cantidad: 1,
        producto: {
          id: "p1",
          nombre: "Chupe de Jaiba",
          precio: 12000,
          disponible: true,
          es_oferta: true,
          precio_oferta: 9500,
          fecha_oferta: "2020-01-01",
          texto_promo: "OFERTA AYER",
        },
      },
    ],
  });
  assert.equal(msgVencida.includes("[PROMO:"), false, "Oferta vencida no debe imprimir tag PROMO");
  assert.equal(msgVencida.includes("12.000"), true, "Oferta vencida debe cobrar precio normal");

  const msgVigente = formatters.formatWhatsAppMessage({
    local: baseLocal,
    codigoRetiro: "T-02",
    datos,
    items: [
      {
        id: "p2",
        cantidad: 1,
        producto: {
          id: "p2",
          nombre: "Paila Marina",
          precio: 14000,
          disponible: true,
          es_oferta: true,
          precio_oferta: 10990,
          fecha_oferta: hoyChile,
          texto_promo: "SOLO HOY",
        },
      },
    ],
  });
  assert.equal(msgVigente.includes("[PROMO: SOLO HOY]"), true, "Oferta vigente debe imprimir tag PROMO");
  assert.equal(msgVigente.includes("10.990"), true, "Oferta vigente debe cobrar precio oferta");
});

console.log(`Resultado: ${passed} pruebas aprobadas.`);
if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}
process.exit(0);
