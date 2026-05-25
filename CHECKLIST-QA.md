# CHECKLIST QA — OnliFix

Tệp này là danh sách kiểm thử (QA) để kiểm tra nhanh và có hệ thống giao diện OnliFix.

## 1. Chuẩn bị môi trường
- Khởi động server tĩnh từ thư mục gốc dự án:

  Python:
  ```bash
  cd "e:/CSW 303/Project/ProjectOnliFix/frontend"
  python -m http.server 8000
  # Mở http://localhost:8000/html/webpage.html
  ```

  Hoặc dùng npm script (không cần cài global):
  ```bash
  npm run dev
  # Mở http://localhost:8000/html/webpage.html
  ```

- Mở trang bằng Chrome/Edge/Firefox; bật DevTools khi cần.
- Kiểm tra rằng `js/script_webpage.js` được load trên trang và `#toast` tồn tại.

## 2. Smoke tests (kiểm tra nhanh)
- Trang chính `html/webpage.html` tải không lỗi (Console trống các lỗi JS nghiêm trọng).
- Menu trên header hiện đúng; nút mobile toggle mở/đóng menu.
- `skip-link` (Bỏ qua điều hướng) có mặt và focus tới `#main-content` khi kích.
- Click vào các link chính (Tìm thợ, Đặt lịch, Bản đồ, Tài khoản, Đăng nhập) chuyển trang đúng.
- Toast thông báo hiển thị khi thực hiện hành động thử (ví dụ bấm nút đặt lịch giả lập).
- Confirm modal (`showConfirm`) hiện khi hành động cần xác nhận (ví dụ huỷ đơn), thử `Tab`/`Shift+Tab` và `Escape`.

## 3. Kiểm thử chức năng (chi tiết)
- Tìm thợ (`webpage.html`):
  - Chọn danh mục từ grid (click thẻ) -> `device-select` cập nhật và scroll lên vị trí tìm kiếm.
  - Không được chọn thiết bị -> bấm `Tìm thợ` hiển thị toast lỗi.
  - Chọn thiết bị -> bấm `Tìm thợ` chuyển sang `search-results.html?category=...`.

- Đăng nhập/Đăng ký (`login.html`):
  - Form submit -> toast mô phỏng "Đang xác thực...", sau 1s redirect.
  - Nút social: label tiếng Việt hiển thị.

- Đặt lịch (booking flow):
  - Tạo đặt lịch giả -> hiển thị toast thành công.
  - Kiểm tra trạng thái loading trên nút khi submit.

- Quotation / Approve & Reject (`quote.html`):
  - Duyệt hiển thị modal thành công.
  - Từ chối: modal reject, nhập lý do, toast thông báo kết quả.

- Tracking & Map (`tracking.html`):
  - Bản đồ tải tiles (Internet required).
  - Nếu geolocation được chấp nhận, marker khách hàng đặt đúng; nếu không, fallback vị trí mặc định.
  - Routing: khi OSRM trả route, ETA và khoảng cách hiển thị; khi routing lỗi, fallback straight-line estimation.
  - Nút `Gọi` và `Chat` hiển thị toast thông báo (không blocking).
  - Nút `Hủy` gọi `showConfirm`; khi xác nhận -> toast + redirect.
  - Theo dõi chuyển động nhân viên (simulate) cập nhật vị trí marker.

- Admin (`admin.html`):
  - Bảng chờ duyệt hiển thị danh sách giả lập.
  - Bấm `Duyệt` gọi modal xác nhận; khi xác nhận, bản ghi bị remove và toast success.
  - Bấm `Từ chối` yêu cầu nhập lý do (prompt) — hiện tại dùng prompt; optional: chuyển sang modal input.
  - Biểu đồ Chart.js hiển thị và tooltip định dạng VNĐ.

## 4. Accessibility (ARIA + keyboard)
- Dùng Tab để duyệt toàn bộ header → nội dung chính → footer; focus rõ ràng (outline visible).
- `skip-link` hoạt động với bàn phím.
- Menu mobile: `aria-expanded` của `.mobile-nav-toggle` cập nhật khi mở/đóng.
- Confirm modal: focus trap hoạt động (Tab/Shift+Tab không thoát modal), `Escape` tương đương Hủy.
- Toast: có `role="status"` và `aria-live="polite"` — kiểm tra screen reader behaviour nếu có thể.
- Kiểm tra màu chữ vs nền (contrast) trên các nút chính; nếu không đạt, đề xuất điều chỉnh CSS variables.
- Chạy Lighthouse → Accessibility score; ghi lại issues (contrast, labels, landmarks).

## 5. Responsive & Visual
- Kiểm tra breakpoints phổ biến bằng DevTools: 360×780, 412×915, 768×1024, 1024×1366.
- Kiểm tra:
  - Header / logo / nav trên mobile: logo, toggle hiển thị, nav link có khoảng cách tap đủ lớn.
  - Các card trong `category-grid` responsive: 1-column mobile, 2-3 columns tablet/desktop.
  - Hero image: không che nội dung chính trên mobile.
  - Modal và toast kích thước phù hợp trên điện thoại.

## 6. Performance & Network
- Mở Network tab: kiểm tra requests 404, tile fetch failures, OSRM requests. Ghi lại nếu router.project-osrm.org bị rate-limited.
- Chạy Lighthouse Performance audit (1 run mobile, 1 run desktop); ghi lỗi chính.
- Kiểm tra `prefers-reduced-motion` behavior: bật reduce motion → animations/transition tắt.

## 7. Security & Privacy (cơ bản)
- Không log thông tin nhạy cảm vào console (như token, full phone number) trong production.
- Kiểm tra forms: không gửi dữ liệu thật lên server (ứng dụng hiện là tĩnh), đảm bảo không leak keys.

## 8. Regression / Bug Reporting (mẫu nhanh)
- Title: trang / thành phần - mô tả ngắn
- Môi trường: OS, trình duyệt + phiên bản, URL local
- Steps to reproduce: 1,2,3
- Kết quả hiện tại: mô tả
- Kết quả mong đợi: mô tả
- Screenshot / console log / network HAR (nếu có)

Ví dụ:
- Title: `tracking.html` — routing không hiển thị
- Env: Windows 10, Chrome 114, http://localhost:8000/html/tracking.html
- Steps: Mở trang -> Allow Geolocation -> console shows 403 on OSRM
- Actual: không có route, fallback straight-line used
- Expected: show driving route; nếu OSRM blocked thì hiển thị message thông báo rõ ràng

## 9. Acceptance criteria (cho release)
- Tất cả smoke tests pass.
- Không có JS error nghiêm trọng trong console.
- Menu, skip-link, toast, confirm modal hoạt động với bàn phím.
- Map + routing hoạt động hoặc cung cấp fallback rõ ràng.
- Responsive: các trang chính đọc được và điều hướng dễ dàng trên mobile.

## 10. Next steps nếu QA OK
- Tạo nhánh `release/frontend-v1` và commit các file đã sửa.
- Tạo PR + checklist QA attach (link đến `CHECKLIST-QA.md`).
- Optionally: deploy lên Netlify/GitHub Pages để khách hàng review.

---
Nếu muốn, tôi có thể:
- Tự động chạy một lượt smoke tests thủ công (mở các URL theo lệnh và chụp console),
- Hoặc tạo file `QA-BUG_TEMPLATE.md` để dễ report cho team.
