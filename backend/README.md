# Bambuseae API gateway — bản thiết kế kết nối

GitHub Pages không chạy được backend. Thư mục giao diện gọi các endpoint sau khi `config.js` có `apiBaseUrl`:

## `POST /api/chat`

Request:

```json
{
  "model": "bambuseae-free",
  "messages": [{ "role": "user", "content": "..." }],
  "project": { "id": "...", "name": "...", "description": "..." },
  "skills": [{ "name": "...", "instructions": "..." }],
  "plugins": [{ "name": "...", "permission": "Chỉ đọc" }]
}
```

Response tối thiểu:

```json
{
  "message": { "content": "..." },
  "usage": {
    "input_tokens": 120,
    "output_tokens": 180,
    "total_tokens": 300
  }
}
```

## Yêu cầu trước khi công khai

- Bắt buộc xác thực phiên Google hoặc phiên tài khoản hợp lệ.
- Kiểm tra `project_id` thuộc người dùng hiện tại.
- Rate limit theo user và IP.
- Giới hạn kích thước request và số tin nhắn gửi lên.
- Không ghi API key hoặc nội dung nhạy cảm vào log.
- Tách AI dùng chung khỏi AI cá nhân; không cho người dùng đọc key của người khác.
- Trả về usage chính xác nếu nhà cung cấp cung cấp trường usage.
- Trả lỗi có mã chuẩn như `QUOTA_EXCEEDED`, `AUTH_REQUIRED`, `MODEL_UNAVAILABLE` để Bambuseae có thể tự chuyển AI.

## Khuyến nghị triển khai

Backend có thể chạy trên VPS/Cloudflare Worker/serverless riêng. `server.mjs` là gateway starter không cần npm package, dùng được với một endpoint OpenAI-compatible cho AI dùng chung. Tạo biến môi trường theo `.env.example`, chạy `node backend/server.mjs`, rồi đặt `apiBaseUrl` trong `config.js`.

Gateway starter chưa phải backend nhiều người dùng hoàn chỉnh: chưa có Google OAuth, database, session, đồng bộ dự án hoặc kho key cá nhân. Trước khi công khai, phải thêm các lớp đó, xác thực mọi request và ghi usage theo user/project. Không đưa `.env` hoặc API key lên GitHub.

Database production nên có các bảng `profiles`, `projects`, `threads`, `messages`, `skills`, `plugins`, `project_members`, `project_skills`, `project_plugins`, `ai_connections` và `usage_events`. API key cá nhân cần được mã hóa, kiểm tra quyền và xóa được.
