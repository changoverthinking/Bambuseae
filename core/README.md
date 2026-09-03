# Bambuseae core

`app.js` hiện là bộ điều phối giao diện của bản demo. Các lớp nghiệp vụ dài hạn nên được tách dần vào đây:

- `router.js`: chọn AI hiện tại và AI dự phòng.
- `context-handoff.js`: đóng gói Thread, dự án, Skill và Plugin khi đổi AI.
- `token-monitor.js`: đọc usage thật, tính phần trăm còn lại và cảnh báo quota.
- `store.js`: thay `localStorage` bằng API đồng bộ khi có tài khoản thật.

Bản hiện tại đã tách riêng phần provider trước để có thể thêm AI mà không sửa HTML.
