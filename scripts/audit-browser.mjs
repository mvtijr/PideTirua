import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execSync } from "node:child_process";

const BASE = (process.env.BASE_URL || "https://www.pidetirua.cl").replace(/\/$/, "");
const PROBE_SLUG = process.env.PROBE_SLUG || "kai-coffee";
const CHROME_PATH =
  process.env.CHROME_PATH ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome");
const CDP_PORT = Number(process.env.CDP_PORT || 9245);
const CHROME_PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "pidetirua-cdp-"));
const NAV_TIMEOUT_MS = 10000;

function killTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    try { process.kill(pid, "SIGKILL"); } catch {}
  }
}

async function waitForCdp(port, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(1500),
      });
      if (r.ok) {
        const list = await r.json();
        const t = list.find((x) => x.type === "page" && x.webSocketDebuggerUrl);
        if (t) return t.webSocketDebuggerUrl;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Timeout esperando puerto CDP de Chrome");
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    const listeners = new Map();
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const cid = id++;
          return new Promise((res, rej) => {
            const timer = setTimeout(() => {
              pending.delete(cid);
              rej(new Error(`Timeout CDP (${NAV_TIMEOUT_MS}ms) en ${method}`));
            }, NAV_TIMEOUT_MS);
            pending.set(cid, { res, rej, timer });
            ws.send(JSON.stringify({ id: cid, method, params }));
          });
        },
        on(ev, fn) {
          if (!listeners.has(ev)) listeners.set(ev, []);
          listeners.get(ev).push(fn);
        },
        close() {
          try { ws.close(); } catch {}
        },
      });
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("message", (evt) => {
      const msg = JSON.parse(String(evt.data));
      if (msg.id && pending.has(msg.id)) {
        const { res, rej, timer } = pending.get(msg.id);
        clearTimeout(timer);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      } else if (msg.method && listeners.has(msg.method)) {
        for (const fn of listeners.get(msg.method)) fn(msg.params);
      }
    });
  });
}

async function waitReady(cdp, settleMs = 700) {
  for (let i = 0; i < 40; i++) {
    const r = await cdp.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (r.result?.value === "complete") break;
    await new Promise((res) => setTimeout(res, 150));
  }
  await new Promise((res) => setTimeout(res, settleMs));
}

if (!fs.existsSync(CHROME_PATH)) {
  console.error(`Chrome no encontrado en ${CHROME_PATH}`);
  process.exit(1);
}

const chrome = spawn(
  CHROME_PATH,
  [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${CHROME_PROFILE}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore", detached: process.platform !== "win32" }
);

let cdp;
let exitCode = 0;

try {
  const wsUrl = await waitForCdp(CDP_PORT);
  cdp = await createCdpClient(wsUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  const consoleErrors = [];
  const pageErrors = [];
  const unexpectedHttp = [];
  let currentLabel = "";

  cdp.on("Runtime.consoleAPICalled", (ev) => {
    if (ev.type === "error") {
      consoleErrors.push({
        page: currentLabel,
        text: (ev.args || []).map((a) => a.value ?? a.description ?? "").join(" "),
      });
    }
  });
  cdp.on("Runtime.exceptionThrown", (ev) => {
    pageErrors.push({
      page: currentLabel,
      text: ev.exceptionDetails?.text || ev.exceptionDetails?.exception?.description || "exception",
    });
  });
  cdp.on("Network.responseReceived", (ev) => {
    if (ev.response?.status >= 400) {
      const isExpected404Test =
        currentLabel === "paused-404" && ev.response.url.includes("/__audit_nonexistent__");
      if (!isExpected404Test) {
        unexpectedHttp.push({
          page: currentLabel,
          url: ev.response.url,
          status: ev.response.status,
        });
      }
    }
  });

  const routes = [
    { path: "/", label: "home-desktop", w: 1440, h: 900 },
    { path: "/", label: "home-mobile", w: 390, h: 844 },
    { path: `/admin/${PROBE_SLUG}`, label: "admin-mobile", w: 390, h: 844 },
    { path: `/pedidos/${PROBE_SLUG}`, label: "kds-mobile", w: 390, h: 844 },
    { path: "/superadmin", label: "superadmin-desktop", w: 1440, h: 900 },
    { path: "/superadmin", label: "superadmin-mobile", w: 390, h: 844 },
    { path: "/__audit_nonexistent__", label: "paused-404", w: 390, h: 844 },
  ];

  const report = [];
  for (const r of routes) {
    currentLabel = r.label;
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: r.w,
      height: r.h,
      deviceScaleFactor: r.w < 600 ? 2 : 1,
      mobile: r.w < 600,
    });
    await cdp.send("Page.navigate", { url: `${BASE}${r.path}` });
    await waitReady(cdp, 650);

    const metrics = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const imgs = Array.from(document.querySelectorAll("img"));
        const brokenImgs = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
        let stickyOk = true;
        const stickyEl = document.querySelector("header.sticky, div.sticky");
        if (stickyEl) {
          const scrollable = docEl.scrollHeight > docEl.clientHeight + 200;
          if (scrollable) {
            window.scrollTo({ top: 300, behavior: "instant" });
            const rect = stickyEl.getBoundingClientRect();
            stickyOk = Math.abs(rect.top) <= 2;
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        }
        return {
          title: document.title,
          h1: document.querySelector("h1")?.innerText?.trim() || "",
          overflowX: docEl.scrollWidth > docEl.clientWidth,
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
          stickyOk,
          imgCount: imgs.length,
          brokenImgs,
          hasErrorBoundary: body.innerText.includes("Application error") || body.innerText.includes("Error inesperado"),
        };
      })()`,
      returnByValue: true,
    });
    report.push({ label: r.label, ...metrics.result.value });
  }

  // Verificar recomendador en Home
  currentLabel = "home-modal";
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await cdp.send("Page.navigate", { url: `${BASE}/` });
  await waitReady(cdp, 600);
  const modalRes = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('button[aria-label*="Recomendador"], div[aria-label*="recomendador"]');
      if (!btn) return false;
      btn.click();
      return true;
    })()`,
    returnByValue: true,
  });
  await new Promise((r) => setTimeout(r, 400));
  const modalOpened = await cdp.send("Runtime.evaluate", {
    expression: `Boolean(document.getElementById("recomendador-modal-title"))`,
    returnByValue: true,
  });

  const brokenAll = report.flatMap((x) => x.brokenImgs);
  const overflowAll = report.filter((x) => x.overflowX).map((x) => x.label);
  const brokenSticky = report.filter((x) => x.stickyOk === false).map((x) => x.label);
  const errorBoundaries = report.filter((x) => x.hasErrorBoundary).map((x) => x.label);

  const summary = {
    baseUrl: BASE,
    checkedRoutes: report.length,
    overflowRoutes: overflowAll,
    brokenStickyRoutes: brokenSticky,
    brokenImagesCount: brokenAll.length,
    errorBoundaryRoutes: errorBoundaries,
    modalInteractiveOk: Boolean(modalRes.result?.value && modalOpened.result?.value),
    consoleErrors,
    pageErrors,
    unexpectedHttp,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (
    overflowAll.length > 0 ||
    brokenSticky.length > 0 ||
    brokenAll.length > 0 ||
    errorBoundaries.length > 0 ||
    consoleErrors.length > 0 ||
    pageErrors.length > 0 ||
    unexpectedHttp.length > 0 ||
    !summary.modalInteractiveOk
  ) {
    exitCode = 1;
  }
} catch (err) {
  console.error("Fallo auditoria CDP:", err);
  exitCode = 1;
} finally {
  if (cdp) cdp.close();
  killTree(chrome.pid);
  try { fs.rmSync(CHROME_PROFILE, { recursive: true, force: true }); } catch {}
}

process.exit(exitCode);
