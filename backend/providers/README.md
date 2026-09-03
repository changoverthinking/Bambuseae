# Backend provider adapters

Đây là lớp dành cho việc gọi API thật. Mỗi nhà cung cấp nên có một thư mục riêng, ví dụ:

```text
backend/providers/
├─ openai/
├─ anthropic/
├─ google/
├─ xai/
├─ deepseek/
├─ meta/
├─ mistral/
├─ qwen/
├─ perplexity/
├─ cohere/
└─ bambuseae/
```

Các adapter backend nhận cùng một cấu trúc chuẩn từ `/api/chat`, tự đổi sang định dạng của nhà cung cấp, rồi trả về:

```js
{
  content,
  usage: { input_tokens, output_tokens, total_tokens },
  providerModel
}
```

Không đưa API key vào GitHub hoặc vào `providers/` phía trình duyệt. Key phải nằm trong biến môi trường, secret manager hoặc kho mã hóa phía server.
