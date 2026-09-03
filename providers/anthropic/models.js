// Model cá nhân Anthropic.
const models = [
  {
    id: "claude-personal",
    name: "Claude Personal",
    provider: "Anthropic",
    category: "Viết & phân tích",
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
