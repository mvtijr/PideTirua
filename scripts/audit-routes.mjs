import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "https://www.pidetirua.cl").replace(/\/$/, "");
const PROBE_SLUG = process.env.PROBE_SLUG || "kai-coffee";
const TIMEOUT_MS = 8000;

async function req(urlPath, options = {}) {
  const url = urlPath.startsWith("http") ? urlPath : `${BASE}${urlPath}`;
  const res = await fetch(url, {
    redirect: options.redirect || "follow",
    method: options.method || "GET",
    headers: options.headers || { "Content-Type": "application/json" },
    body: options.body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, url };
}

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL  ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`Auditando rutas y matriz de seguridad contra: ${BASE}`);

await check("Home / responde 200 sin error boundary", async () => {
  const r = await req("/");
  assert.equal(r.status, 200);
  assert.equal(r.text.includes("Application error"), false);
});

await check("Sitemap y robots usan dominio canonico www", async () => {
  const sm = await req("/sitemap.xml");
  assert.equal(sm.status, 200);
  assert.equal(sm.text.includes("https://www.pidetirua.cl"), true);

  const rb = await req("/robots.txt");
  assert.equal(rb.status, 200);
  assert.equal(rb.text.includes("https://www.pidetirua.cl/sitemap.xml"), true);
});

await check("Slug inexistente devuelve 404 real en SSR y API (sin Soft-404)", async () => {
  const rPage = await req("/__audit_nonexistent_local_xyz__");
  assert.equal(rPage.status, 404);

  const rApi = await req("/api/menu/__audit_nonexistent_local_xyz__");
  assert.equal(rApi.status, 404);
});

await check("SSR sin cookie no filtra PINs ni catalogo privado en SuperAdmin/Admin/KDS", async () => {
  for (const p of ["/superadmin", `/admin/${PROBE_SLUG}`, `/pedidos/${PROBE_SLUG}`]) {
    const r = await req(p);
    assert.equal(r.status, 200, `${p} deberia responder 200`);
    assert.equal(r.text.includes('"pin_temporal"'), false, `${p} filtro pin_temporal`);
    assert.equal(r.text.includes('"pin_cocina"'), false, `${p} filtro pin_cocina`);
    assert.equal(r.text.includes('"token_cocina"'), false, `${p} filtro token_cocina`);
    assert.equal(/"pin"\s*:\s*"\d{4}"/.test(r.text), false, `${p} filtro pin numerico`);
  }
});

await check("Endpoints protegidos rechazan peticiones sin sesion con 401", async () => {
  const superApi = await req("/api/superadmin", {
    method: "POST",
    body: JSON.stringify({ action: "toggle-activo", slug: PROBE_SLUG, activo: true }),
  });
  assert.equal(superApi.status, 401);

  const adminApi = await req(`/api/admin/${PROBE_SLUG}`, {
    method: "POST",
    body: JSON.stringify({ action: "toggle-abierto", abierto: true }),
  });
  assert.equal(adminApi.status, 401);

  const kdsGet = await req(`/api/pedidos?local_slug=${PROBE_SLUG}`);
  assert.equal(kdsGet.status, 401);

  const aiApi = await req("/api/ai", {
    method: "POST",
    body: JSON.stringify({ tipo: "descripcion", nombrePlato: "Test" }),
  });
  assert.equal(aiApi.status, 401);
});

if (BASE.startsWith("https://www.pidetirua.cl")) {
  await check("Apex pidetirua.cl redirige 308 -> www.pidetirua.cl", async () => {
    const r = await req("https://pidetirua.cl/", { redirect: "manual" });
    assert.equal(r.status, 308);
    assert.equal(r.headers.get("location")?.startsWith("https://www.pidetirua.cl"), true);
  });
}

await check("Health /api/health responde 200 verde y sin detalles privados sin sesion", async () => {
  const r = await req("/api/health");
  assert.equal(r.status, 200, `/api/health devolvio ${r.status}`);
  const data = JSON.parse(r.text);
  assert.equal(data.ok, true);
  assert.equal(data.checks?.storage, true, "Storage locales-state.json debe responder");
  assert.equal(data.checks?.sqlLocales, true, "Tabla SQL locales debe responder");
  assert.equal(data.checks?.sqlPedidos, true, "Tabla SQL pedidos debe responder");
  assert.equal(data.checks?.syncDriftCount, 0, "Storage y SQL no deben tener drift");
  assert.equal("adminDetails" in data, false, "Sin sesion no debe exponer adminDetails");
});

if (failures > 0) {
  console.error(`Auditoria de rutas fallo (${failures} checks).`);
  process.exit(1);
}
console.log("Auditoria de rutas completada sin fallos.");
process.exit(0);
