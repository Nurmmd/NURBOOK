/**
 * Cliente M-Pesa Open API — Vodacom Moçambique
 * Portal: https://developer.mpesa.vm.co.mz/
 *
 * NÃO é a Daraja (Safaricom/Quénia). Em MZ a autenticação usa
 * API Key criptografada com a Public Key (RSA PKCS1), enviada como Bearer.
 */

const crypto = require("crypto");

const HOSTS = {
  sandbox: "api.sandbox.vm.co.mz",
  live: "api.vm.co.mz",
};
const PORT = 18352;

function formatPublicKey(key) {
  if (!key) return "";
  let k = key.trim();
  if (k.includes("BEGIN PUBLIC KEY")) return k;
  // Remove espaços/quebras e envolve em PEM
  k = k.replace(/-----BEGIN PUBLIC KEY-----/g, "")
       .replace(/-----END PUBLIC KEY-----/g, "")
       .replace(/\s+/g, "");
  const lines = k.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
}

function generateBearerToken(apiKey, publicKeyPem) {
  const buffer = Buffer.from(apiKey, "utf8");
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString("base64");
}

function buildConfig(env = process.env) {
  const mode = (env.MPESA_ENV || "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
  const apiKey = (env.MPESA_API_KEY || "").trim();
  const publicKey = formatPublicKey(env.MPESA_PUBLIC_KEY || "");
  const serviceProviderCode = (env.MPESA_SERVICE_PROVIDER_CODE || "").trim();
  const origin = (env.MPESA_ORIGIN || "developer.mpesa.vm.co.mz").trim();

  const configured = !!(apiKey && publicKey && serviceProviderCode);

  return {
    mode,
    host: HOSTS[mode],
    port: PORT,
    apiKey,
    publicKey,
    serviceProviderCode,
    origin,
    configured,
  };
}

async function mpesaRequest(cfg, method, path, body) {
  if (!cfg.configured) {
    const err = new Error("M-Pesa não configurado. Defina MPESA_API_KEY, MPESA_PUBLIC_KEY e MPESA_SERVICE_PROVIDER_CODE.");
    err.code = "NOT_CONFIGURED";
    throw err;
  }

  const token = generateBearerToken(cfg.apiKey, cfg.publicKey);
  const url = `https://${cfg.host}:${cfg.port}${path}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Origin: cfg.origin,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { httpStatus: res.status, data };
}

/**
 * C2B — Cliente paga ao negócio (USSD Push no telemóvel do cliente)
 */
async function c2b({ amount, msisdn, transactionReference, thirdPartyReference, description }) {
  const cfg = buildConfig();
  // Normalizar MSISDN: 258 + 9 dígitos
  let phone = String(msisdn).replace(/\D/g, "");
  if (phone.startsWith("00258")) phone = phone.slice(5);
  if (phone.startsWith("258") && phone.length > 9) phone = phone.slice(3);
  if (phone.length === 9) phone = "258" + phone;

  const body = {
    input_Amount: String(Number(amount).toFixed(2)),
    input_CustomerMSISDN: phone,
    input_Country: "MOZ",
    input_Currency: "MZN",
    input_ServiceProviderCode: cfg.serviceProviderCode,
    input_TransactionReference: String(transactionReference).slice(0, 20),
    input_ThirdPartyReference: String(thirdPartyReference).slice(0, 20),
    input_PurchasedItemsDesc: String(description || "Pagamento Nurbook").slice(0, 50),
  };

  // Path comum na Open API MZ (singleStage C2B)
  const path = "/ipg/v2x/c2bPayment/singleStage/";
  const { httpStatus, data } = await mpesaRequest(cfg, "POST", path, body);

  const code = data.output_ResponseCode || data.responseCode || "";
  const ok = code === "INS-0" || code === "0";

  return {
    ok,
    httpStatus,
    code,
    message: data.output_ResponseDesc || data.responseDescription || data.message || (ok ? "Pedido enviado" : "Falha no pedido"),
    transactionId: data.output_TransactionID || data.transactionID || null,
    conversationId: data.output_ConversationID || data.conversationID || null,
    thirdPartyReference: data.output_ThirdPartyConversationID || thirdPartyReference,
    raw: data,
  };
}

/**
 * Consulta estado da transação
 */
async function queryStatus({ queryReference, thirdPartyReference }) {
  const cfg = buildConfig();
  const qs = new URLSearchParams({
    input_QueryReference: String(queryReference),
    input_ServiceProviderCode: cfg.serviceProviderCode,
    input_ThirdPartyReference: String(thirdPartyReference),
  });
  const path = `/ipg/v2x/queryTransactionStatus/?${qs.toString()}`;
  const { httpStatus, data } = await mpesaRequest(cfg, "GET", path, null);

  const code = data.output_ResponseCode || "";
  return {
    ok: code === "INS-0" || code === "0",
    httpStatus,
    code,
    message: data.output_ResponseDesc || "",
    transactionStatus: data.output_ResponseTransactionStatus || data.output_ResponseCode || null,
    raw: data,
  };
}

function statusInfo() {
  const cfg = buildConfig();
  return {
    configured: cfg.configured,
    mode: cfg.mode,
    host: cfg.host,
    serviceProviderCode: cfg.configured ? cfg.serviceProviderCode : null,
    // Nunca devolver keys
  };
}

module.exports = { c2b, queryStatus, statusInfo, buildConfig, formatPublicKey, generateBearerToken };
