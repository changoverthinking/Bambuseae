// Các dịch vụ AI miễn phí dùng qua website chính thức.
// Không cần API key và không được xem là kết nối API thật.
// Bambuseae chỉ mở đúng trang chính thức; hạn mức do từng nhà cung cấp quản lý.
const models = [
  {
    id: "chatgpt-free-web",
    name: "ChatGPT Free",
    provider: "OpenAI",
    category: "Đa năng",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://chatgpt.com/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức ChatGPT",
    note: "Dùng miễn phí qua ChatGPT; hạn mức và tính năng có thể thay đổi."
  },
  {
    id: "gemini-free-web",
    name: "Gemini Free",
    provider: "Google",
    category: "Đa phương thức",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://gemini.google.com/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức Gemini",
    note: "Dùng miễn phí qua Gemini; hạn mức phụ thuộc model, tính năng và nhu cầu hệ thống."
  },
  {
    id: "claude-free-web",
    name: "Claude Free",
    provider: "Anthropic",
    category: "Viết & phân tích",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://claude.ai/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức Claude",
    note: "Gói miễn phí của Claude; dung lượng sử dụng có giới hạn."
  },
  {
    id: "copilot-free-web",
    name: "Microsoft Copilot Free",
    provider: "Microsoft",
    category: "Đa năng & tìm kiếm",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://copilot.microsoft.com/",
    status: "Mở web chính thức",
    reset: "Theo chính sách Copilot",
    note: "Có thể dùng miễn phí; giới hạn phụ thuộc tính năng, tài khoản và hệ thống."
  },
  {
    id: "grok-free-web",
    name: "Grok Free",
    provider: "xAI",
    category: "Đa năng & thời gian thực",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://grok.com/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức Grok",
    note: "Grok có thể dùng miễn phí trong hạn mức; gói trả phí có hạn mức cao hơn."
  },
  {
    id: "deepseek-free-web",
    name: "DeepSeek Free",
    provider: "DeepSeek",
    category: "Suy luận & code",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://chat.deepseek.com/",
    status: "Mở web chính thức",
    reset: "Theo chính sách DeepSeek",
    note: "Ứng dụng/web được công bố miễn phí; giới hạn phục vụ có thể thay đổi theo tải hệ thống."
  },
  {
    id: "qwen-free-web",
    name: "Qwen Studio Free",
    provider: "Alibaba / Qwen",
    category: "Đa năng & mã nguồn mở",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://chat.qwen.ai/",
    status: "Mở web chính thức",
    reset: "Theo chính sách Qwen",
    note: "Qwen Studio mở cho người dùng; hạn mức có thể phụ thuộc tài khoản và khu vực."
  },
  {
    id: "meta-ai-free-web",
    name: "Meta AI Free",
    provider: "Meta",
    category: "Đa năng & hình ảnh",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://www.meta.ai/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức Meta AI",
    note: "Trợ lý Meta AI miễn phí; một số tính năng nặng có hạn mức ngày/tháng."
  },
  {
    id: "perplexity-free-web",
    name: "Perplexity Free",
    provider: "Perplexity",
    category: "Tìm kiếm & nghiên cứu",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://www.perplexity.ai/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức Perplexity",
    note: "Gói miễn phí có tìm kiếm cơ bản, Pro Search và tải file trong hạn mức."
  },
  {
    id: "le-chat-free-web",
    name: "Le Chat Free",
    provider: "Mistral AI",
    category: "Đa năng & code",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://chat.mistral.ai/",
    status: "Mở web chính thức",
    reset: "Theo hạn mức Le Chat",
    note: "Gói Free có giới hạn theo ngày/tính năng."
  },
  {
    id: "poe-free-web",
    name: "Poe Free",
    provider: "Poe",
    category: "Nhiều bot AI",
    tier: "Miễn phí qua web",
    webOnly: true,
    available: true,
    webUrl: "https://poe.com/",
    status: "Mở web chính thức",
    reset: "Điểm làm mới mỗi 24 giờ",
    note: "Tài khoản miễn phí nhận điểm dùng hằng ngày; bot khác nhau có mức tiêu hao khác nhau."
  }
];

export default models;
