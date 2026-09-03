// Các model DeepSeek. Trạng thái mặc định là chưa kết nối.
const models = [
  {
    id: "deepseek",
    name: "DeepSeek",
    provider: "DeepSeek",
    category: "Đa năng",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://platform.deepseek.com/api_keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway DeepSeek trong Cài đặt"
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "DeepSeek",
    category: "Suy luận & code",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://platform.deepseek.com/api_keys",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway DeepSeek trong Cài đặt"
  }
];

export default models;
