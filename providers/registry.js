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
import xaiModels from "./xai/models.js";
import xaiAdapter from "./xai/adapter.js";
import deepseekModels from "./deepseek/models.js";
import deepseekAdapter from "./deepseek/adapter.js";
import metaModels from "./meta/models.js";
import metaAdapter from "./meta/adapter.js";
import mistralModels from "./mistral/models.js";
import mistralAdapter from "./mistral/adapter.js";
import qwenModels from "./qwen/models.js";
import qwenAdapter from "./qwen/adapter.js";
import perplexityModels from "./perplexity/models.js";
import perplexityAdapter from "./perplexity/adapter.js";
import cohereModels from "./cohere/models.js";
import cohereAdapter from "./cohere/adapter.js";
import localModels from "./local/models.js";
import localAdapter from "./local/adapter.js";
import freeWebModels from "./free-web/models.js";
import freeWebAdapter from "./free-web/adapter.js";
import gatewayFreeModels from "./gateway-free/models.js";
import gatewayFreeAdapter from "./gateway-free/adapter.js";

export const AI_CATALOG = [
  ...bambuseaeFreeModels,
  ...bambuseaeFastModels,
  ...openaiModels,
  ...anthropicModels,
  ...googleModels,
  ...xaiModels,
  ...deepseekModels,
  ...metaModels,
  ...mistralModels,
  ...qwenModels,
  ...perplexityModels,
  ...cohereModels,
  ...localModels,
  ...freeWebModels,
  ...gatewayFreeModels
];

export const PROVIDER_ADAPTERS = {
  "bambuseae-free": bambuseaeFreeAdapter,
  "bambuseae-fast": bambuseaeFastAdapter,
  "openai-personal": openaiAdapter,
  "openai-reasoning": openaiAdapter,
  "claude-personal": anthropicAdapter,
  "claude-writing": anthropicAdapter,
  "gemini-personal": googleAdapter,
  "gemini-pro": googleAdapter,
  "grok": xaiAdapter,
  "grok-fast": xaiAdapter,
  "deepseek": deepseekAdapter,
  "deepseek-reasoner": deepseekAdapter,
  "llama": metaAdapter,
  "mistral": mistralAdapter,
  "qwen": qwenAdapter,
  "perplexity": perplexityAdapter,
  "command": cohereAdapter,
  "bambuseae-local": localAdapter,
  "phi-local": localAdapter,
  "llama-local": localAdapter,
  "chatgpt-free-web": freeWebAdapter,
  "gemini-free-web": freeWebAdapter,
  "claude-free-web": freeWebAdapter,
  "copilot-free-web": freeWebAdapter,
  "grok-free-web": freeWebAdapter,
  "deepseek-free-web": freeWebAdapter,
  "qwen-free-web": freeWebAdapter,
  "meta-ai-free-web": freeWebAdapter,
  "perplexity-free-web": freeWebAdapter,
  "le-chat-free-web": freeWebAdapter,
  "poe-free-web": freeWebAdapter,
  "gemini-api-free": gatewayFreeAdapter,
  "openrouter-free": gatewayFreeAdapter,
  "huggingface-inference-free": gatewayFreeAdapter,
  "cohere-trial": gatewayFreeAdapter
};

export function cloneModelCatalog() {
  return AI_CATALOG.map((model) => ({ ...model }));
}

export function getProviderAdapter(modelId) {
  return PROVIDER_ADAPTERS[modelId] || bambuseaeFreeAdapter;
}
