// Các model Google Gemini.
const models = [
  {
    id: "gemini-personal",
    name: "Gemini",
    provider: "Google",
    category: "Đa phương thức",
    tier: "API riêng",
    shared: false,
    available: false,
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Google trong Cài đặt"
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    category: "Suy luận & đa phương thức",
    tier: "API riêng",
    shared: false,
    available: false,
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Google trong Cài đặt"
  }
];

export default models;
