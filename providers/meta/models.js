// Model Meta/Llama. Backend có thể trỏ model này tới API hoặc máy chủ riêng.
const models = [
  {
    id: "llama",
    name: "Llama",
    provider: "Meta",
    category: "Mã nguồn mở",
    tier: "API riêng",
    shared: false,
    available: false,
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Meta/Llama trong Cài đặt"
  }
];

export default models;
