# Bambuseae providers

Mỗi AI được cô lập trong một thư mục riêng gồm:

- `models.js`: tên, loại, hạn mức hiển thị và trạng thái mặc định.
- `adapter.js`: cách chuẩn hóa request gửi qua API gateway.

`registry.js` là nơi đăng ký provider vào giao diện. Không đặt API key trong bất kỳ thư mục frontend nào; key phải ở backend hoặc secret manager.

Danh mục hiện có các model Bambuseae, API/cục bộ, **11 dịch vụ AI miễn phí qua web** và connector free-tier cho Gemini API, OpenRouter, Hugging Face và Cohere. AI web có API chính thức sẽ được nối vào provider tương ứng để chạy ngay trong Bambuseae sau khi kết nối key; tài khoản web Free không tự biến thành quota API. Dịch vụ chỉ có web consumer vẫn được giữ trong catalog nhưng không bị mở web khi bấm gửi và không được giả lập phản hồi.

Khi thêm AI mới:

1. Tạo `providers/<ai-name>/models.js` và `adapter.js`.
2. Đăng ký hai module trong `providers/registry.js`.
3. Nếu AI có API format riêng, xử lý chuyển đổi ở `backend/providers/<ai-name>/`.
4. Chạy kiểm tra cú pháp và tải lên GitHub giữ nguyên cấu trúc thư mục.

AI trong `free-web/` không lấy cookie hay tự động hóa website. Model có `apiConnectorId` sẽ dùng adapter của provider API tương ứng; khi chưa kết nối, Bambuseae mở hộp kết nối ngay trong app. Model không có `apiConnectorId` chỉ hiển thị trạng thái “Chỉ có web” và không tạo câu trả lời giả.
