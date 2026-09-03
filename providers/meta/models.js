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
    apiUrl: "https://www.llama.com/",
    apiLabel: "Trang chính thức Llama ↗",
    apiNote: "Llama là model mã nguồn mở; trang này hướng dẫn triển khai, không phải nơi cấp API key hosted.",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Meta/Llama trong Cài đặt"
  }
];

export default models;
