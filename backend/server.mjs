/*
 * Bambuseae shared-AI gateway starter.
 *
 * This file intentionally uses only Node.js built-ins. It is a connection
 * starter for an OpenAI-compatible provider; add real authentication,
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

const headers = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

async function chat(body) {
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
  return { message: { content }, usage: payload.usage || null, providerModel: sharedModel };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/health" && request.method === "GET") return send(response, 200, { ok: true, service: "bambuseae-gateway" });
  if (url.pathname === "/api/models" && request.method === "GET") return send(response, 200, { models: [{ id: "bambuseae-free", name: sharedModel, tier: "Miễn phí dùng chung", available: Boolean(sharedBaseUrl && sharedApiKey) }] });
  if (url.pathname !== "/api/chat" || request.method !== "POST") return send(response, 404, { error: "NOT_FOUND" });
  if (!rateLimit(request)) return send(response, 429, { error: "RATE_LIMITED" });
  try {
    const body = await readJson(request);
    return send(response, 200, await chat(body));
  } catch (error) {
    const message = error?.message || "GATEWAY_ERROR";
    const status = message === "REQUEST_TOO_LARGE" ? 413 : message.startsWith("UPSTREAM_") ? (error.status || 502) : message === "RATE_LIMITED" ? 429 : 400;
    return send(response, status, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Bambuseae gateway listening on http://localhost:${port}`);
});
