// Model cá nhân OpenAI. Trạng thái kết nối được lưu theo phiên trong bản demo.
const models = [
  {
    id: "openai-personal",
    name: "OpenAI Personal",
    provider: "OpenAI",
    category: "Đa năng",
    tier: "API riêng",
    shared: false,
    available: false,
    status: "Chưa kết nối",
    used: 0,
    limit: 250000,
    reset: "Theo hạn mức bạn đặt",
    note: "Nhập API key trong Cài đặt"
  }
];

export default models;
