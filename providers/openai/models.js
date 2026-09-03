// Các model OpenAI/ChatGPT. Trạng thái kết nối được lưu theo phiên trong bản demo.
const models = [
  {
    id: "openai-personal",
    name: "ChatGPT / OpenAI",
    provider: "OpenAI",
    category: "Đa năng",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://platform.openai.com/api-keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway OpenAI trong Cài đặt"
  },
  {
    id: "openai-reasoning",
    name: "OpenAI Reasoning",
    provider: "OpenAI",
    category: "Suy luận & code",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://platform.openai.com/api-keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway OpenAI trong Cài đặt"
  }
];

export default models;
