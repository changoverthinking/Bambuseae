// Các model xAI/Grok. API key thật phải nằm ở backend.
const models = [
  {
    id: "grok",
    name: "Grok",
    provider: "xAI",
    category: "Đa năng",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://console.x.ai/",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway xAI trong Cài đặt"
  },
  {
    id: "grok-fast",
    name: "Grok Fast",
    provider: "xAI",
    category: "Phản hồi nhanh",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://console.x.ai/",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway xAI trong Cài đặt"
  }
];

export default models;
