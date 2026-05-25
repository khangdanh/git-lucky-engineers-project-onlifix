# OnliFix — Hướng dẫn phát triển (DEV)

Tệp này chứa các bước nhanh để khởi động server tĩnh cục bộ và kiểm thử responsive cho giao diện OnliFix.

## Yêu cầu
- Python 3 (đã sẵn có trên hầu hết máy) hoặc Node.js + npm.
- Trình duyệt (Chrome/Edge/Firefox) với DevTools.

## 1) Chạy server tĩnh nhanh
Nếu bạn chỉ cần phục vụ file tĩnh (HTML/CSS/JS):

Python 3 (đơn giản, cross-platform):
```bash
cd "e:/CSW 303/Project/ProjectOnliFix/frontend"
python -m http.server 8000
# Mở http://localhost:8000/html/webpage.html
```

Node (nếu thích `http-server`):
```bash
npm install -g http-server
cd "e:/CSW 303/Project/ProjectOnliFix"
http-server -c-1 -p 8000
# Mở http://localhost:8000/html/webpage.html
```

Nội dung `package.json` đã được thêm để bạn có thể dùng npm script mà không cần cài global:

```bash
# Cài http-server tạm thời qua npx và chạy
npm run dev
# Mở http://localhost:8000/html/webpage.html
```

VS Code — Live Server extension: cài extension "Live Server", mở thư mục dự án, chuột phải vào `html/webpage.html` → "Open with Live Server".

## 2) Lưu ý khi kiểm thử bản đồ & routing
- Bản đồ sử dụng Leaflet và tile provider (OpenStreetMap) — cần kết nối Internet để tải tiles.
- Routing sử dụng OSRM public (`https://router.project-osrm.org`) — có thể bị giới hạn; khi router unreachable, ứng dụng sẽ fallback sang ước lượng thẳng.

## 3) Checklist kiểm thử responsive & UX (quick)
- Mở DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M): kiểm tra các width: 360, 412, 768, 1024.
- Kiểm tra menu mobile: bật/đóng menu, tab qua các liên kết, đảm bảo `aria-expanded` cập nhật.
- Kiểm tra `skip-link`: Tab vào trang, dùng `Bỏ qua điều hướng` để focus tới nội dung chính.
- Kiểm tra toast: thực hiện các hành động như đặt lịch/đăng nhập để thấy `#toast` xuất hiện.
- Kiểm tra confirm modal: kích "Hủy" trên tracking → modal xác nhận hiện, thử `Tab`/`Shift+Tab` và `Escape`.
- Kiểm tra bản đồ: định vị, route, fallback khi routing error.
- Kiểm tra keyboard-only navigation: sử dụng Tab để di chuyển, đảm bảo các nút có focus rõ ràng.

## 4) Kiểm thử truy cập & performance
- Chạy Lighthouse (DevTools → Lighthouse) để xem báo cáo về Performance / Accessibility / Best Practices.
- Kiểm tra `prefers-reduced-motion` bằng cách bật cài đặt hệ điều hành hoặc DevTools emulation.

## 5) Debug nhanh
- Console: mở DevTools Console để xem lỗi JS.
- Network: kiểm tra requests cho tiles, OSRM, hoặc file 404.

## 6) Ghi chú triển khai nhanh
- Dự án là static; có thể deploy lên GitHub Pages, Netlify, Vercel. Đảm bảo đường dẫn tĩnh đúng (khai báo `base` nếu cần).

---
Nếu bạn muốn, tôi có thể tiếp theo:
- Tạo script npm `dev` trong `package.json` để chạy server tiện lợi.
- Thêm file `CHECKLIST-QA.md` chi tiết từng bước kiểm thử.
