// Các lựa chọn chạy cục bộ/offline của Bambuseae.
// Đây là lớp mô phỏng trong bản GitHub tĩnh: không cần API key và không gửi dữ liệu ra ngoài.
// Muốn chạy LLM thật trên thiết bị, có thể thay adapter bằng WebLLM/Transformers.js hoặc local server.
const models = [
  {
    id: "bambuseae-local",
    name: "Bambuseae Local",
    provider: "Bambuseae",
    category: "Riêng tư & offline",
    tier: "Không cần API",
    shared: false,
    local: true,
    available: true,
    status: "Sẵn sàng cục bộ",
    reset: "Không áp dụng",
    note: "Mô phỏng cục bộ; nội dung không rời khỏi trình duyệt"
  },
  {
    id: "phi-local",
    name: "Phi Local",
    provider: "Local / Microsoft",
    category: "Nhẹ & riêng tư",
    tier: "Không cần API",
    shared: false,
    local: true,
    available: true,
    status: "Sẵn sàng cục bộ",
    reset: "Không áp dụng",
    note: "Lựa chọn offline mô phỏng; không cần API key"
  },
  {
    id: "llama-local",
    name: "Llama Local",
    provider: "Local / Meta",
    category: "Mã nguồn mở",
    tier: "Không cần API",
    shared: false,
    local: true,
    available: true,
    status: "Sẵn sàng cục bộ",
    reset: "Không áp dụng",
    note: "Lựa chọn offline mô phỏng; muốn chạy Llama thật cần runtime cục bộ"
  }
];

export default models;
