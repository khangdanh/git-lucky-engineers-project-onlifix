# Mẫu báo lỗi (Bug Report) — OnliFix

Vui lòng điền đầy đủ các mục bên dưới khi báo lỗi để đội phát triển có thể tái hiện và fix nhanh.

---

**Tiêu đề (ngắn gọn):**
- [ví dụ] `tracking.html` — Tuyến đường (routing) không hiển thị

**Mức độ (Severity):**
- Blocker / Critical / Major / Minor / Trivial

**Môi trường (Environment):**
- OS: Windows / macOS / Linux / Android / iOS + phiên bản
- Trình duyệt & phiên bản: (Chrome 114, Edge 115, Firefox 116, v.v.)
- URL local (vd): `http://localhost:8000/html/tracking.html`
- Commit / nhánh (nếu biết): `branch-name` / `commit-hash`

**Mô tả ngắn (Summary):**
- Tóm tắt vấn đề trong 1-2 câu.

**Các bước để tái tạo (Steps to reproduce):**
1. Mở trang `...` (URL)
2. Thực hiện hành động `...` (vd: Allow Geolocation)
3. Quan sát kết quả

**Kết quả hiện tại (Actual result):**
- Mô tả chính xác điều bạn thấy (copy console errors nếu có)

**Kết quả mong đợi (Expected result):**
- Mô tả điều bạn nghĩ nên xảy ra

**Console / Network / Errors:**
- Dán capture console (log) hoặc mô tả lỗi mạng (404, 403, timed out).

**Ảnh chụp màn hình / Video (nếu có):**
- Đính kèm ảnh chụp màn hình hoặc link video ngắn (khuyến nghị dùng Loom hoặc MP4 nhỏ).

**Ghi chú bổ sung / Temporary workaround:**
- Nếu có bước tạm thời để tránh lỗi, ghi rõ.

**Người báo:**
- Tên và cách liên hệ (email/Slack)

---

Hướng dẫn nhanh gửi bug:
- Thêm tiêu đề rõ ràng + môi trường.
- Ghi lại Console logs (Ctrl+Shift+J) nếu có lỗi JS.
- Nếu liên quan đến bản đồ/routing, note trạng thái kết nối Internet và permission geolocation.

Mẹo cho dev: khi nhận bug, cố gắng chạy lại bằng `npm run dev` hoặc `python -m http.server 8000` và chụp lại console/network HAR nếu cần.
