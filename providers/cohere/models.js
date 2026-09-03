// Model Cohere Command. API key thật nằm ở backend.
const models = [
  {
    id: "command",
    name: "Cohere Command",
    provider: "Cohere",
    category: "Doanh nghiệp & RAG",
    tier: "API riêng",
    shared: false,
    available: false,
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Cohere trong Cài đặt"
  }
];

export default models;
