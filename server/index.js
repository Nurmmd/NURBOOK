/**
 * Nurbook — servidor HTTP nativo (sem dependencias npm)
 * Serve o frontend + API M-Pesa Open API (Vodacom Mocambique)
 * Arranque: node server/index.js  →  http://localhost:3001
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const mpesa = require("./mpesa");

function loadEnv(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    text.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) return;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      // .env do projecto tem prioridade
      process.env[m[1]] = v;
    });
  } catch (_) {}
}
loadEnv(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT) || 3001;
const ROOT = path.join(__dirname, "..");
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(res, status, body, headers) {
  headers = headers || {};
  const isObj = body !== null && typeof body === "object" && !Buffer.isBuffer(body);
  const data = isObj ? JSON.stringify(body) : body;
  const h = Object.assign({
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN === "*" ? "*" : FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }, headers);
  if (isObj) h["Content-Type"] = "application/json; charset=utf-8";
  res.writeHead(status, h);
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error("JSON invalido")); }
    });
    req.on("error", reject);
  });
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(ROOT, clean);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

async function handleApi(req, res, pathname) {
  if (req.method === "OPTIONS") return send(res, 204, "");

  if (pathname === "/api/health" && req.method === "GET")
    return send(res, 200, { ok: true, service: "nurbook-mpesa", mpesa: mpesa.statusInfo() });

  if (pathname === "/api/mpesa/status" && req.method === "GET")
    return send(res, 200, { ok: true, mpesa: mpesa.statusInfo() });

  if (pathname === "/api/mpesa/c2b" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const valor = Number(body.amount);
      if (!(valor > 0)) return send(res, 400, { ok: false, message: "Valor invalido." });
      const digits = String(body.phone || "").replace(/\D/g, "");
      const local = digits.startsWith("258") ? digits.slice(3) : digits;
      if (!/^8[4-5]\d{7}$/.test(local))
        return send(res, 400, { ok: false, message: "Numero M-Pesa invalido. Use 9 digitos comecados por 84 ou 85." });

      if (!mpesa.statusInfo().configured) {
        const fakeId = "SIM" + Date.now().toString(36).toUpperCase();
        return send(res, 200, {
          ok: true, simulated: true,
          message: "M-Pesa nao configurado — pagamento SIMULADO. Preencha server/.env para cobranca real.",
          transactionId: fakeId, conversationId: fakeId, thirdPartyReference: body.orderId || fakeId
        });
      }

      const thirdPartyReference = String(body.orderId || "NB" + Date.now()).slice(0, 20);
      const transactionReference = ("T" + Date.now().toString(36)).slice(0, 20);
      const result = await mpesa.c2b({
        amount: valor, msisdn: local, transactionReference, thirdPartyReference,
        description: body.description || "Compra Nurbook"
      });
      if (!result.ok)
        return send(res, 502, { ok: false, message: result.message || "M-Pesa rejeitou", code: result.code, raw: result.raw });
      return send(res, 200, {
        ok: true, simulated: false, message: result.message,
        transactionId: result.transactionId, conversationId: result.conversationId,
        thirdPartyReference: result.thirdPartyReference, code: result.code
      });
    } catch (err) {
      console.error("[c2b]", err.message);
      return send(res, 500, { ok: false, message: err.code === "NOT_CONFIGURED" ? err.message : "Erro ao contactar M-Pesa." });
    }
  }

  if (pathname === "/api/mpesa/query" && req.method === "GET") {
    try {
      const u = new URL(req.url, "http://localhost");
      const ref = u.searchParams.get("ref");
      const third = u.searchParams.get("third") || ref;
      if (!ref) return send(res, 400, { ok: false, message: "Parametro ref em falta." });
      if (!mpesa.statusInfo().configured)
        return send(res, 200, { ok: true, simulated: true, transactionStatus: "Completed", message: "Simulado" });
      return send(res, 200, await mpesa.queryStatus({ queryReference: ref, thirdPartyReference: third }));
    } catch (err) {
      console.error("[query]", err.message);
      return send(res, 500, { ok: false, message: "Erro na consulta." });
    }
  }

  return send(res, 404, { ok: false, message: "Endpoint nao encontrado." });
}

function serveStatic(req, res, pathname) {
  let filePath = safePath(pathname === "/" ? "/index.html" : pathname);
  if (!filePath) return send(res, 403, "Forbidden");
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) filePath = path.join(ROOT, "index.html");
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e2, data) => {
      if (e2) return send(res, 404, "Not found");
      send(res, 200, data, { "Content-Type": MIME[ext] || "application/octet-stream" });
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || "/", "http://localhost");
    if (u.pathname.startsWith("/api/")) await handleApi(req, res, u.pathname);
    else serveStatic(req, res, u.pathname);
  } catch (e) {
    console.error(e);
    send(res, 500, { ok: false, message: "Erro interno." });
  }
});

server.listen(PORT, () => {
  const info = mpesa.statusInfo();
  console.log("");
  console.log("  Nurbook Marketplace");
  console.log("  -------------------");
  console.log("  URL:     http://localhost:" + PORT);
  console.log("  M-Pesa:  " + (info.configured ? "CONFIGURADO (" + info.mode + ")" : "simulado (preencha server/.env)"));
  console.log("  Portal:  https://developer.mpesa.vm.co.mz/");
  console.log("");
});
