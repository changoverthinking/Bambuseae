// Các model Anthropic.
const models = [
  {
    id: "claude-personal",
    name: "Claude",
    provider: "Anthropic",
    category: "Viết & phân tích",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://console.anthropic.com/settings/keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Anthropic trong Cài đặt"
  },
  {
    id: "claude-writing",
    name: "Claude Writing",
    provider: "Anthropic",
    category: "Viết dài",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://console.anthropic.com/settings/keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Anthropic trong Cài đặt"
  }
];

export default models;
