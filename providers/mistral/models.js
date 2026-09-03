// Model Mistral. API key thật không đặt trong frontend.
const models = [
  {
    id: "mistral",
    name: "Mistral",
    provider: "Mistral AI",
    category: "Đa năng",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://console.mistral.ai/api-keys/",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Mistral trong Cài đặt"
  }
];

export default models;
