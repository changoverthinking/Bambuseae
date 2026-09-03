# Bambuseae API gateway — bản thiết kế kết nối

GitHub Pages không chạy được backend. Thư mục giao diện gọi các endpoint sau khi `config.js` có `apiBaseUrl`:

## `POST /api/chat`

Request:

```json
{
  "provider": "bambuseae",
  "model": "bambuseae-free",
  "messages": [{ "role": "user", "content": "..." }],
  "project": { "id": "...", "name": "...", "description": "..." },
  "skills": [{ "name": "...", "instructions": "..." }],
  "plugins": [{ "name": "...", "permission": "Chỉ đọc" }]
}
```

Với AI cá nhân, frontend gửi API key tạm thời trong header `X-Bambuseae-Provider-Key` qua HTTPS. Gateway chọn provider từ trường `provider`, đọc tên model thật từ biến môi trường tương ứng và tuyệt đối không ghi header này vào log. AI dùng chung dùng `BAMBUSEAE_SHARED_*` ở phía server.

## Hợp đồng tài khoản cần triển khai

Giao diện đã có luồng đăng ký/đăng nhập email, ghi nhớ phiên, quên mật khẩu và nút liên kết Google. Backend production cần cung cấp:

- `GET /api/session`: trả tài khoản hiện tại từ cookie phiên `HttpOnly`.
- `POST /auth/login`: kiểm tra email/mật khẩu và tạo phiên.
- `POST /auth/register`: tạo tài khoản, gửi email xác minh và tạo phiên sau khi hợp lệ.
- `POST /auth/password/forgot`: gửi liên kết đặt lại mật khẩu có thời hạn.
- `GET /auth/google/start?mode=login|register|link`: OAuth Google với PKCE/state và redirect an toàn.

Không trả API key, mật khẩu hoặc refresh token vào JavaScript phía trình duyệt. GitHub Pages chỉ giữ giao diện; database và cookie phiên phải nằm ở backend HTTPS.

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

Backend có thể chạy trên VPS/Cloudflare Worker/serverless riêng. `server.mjs` là gateway starter không cần npm package, hỗ trợ AI dùng chung và các provider cá nhân OpenAI-compatible, Anthropic, Google Gemini, Cohere theo `.env.example`. Tạo biến môi trường, chạy `node backend/server.mjs`, rồi đặt `apiBaseUrl` trong `config.js`.

Gateway starter vẫn chưa phải backend nhiều người dùng hoàn chỉnh: chưa có Google OAuth, database, session, đồng bộ dự án hoặc kho key cá nhân bền vững. Trước khi công khai, phải thêm các lớp đó, xác thực mọi request và ghi usage theo user/project. Không đưa `.env` hoặc API key lên GitHub.

Database production nên có các bảng `profiles`, `projects`, `threads`, `messages`, `skills`, `plugins`, `project_members`, `project_skills`, `project_plugins`, `ai_connections` và `usage_events`. API key cá nhân cần được mã hóa, kiểm tra quyền và xóa được.
