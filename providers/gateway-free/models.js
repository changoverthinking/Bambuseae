// Các nền tảng có tầng API miễn phí nhưng vẫn cần API key/gateway.
// Đây là connector catalog, không tự coi là đã kết nối khi chưa có gateway.
const models = [
  {
    id: "gemini-api-free",
    name: "Gemini API Free Tier",
    provider: "Google AI Studio",
    category: "API miễn phí có giới hạn",
    tier: "API miễn phí",
    shared: false,
    available: false,
    apiUrl: "https://aistudio.google.com/app/apikey",
    apiLabel: "Lấy API Gemini chính thức ↗",
    apiNote: "Google AI Studio có free tier theo model và giới hạn RPM; không đặt key trong frontend.",
    gatewayProvider: "google",
    status: "Chưa kết nối",
    reset: "Theo quota Google",
    note: "Cần gateway Bambuseae và API key Gemini"
  },
  {
    id: "openrouter-free",
    name: "OpenRouter Free Models",
    provider: "OpenRouter",
    category: "Gateway nhiều model",
    tier: "API miễn phí có giới hạn",
    shared: false,
    available: false,
    apiUrl: "https://openrouter.ai/settings/keys",
    apiLabel: "Lấy API OpenRouter chính thức ↗",
    apiNote: "OpenRouter có nhiều model free; quota và model khả dụng thay đổi theo thời điểm.",
    gatewayProvider: "openrouter",
    status: "Chưa kết nối",
    reset: "Theo quota OpenRouter",
    note: "Cần API key OpenRouter và adapter gateway tương ứng"
  },
  {
    id: "huggingface-inference-free",
    name: "Hugging Face Inference",
    provider: "Hugging Face",
    category: "Model mã nguồn mở",
    tier: "Credit miễn phí",
    shared: false,
    available: false,
    apiUrl: "https://huggingface.co/settings/tokens",
    apiLabel: "Lấy token Hugging Face chính thức ↗",
    apiNote: "Tài khoản miễn phí có credit Inference Providers nhỏ; sau đó áp dụng pay-as-you-go.",
    gatewayProvider: "huggingface",
    status: "Chưa kết nối",
    reset: "Theo credit Hugging Face",
    note: "Cần token Hugging Face và chọn model inference trên gateway"
  },
  {
    id: "cohere-trial",
    name: "Cohere Trial API",
    provider: "Cohere",
    category: "RAG & doanh nghiệp",
    tier: "API thử nghiệm miễn phí",
    shared: false,
    available: false,
    apiUrl: "https://dashboard.cohere.com/api-keys",
    apiLabel: "Lấy API Cohere chính thức ↗",
    apiNote: "Trial key miễn phí có giới hạn lượt gọi và tốc độ; production key có chính sách khác.",
    gatewayProvider: "cohere",
    status: "Chưa kết nối",
    reset: "Theo quota Cohere",
    note: "Cần gateway Bambuseae và API key Cohere"
  }
];

export default models;
