# Bambuseae

Bambuseae là giao diện PWA cho một không gian làm việc AI đa mô hình: chọn AI, giữ mạch hội thoại, gắn Skill/Plugin, quản lý dự án, thư viện, ghim nội dung và theo dõi token.

## Bản V1 hiện có

- Giao diện responsive cho máy tính và iPhone.
- Đăng nhập bản thử cục bộ để xem toàn bộ luồng sử dụng.
- Cuộc trò chuyện, tạo đoạn chat mới và tách nhánh chat.
- Chuyển AI thủ công hoặc tự động khi gần hết hạn mức.
- Theo dõi token đã dùng, còn lại, phần trăm và nhật ký input/output.
- Kho Skill và Plugin dùng chung.
- Tạo dự án, gắn Skill/Plugin và ghim dự án/đoạn chat/tin nhắn.
- Lưu dữ liệu bản thử trong trình duyệt bằng `localStorage`.
- PWA có manifest và service worker, có thể thêm vào màn hình chính iPhone.
- Có sẵn điểm nối `POST /api/chat` để kết nối API gateway thật.

## Đưa lên GitHub Pages

1. Tạo một repository mới trên GitHub, ví dụ `Bambuseae`.
2. Tải toàn bộ nội dung thư mục này lên repository, giữ `index.html` ở thư mục gốc.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**, branch `main`, thư mục `/root`, rồi lưu.
5. Mở địa chỉ GitHub Pages bằng Safari trên iPhone → **Share → Add to Home Screen**.

GitHub Pages chỉ phục vụ giao diện tĩnh. Bản V1 có thể mở và dùng ở chế độ mô phỏng ngay. Đăng nhập Google, đồng bộ giữa thiết bị, AI dùng chung và hạn mức thật cần một API gateway/backend riêng.

## Kết nối backend

Không đặt API key trong `app.js`, `config.js` hoặc repository GitHub. Khi cần kết nối, sửa `config.js` chỉ bằng URL backend công khai không chứa bí mật:

```js
window.BAMBUSEAE_CONFIG = {
  apiBaseUrl: "https://api.ten-mien-cua-ban.example",
  googleOAuthEnabled: true,
  appName: "Bambuseae"
};
```

API gateway nên chịu trách nhiệm xác thực người dùng, kiểm tra quyền dự án, gọi nhà cung cấp AI, chuẩn hóa trường `usage`, ghi hạn mức và áp dụng rate limit. Giao diện chấp nhận các dạng phản hồi phổ biến:

```json
{
  "message": { "content": "Nội dung trả lời" },
  "usage": {
    "input_tokens": 120,
    "output_tokens": 180,
    "total_tokens": 300
  }
}
```

Nếu gateway không trả usage, Bambuseae sẽ ước tính khoảng một token cho mỗi bốn ký tự. Trên giao diện cần ghi rõ dữ liệu là **ước tính** hay **theo API**.

## Google OAuth và đồng bộ thật

Nút Google trong bản V1 chỉ chuyển sang backend khi `googleOAuthEnabled` và `apiBaseUrl` đã được cấu hình. Backend cần:

- Google OAuth Authorization Code/PKCE hoặc luồng OAuth chính thức.
- Cookie phiên `HttpOnly`, `Secure`, `SameSite` phù hợp.
- Cơ sở dữ liệu người dùng, dự án, Thread, Skill, Plugin và usage log.
- Phân quyền theo `user_id`/`project_id`.
- Không bao giờ lưu mật khẩu Gmail.

## Bảo mật API key

Bản V1 chỉ giữ key cá nhân trong bộ nhớ phiên và không lưu vào `localStorage`. Đây là cơ chế xem thử, chưa phải phương án nhiều người dùng. Khi đưa vào vận hành, nên lưu key đã mã hóa bằng backend, tách quyền truy cập, che key trong log và cho phép xóa key.

Dữ liệu hội thoại có thể mã hóa khi lưu. Tuy nhiên AI được chọn vẫn phải nhận phần nội dung cần xử lý; vì vậy không nên quảng cáo rằng nhà cung cấp AI không thể thấy nội dung đó.

## Service worker

Khi phát hành bản mới, tăng `CACHE_NAME` trong `sw.js`. Bản hiện tại đã dùng `bambuseae-shell-v2`. Nếu iPhone vẫn mở bản cũ, xóa PWA cũ khỏi màn hình chính, mở lại GitHub Pages bằng Safari rồi thêm lại.

## Chạy kiểm tra nhanh

Không cần cài npm cho bản giao diện tĩnh. Có thể kiểm tra cú pháp bằng:

```bash
node --check app.js
node --check sw.js
```

## Lộ trình phiên bản tiếp theo

1. API gateway thật cho AI dùng chung và AI cá nhân.
2. Google OAuth + cơ sở dữ liệu đồng bộ đa thiết bị.
3. Adapter riêng cho OpenAI-compatible, Anthropic và Gemini.
4. Bộ chuẩn Skill/Plugin có version, manifest, quyền và phê duyệt thao tác.
5. Hạn mức chính xác theo tài khoản, cảnh báo 75/90/100% và chi phí.
