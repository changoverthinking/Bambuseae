# Bambuseae providers

Mỗi AI được cô lập trong một thư mục riêng gồm:

- `models.js`: tên, loại, hạn mức hiển thị và trạng thái mặc định.
- `adapter.js`: cách chuẩn hóa request gửi qua API gateway.

`registry.js` là nơi đăng ký provider vào giao diện. Không đặt API key trong bất kỳ thư mục frontend nào; key phải ở backend hoặc secret manager.

Danh mục hiện có các model Bambuseae, API/cục bộ, **11 dịch vụ AI miễn phí qua web** và connector free-tier cho Gemini API, OpenRouter, Hugging Face và Cohere. AI web chỉ mở website chính thức; những AI cần API vẫn được giữ trong catalog để người dùng bật sau qua API gateway.

Khi thêm AI mới:

1. Tạo `providers/<ai-name>/models.js` và `adapter.js`.
2. Đăng ký hai module trong `providers/registry.js`.
3. Nếu AI có API format riêng, xử lý chuyển đổi ở `backend/providers/<ai-name>/`.
4. Chạy kiểm tra cú pháp và tải lên GitHub giữ nguyên cấu trúc thư mục.

AI trong `free-web/` không gọi API và không tự chuyển nội dung chat ra website. Khi người dùng bấm gửi với một AI web, Bambuseae mở website chính thức và báo rõ rằng muốn handoff tự động cần API/OAuth.
