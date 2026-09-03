// Các lựa chọn chạy cục bộ/offline của Bambuseae.
// Đây là placeholder trong bản GitHub tĩnh: không cần API key nhưng chưa có runtime LLM thật.
// Muốn chạy LLM thật trên thiết bị, cần cài WebLLM/Transformers.js hoặc local server.
const models = [
  {
    id: "bambuseae-local",
    name: "Bambuseae Local",
    provider: "Bambuseae",
    category: "Riêng tư & offline",
    tier: "Không cần API",
    shared: false,
    local: true,
    available: false,
    status: "Chưa cài runtime",
    reset: "Không áp dụng",
    note: "Chưa cài runtime AI cục bộ; không tạo phản hồi giả"
  },
  {
    id: "phi-local",
    name: "Phi Local",
    provider: "Local / Microsoft",
    category: "Nhẹ & riêng tư",
    tier: "Không cần API",
    shared: false,
    local: true,
    available: false,
    status: "Chưa cài runtime",
    reset: "Không áp dụng",
    note: "Chưa cài runtime Phi thật trong trình duyệt; cần WebGPU/LLM runtime"
  },
  {
    id: "llama-local",
    name: "Llama Local",
    provider: "Local / Meta",
    category: "Mã nguồn mở",
    tier: "Không cần API",
    shared: false,
    local: true,
    available: false,
    status: "Chưa cài runtime",
    reset: "Không áp dụng",
    note: "Chưa cài runtime Llama thật trong trình duyệt; cần WebGPU/LLM runtime"
  }
];

export default models;
