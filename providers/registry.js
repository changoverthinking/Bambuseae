// Registry là điểm duy nhất để giao diện nhìn thấy các AI.
// Muốn thêm AI mới: tạo một thư mục provider, rồi đăng ký model + adapter ở đây.
import bambuseaeFreeModels from "./bambuseae-free/models.js";
import bambuseaeFreeAdapter from "./bambuseae-free/adapter.js";
import bambuseaeFastModels from "./bambuseae-fast/models.js";
import bambuseaeFastAdapter from "./bambuseae-fast/adapter.js";
import openaiModels from "./openai/models.js";
import openaiAdapter from "./openai/adapter.js";
import anthropicModels from "./anthropic/models.js";
import anthropicAdapter from "./anthropic/adapter.js";
import googleModels from "./google/models.js";
import googleAdapter from "./google/adapter.js";

export const AI_CATALOG = [
  ...bambuseaeFreeModels,
  ...bambuseaeFastModels,
  ...openaiModels,
  ...anthropicModels,
  ...googleModels
];

export const PROVIDER_ADAPTERS = {
  "bambuseae-free": bambuseaeFreeAdapter,
  "bambuseae-fast": bambuseaeFastAdapter,
  "openai-personal": openaiAdapter,
  "claude-personal": anthropicAdapter,
  "gemini-personal": googleAdapter
};

export function cloneModelCatalog() {
  return AI_CATALOG.map((model) => ({ ...model }));
}

export function getProviderAdapter(modelId) {
  return PROVIDER_ADAPTERS[modelId] || bambuseaeFreeAdapter;
}
