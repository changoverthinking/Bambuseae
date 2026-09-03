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
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
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
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway xAI trong Cài đặt"
  }
];

export default models;
