# Bambuseae

Bambuseae là giao diện PWA cho một không gian làm việc AI đa mô hình: chọn AI, giữ mạch hội thoại, gắn Skill/Plugin, quản lý dự án, thư viện, ghim nội dung và theo dõi token.

## Bản V9 cập nhật (V9.1)

- Giao diện responsive cho máy tính và iPhone.
- Đăng nhập bản thử cục bộ để xem toàn bộ luồng sử dụng.
- Đăng ký/đăng nhập email bản thử, kiểm tra mật khẩu, quên mật khẩu và tùy chọn ghi nhớ đăng nhập.
- Cuộc trò chuyện độc lập hoặc gắn vào dự án; tạo chat mới không sao chép và không ghi đè chat cũ.
- Mục **Gần đây** trong Không gian hiển thị toàn bộ cuộc trò chuyện cũ; từng chat có phạm vi bộ nhớ **dự án** hoặc **toàn bộ Bambuseae**.
- Chuyển AI thủ công hoặc tự động khi gần hết hạn mức.
- Theo dõi token đã dùng, còn lại, phần trăm và nhật ký input/output.
- Kho Skill và Plugin dùng chung.
- Tạo dự án, gắn Skill/Plugin và ghim dự án/đoạn chat/tin nhắn.
- Xóa dự án có xác nhận; các Thread và nhật ký token thuộc dự án cũng được dọn cùng.
- Danh mục gồm các model API/cục bộ hiện có, **11 dịch vụ AI miễn phí qua web** (ChatGPT, Gemini, Claude, Copilot, Grok, DeepSeek, Qwen, Meta AI, Perplexity, Le Chat và Poe) và connector free-tier cho Gemini API, OpenRouter, Hugging Face và Cohere.
- AI web miễn phí có nút mở website chính thức, không bị ghi nhầm là đã kết nối API. Connector API hiển thị link chính thức để lấy key và chỉ hoạt động sau khi có backend gateway.
- Trạng thái khởi đầu hoàn toàn trống: không tự tạo dự án, Thread, tin nhắn hay nhật ký token. Người dùng có thể xóa cả dự án cuối cùng.
- Menu tên tài khoản/avatar có cài đặt, đăng xuất và chuyển sang màn hình đăng nhập; màn hình đăng nhập có đăng ký, ghi nhớ đăng nhập và Google OAuth khi backend được cấu hình.
- Lưu dữ liệu bản thử trong trình duyệt bằng `localStorage`.
- PWA có manifest và service worker, có thể thêm vào màn hình chính iPhone.
- Có sẵn điểm nối `POST /api/chat` để kết nối API gateway thật.
- Màn hình chat tập trung gần toàn màn hình; Chat, Ghim, Dự án, Thư viện và Hạn mức nằm trong mục **Không gian** có thể thu gọn.

Tài khoản email trong bản GitHub là tài khoản bản thử trên từng thiết bị. Mật khẩu không được lưu dạng rõ; bản demo lưu mã băm có muối bằng Web Crypto và chỉ lưu một phiên đăng nhập khi người dùng chọn ghi nhớ. Muốn đăng nhập cùng một tài khoản trên PC và iPhone, cần kết nối backend có database, xác minh email và cookie phiên `HttpOnly`.

## Cấu trúc tách AI

`index.html` chỉ là khung HTML. Giao diện được nạp từ `app.js`, còn danh mục và adapter của từng AI nằm trong thư mục `providers/`:

```text
providers/
├─ registry.js
├─ bambuseae-free/
│  ├─ models.js
│  └─ adapter.js
├─ bambuseae-fast/
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
├─ local/
├─ free-web/
└─ gateway-free/
```

Vì vậy thêm AI mới không cần nhồi thêm thẻ HTML. Chỉ cần thêm thư mục AI, đăng ký trong `providers/registry.js`, rồi để backend xử lý API key và định dạng gọi thật. Model trong `providers/local/` là lựa chọn mô phỏng/offline, không gọi gateway và không cần API key. `skills/`, `plugins/` và `core/` cũng được dành riêng để mở rộng thành các module độc lập.

## Đưa lên GitHub Pages

1. Tạo một repository mới trên GitHub, ví dụ `Bambuseae`.
2. Tải toàn bộ nội dung thư mục này lên repository, giữ `index.html` ở thư mục gốc.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**, branch `main`, thư mục `/root`, rồi lưu.
5. Mở địa chỉ GitHub Pages bằng Safari trên iPhone → **Share → Add to Home Screen**.

GitHub Pages chỉ phục vụ giao diện tĩnh. Bản V9 có thể mở và dùng ngay với link tới 11 AI web miễn phí. Đăng nhập Google, đồng bộ giữa thiết bị, AI dùng chung và hạn mức thật cần một API gateway/backend riêng. Giao diện không sinh phản hồi AI demo khi chưa có gateway; mọi usage/quota chỉ hiển thị khi nhà cung cấp hoặc gateway trả dữ liệu thật.

## Kết nối backend

Không đặt API key trong `app.js`, `config.js` hoặc repository GitHub. Khi cần kết nối, sửa `config.js` chỉ bằng URL backend công khai không chứa bí mật:

```js
window.BAMBUSEAE_CONFIG = {
  apiBaseUrl: "https://api.ten-mien-cua-ban.example",
  googleOAuthEnabled: true,
  appName: "Bambuseae"
};
```

API gateway nên chịu trách nhiệm xác thực người dùng, kiểm tra quyền dự án, gọi nhà cung cấp AI, chuẩn hóa trường `usage`, ghi hạn mức và áp dụng rate limit. Gateway starter đi kèm đã có đường gọi tối thiểu cho AI dùng chung và các provider cá nhân OpenAI-compatible, Anthropic, Google Gemini, Cohere. Với AI cá nhân, frontend chỉ gửi key tạm thời qua HTTPS trong header `X-Bambuseae-Provider-Key`; gateway không được ghi header này vào log.

Tên model hiển thị ở frontend là mã Bambuseae. Model thật cần đặt trên server bằng các biến như `BAMBUSEAE_OPENAI_MODEL`, `BAMBUSEAE_ANTHROPIC_MODEL`, `BAMBUSEAE_GOOGLE_MODEL`… trong `.env`, không đặt trong repository.

Google OAuth trong `backend/server.mjs` cần điền `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `BAMBUSEAE_FRONTEND_URL` và đặt `config.js` trỏ `apiBaseUrl` tới backend. Trong Google Cloud, Redirect URI phải trùng tuyệt đối với `GOOGLE_OAUTH_REDIRECT_URI`, ví dụ `https://api.example.com/auth/google/callback`. Phiên mẫu hiện lưu trong bộ nhớ backend; muốn đăng nhập bền vững giữa nhiều máy cần thêm database/session store.

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

Nếu gateway không trả usage, Bambuseae giữ trạng thái **Chưa có usage thật** thay vì tự ước tính. Phần trăm quota chỉ hiển thị khi gateway trả hạn mức chính thức.

## Google OAuth và đồng bộ thật

Nút Google/“Liên kết Google” chuyển sang backend khi `googleOAuthEnabled` và `apiBaseUrl` đã được cấu hình. Backend nên trả `/api/session` sau OAuth để giao diện nhận lại tài khoản. Backend cần:

- Google OAuth Authorization Code/PKCE hoặc luồng OAuth chính thức.
- Cookie phiên `HttpOnly`, `Secure`, `SameSite` phù hợp.
- Cơ sở dữ liệu người dùng, dự án, Thread, Skill, Plugin và usage log.
- Phân quyền theo `user_id`/`project_id`.
- Không bao giờ lưu mật khẩu Gmail.
- Có endpoint đăng nhập/đăng ký, khôi phục mật khẩu và liên kết Google; frontend không được nhận mật khẩu Gmail.

## Bảo mật API key

Bản V9 chỉ giữ key cá nhân trong bộ nhớ phiên và không lưu vào `localStorage`. Đây là cơ chế xem thử, chưa phải phương án nhiều người dùng. Khi đưa vào vận hành, nên lưu key đã mã hóa bằng backend, tách quyền truy cập, che key trong log và cho phép xóa key.

Dữ liệu hội thoại có thể mã hóa khi lưu. Tuy nhiên AI được chọn vẫn phải nhận phần nội dung cần xử lý; vì vậy không nên quảng cáo rằng nhà cung cấp AI không thể thấy nội dung đó.

## Giao diện sáng/tối và biểu tượng

Giao diện mặc định vẫn là nền tối để giữ phong cách Bambuseae. Nút mặt trời/mặt trăng ở màn hình đăng nhập và thanh trên cùng cho phép đổi sang giao diện sáng; lựa chọn được lưu riêng trên thiết bị. Thanh trên cùng có bộ chọn AI nhanh theo nhóm nhà cung cấp, còn mục **AI & hạn mức** hiển thị toàn bộ danh mục và trạng thái kết nối. Icon mới là bụi tre gồm 7 thân tre, dùng cho favicon, PWA và avatar AI.

## Service worker

Khi phát hành bản mới, tăng `CACHE_NAME` trong `sw.js`. Bản hiện tại dùng `bambuseae-shell-v10` và cache luôn các module trong `providers/` cùng icon PNG cho iPhone. Nếu iPhone vẫn mở bản cũ, đóng rồi mở lại trang GitHub Pages; nếu cache chưa đổi, xóa PWA cũ khỏi màn hình chính và thêm lại.

## Chạy kiểm tra nhanh

Không cần cài npm cho bản giao diện tĩnh. Có thể kiểm tra cú pháp bằng:

```bash
node --check app.js
node --check providers/registry.js
node --check sw.js
```

## Lộ trình phiên bản tiếp theo

1. API gateway thật cho AI dùng chung và AI cá nhân.
2. Google OAuth + cơ sở dữ liệu đồng bộ đa thiết bị.
3. Adapter backend riêng cho OpenAI-compatible, Anthropic và Gemini; adapter giao diện đã có trong `providers/`.
4. Bộ chuẩn Skill/Plugin có version, manifest, quyền và phê duyệt thao tác.
5. Hạn mức chính xác theo tài khoản, cảnh báo 75/90/100% và chi phí.
