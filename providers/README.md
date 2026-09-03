# Bambuseae providers

Mỗi AI được cô lập trong một thư mục riêng gồm:

- `models.js`: tên, loại, hạn mức hiển thị và trạng thái mặc định.
- `adapter.js`: cách chuẩn hóa request gửi qua API gateway.

`registry.js` là nơi đăng ký provider vào giao diện. Không đặt API key trong bất kỳ thư mục frontend nào; key phải ở backend hoặc secret manager.

Khi thêm AI mới:

1. Tạo `providers/<ai-name>/models.js` và `adapter.js`.
2. Đăng ký hai module trong `providers/registry.js`.
3. Nếu AI có API format riêng, xử lý chuyển đổi ở `backend/providers/<ai-name>/`.
4. Chạy kiểm tra cú pháp và tải lên GitHub giữ nguyên cấu trúc thư mục.
