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
    apiUrl: "https://dashboard.cohere.com/api-keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Cohere trong Cài đặt"
  }
];

export default models;
