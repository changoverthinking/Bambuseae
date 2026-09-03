// Model Qwen. Có thể kết nối qua gateway hoặc máy chủ self-hosted.
const models = [
  {
    id: "qwen",
    name: "Qwen",
    provider: "Alibaba / Qwen",
    category: "Mã nguồn mở",
    tier: "API riêng",
    shared: false,
    available: false,
    apiUrl: "https://dashscope.console.aliyun.com/apiKey",
    status: "Chưa kết nối",
    reset: "Theo hạn mức bạn đặt",
    note: "Kết nối gateway Qwen trong Cài đặt"
  }
];

export default models;
