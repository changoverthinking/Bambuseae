/*
 * Bambuseae shared-AI gateway starter.
 *
 * This file intentionally uses only Node.js built-ins. It is a connection
 * starter for shared AI plus personal OpenAI-compatible, Anthropic, Google
 * and Cohere providers; add real authentication,
 * persistent usage accounting and encrypted key storage before making it
 * public for multiple users.
 */
import http from "node:http";

const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.BAMBUSEAE_ALLOWED_ORIGIN || "http://localhost:4173";
const sharedBaseUrl = (process.env.BAMBUSEAE_SHARED_BASE_URL || "").replace(/\/$/, "");
const sharedApiKey = process.env.BAMBUSEAE_SHARED_API_KEY || "";
const sharedModel = process.env.BAMBUSEAE_SHARED_MODEL || "your-provider-model";
const maxBodyBytes = 1_000_000;
const rateBuckets = new Map();
const personalProviders = {
  openai: { env: "OPENAI", baseUrl: process.env.BAMBUSEAE_OPENAI_BASE_URL || "https://api.openai.com/v1", protocol: "openai-compatible" },
  anthropic: { env: "ANTHROPIC", baseUrl: process.env.BAMBUSEAE_ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1", protocol: "anthropic" },
  google: { env: "GOOGLE", baseUrl: process.env.BAMBUSEAE_GOOGLE_BASE_URL || "https://generativelanguage.googleapis.com/v1beta", protocol: "google" },
  xai: { env: "XAI", baseUrl: process.env.BAMBUSEAE_XAI_BASE_URL || "https://api.x.ai/v1", protocol: "openai-compatible" },
  deepseek: { env: "DEEPSEEK", baseUrl: process.env.BAMBUSEAE_DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1", protocol: "openai-compatible" },
  meta: { env: "META", baseUrl: process.env.BAMBUSEAE_META_BASE_URL || "", protocol: "openai-compatible" },
  mistral: { env: "MISTRAL", baseUrl: process.env.BAMBUSEAE_MISTRAL_BASE_URL || "https://api.mistral.ai/v1", protocol: "openai-compatible" },
  qwen: { env: "QWEN", baseUrl: process.env.BAMBUSEAE_QWEN_BASE_URL || "", protocol: "openai-compatible" },
  perplexity: { env: "PERPLEXITY", baseUrl: process.env.BAMBUSEAE_PERPLEXITY_BASE_URL || "https://api.perplexity.ai", protocol: "openai-compatible" },
  cohere: { env: "COHERE", baseUrl: process.env.BAMBUSEAE_COHERE_BASE_URL || "https://api.cohere.com/v2", protocol: "cohere" }
};

const headers = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Bambuseae-Provider-Key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin"
};

function send(response, status, payload) {
  response.writeHead(status, headers);
  response.end(JSON.stringify(payload));
}

function clientAddress(request) {
  return request.socket.remoteAddress || "unknown";
}

function rateLimit(request) {
  const now = Date.now();
  const key = clientAddress(request);
  const bucket = rateBuckets.get(key) || { started: now, count: 0 };
  if (now - bucket.started > 60_000) {
    bucket.started = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count <= 30;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > maxBodyBytes) {
        reject(new Error("REQUEST_TOO_LARGE"));
        request.destroy();
        return;
      }
      data += chunk;
    });
    request.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch { reject(new Error("INVALID_JSON")); }
    });
    request.on("error", reject);
  });
}

function cleanMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("MESSAGES_REQUIRED");
  return messages.slice(-60).map((message) => {
    const role = message?.role === "assistant" ? "assistant" : "user";
    const content = String(message?.content || "").slice(0, 20_000);
    if (!content) throw new Error("EMPTY_MESSAGE");
    return { role, content };
  });
}

function buildSystemPrompt(body) {
  const project = body.project || {};
  const skills = Array.isArray(body.skills) ? body.skills : [];
  const plugins = Array.isArray(body.plugins) ? body.plugins : [];
  const skillText = skills.map((skill) => `- ${String(skill.name || "Skill").slice(0, 120)}: ${String(skill.instructions || "").slice(0, 4_000)}`).join("\n");
  const pluginText = plugins.map((plugin) => `- ${String(plugin.name || "Plugin").slice(0, 120)} (${String(plugin.permission || "quyền chưa rõ")})`).join("\n");
  return [
    "Bạn đang trả lời trong Bambuseae. Giữ mạch hội thoại và không tự ý thay đổi quyết định đã chốt trong dự án.",
    `Dự án: ${String(project.name || "Không có tên").slice(0, 200)}`,
    `Mô tả: ${String(project.description || "").slice(0, 2_000)}`,
    skillText ? `Skill đang bật:\n${skillText}` : "",
    pluginText ? `Plugin đang bật (chỉ mô tả quyền, chưa tự thực thi):\n${pluginText}` : ""
  ].filter(Boolean).join("\n\n");
}

function providerModel(provider) {
  const config = personalProviders[provider];
  const model = config ? process.env[`BAMBUSEAE_${config.env}_MODEL`] : "";
  if (!model) throw new Error("MODEL_NOT_CONFIGURED");
  return model;
}

function cleanProviderKey(request) {
  const value = request.headers["x-bambuseae-provider-key"];
  if (typeof value !== "string" || value.length < 8 || value.length > 500) return "";
  return value.trim();
}

function providerMessages(body) {
  return [{ role: "system", content: buildSystemPrompt(body) }, ...cleanMessages(body.messages)];
}

function parseUsage(usage) {
  if (!usage || typeof usage !== "object") return null;
  const input = Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokenCount);
  const output = Number(usage.output_tokens ?? usage.completion_tokens ?? usage.candidatesTokenCount);
  const total = Number(usage.total_tokens ?? (Number.isFinite(input) && Number.isFinite(output) ? input + output : NaN));
  return Number.isFinite(input) || Number.isFinite(output) || Number.isFinite(total)
    ? { input_tokens: Number.isFinite(input) ? input : 0, output_tokens: Number.isFinite(output) ? output : 0, total_tokens: Number.isFinite(total) ? total : 0 }
    : null;
}

async function fetchJson(url, options) {
  const upstream = await fetch(url, options);
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = new Error(payload?.error?.message || payload?.message || `UPSTREAM_${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }
  return payload;
}

async function callOpenAICompatible(body, provider, key) {
  const config = personalProviders[provider];
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  if (!baseUrl) throw new Error("PROVIDER_BASE_URL_NOT_CONFIGURED");
  const payload = await fetchJson(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: providerModel(provider), messages: providerMessages(body), temperature: 0.7 })
  });
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("UPSTREAM_EMPTY_RESPONSE");
  return { message: { content }, usage: parseUsage(payload.usage), providerModel: providerModel(provider) };
}

async function callAnthropic(body, key) {
  const config = personalProviders.anthropic;
  const messages = cleanMessages(body.messages).map((message) => ({ role: message.role, content: message.content }));
  const payload = await fetchJson(`${config.baseUrl.replace(/\/$/, "")}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: providerModel("anthropic"), max_tokens: 4096, system: buildSystemPrompt(body), messages })
  });
  const content = Array.isArray(payload?.content) ? payload.content.filter((part) => part?.type === "text").map((part) => part.text).join("\n") : "";
  if (!content) throw new Error("UPSTREAM_EMPTY_RESPONSE");
  return { message: { content }, usage: parseUsage(payload.usage), providerModel: providerModel("anthropic") };
}

async function callGoogle(body, key) {
  const config = personalProviders.google;
  const contents = cleanMessages(body.messages).map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
  const url = `${config.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(providerModel("google"))}:generateContent?key=${encodeURIComponent(key)}`;
  const payload = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: buildSystemPrompt(body) }] }, contents })
  });
  const content = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!content) throw new Error("UPSTREAM_EMPTY_RESPONSE");
  return { message: { content }, usage: parseUsage(payload.usageMetadata), providerModel: providerModel("google") };
}

async function callCohere(body, key) {
  const config = personalProviders.cohere;
  const payload = await fetchJson(`${config.baseUrl.replace(/\/$/, "")}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: providerModel("cohere"), messages: providerMessages(body), temperature: 0.7 })
  });
  const content = Array.isArray(payload?.message?.content) ? payload.message.content.filter((part) => part?.type === "text").map((part) => part.text).join("\n") : payload?.message?.content;
  if (!content) throw new Error("UPSTREAM_EMPTY_RESPONSE");
  return { message: { content }, usage: parseUsage(payload.usage), providerModel: providerModel("cohere") };
}

async function callShared(body) {
  if (!sharedBaseUrl || !sharedApiKey) throw new Error("SHARED_PROVIDER_NOT_CONFIGURED");
  const messages = [{ role: "system", content: buildSystemPrompt(body) }, ...cleanMessages(body.messages)];
  const upstream = await fetch(`${sharedBaseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${sharedApiKey}` },
    body: JSON.stringify({ model: sharedModel, messages, temperature: 0.7 })
  });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = new Error(payload?.error?.message || `UPSTREAM_${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("UPSTREAM_EMPTY_RESPONSE");
  return { message: { content }, usage: parseUsage(payload.usage), providerModel: sharedModel };
}

async function chat(body, request) {
  const provider = String(body?.provider || "bambuseae");
  if (provider === "bambuseae") return callShared(body);
  const config = personalProviders[provider];
  if (!config) throw new Error("PROVIDER_NOT_SUPPORTED");
  const key = cleanProviderKey(request);
  if (!key) throw new Error("PROVIDER_KEY_REQUIRED");
  if (config.protocol === "anthropic") return callAnthropic(body, key);
  if (config.protocol === "google") return callGoogle(body, key);
  if (config.protocol === "cohere") return callCohere(body, key);
  return callOpenAICompatible(body, provider, key);
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/health" && request.method === "GET") return send(response, 200, { ok: true, service: "bambuseae-gateway" });
  if (url.pathname === "/api/models" && request.method === "GET") {
    const available = Boolean(sharedBaseUrl && sharedApiKey);
    return send(response, 200, { models: [
      { id: "bambuseae-free", name: sharedModel, tier: "Miễn phí dùng chung", available, status: available ? "Đang hoạt động" : "Chưa cấu hình", note: available ? "AI dùng chung qua gateway" : "Gateway chưa có BAMBUSEAE_SHARED_*" },
      { id: "bambuseae-fast", name: sharedModel, tier: "Dự phòng dùng chung", available, status: available ? "Đang hoạt động" : "Chưa cấu hình", note: available ? "AI dự phòng qua gateway" : "Gateway chưa có BAMBUSEAE_SHARED_*" }
    ] });
  }
  if (url.pathname !== "/api/chat" || request.method !== "POST") return send(response, 404, { error: "NOT_FOUND" });
  if (!rateLimit(request)) return send(response, 429, { error: "RATE_LIMITED" });
  try {
    const body = await readJson(request);
    return send(response, 200, await chat(body, request));
  } catch (error) {
    const message = error?.message || "GATEWAY_ERROR";
    const status = message === "REQUEST_TOO_LARGE" ? 413 : message.startsWith("UPSTREAM_") ? (error.status || 502) : message === "RATE_LIMITED" ? 429 : 400;
    return send(response, status, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Bambuseae gateway listening on http://localhost:${port}`);
});
