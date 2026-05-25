# OnliFix Product Vision and Team Operating Agreement

## 1. Tổng quan dự án (Project Vision)
OnliFix là nền tảng O2O (Online-to-Offline) hoạt động như 'Grab dành cho sửa chữa điện tử'. Nó kết nối những khách hàng có thiết bị điện tử hỏng hóc với các thợ sửa chữa tự do uy tín và bản đồ các cửa hàng linh kiện xung quanh.

## 2. Chân dung người dùng cốt lõi (Personas)
*   **Khách hàng (Ví dụ: Thuận):** Cần sửa chữa khẩn cấp tận nơi, yêu cầu minh bạch giá cả (tránh bị hét giá), theo dõi vị trí thợ real-time và cần quản lý thẻ Bảo hành điện tử (E-Warranty).
*   **Thợ sửa chữa (Ví dụ: Trần Hoàng Nam):** Cần nguồn khách ổn định, ứng dụng tối ưu hóa tuyến đường di chuyển, quản lý doanh thu ví điện tử và được bảo vệ khỏi rủi ro khách 'bùng' đơn.

## 3. Các luồng nghiệp vụ chính (Core Scenarios)
*   **Sửa khẩn cấp:** Thuật toán matching GPS tìm thợ gần nhất, báo giá động (Dynamic Quotation) bắt buộc khách duyệt trước khi sửa.
*   **Đặt lịch trước (Scheduled Booking):** Chọn số lượng thiết bị (ví dụ vệ sinh 2 máy lạnh) và hỗ trợ bán chéo (upsell) dịch vụ phát sinh.
*   **Thanh toán & Đánh giá:** Thanh toán không tiền mặt, cấp bảo hành điện tử và đánh giá sao cho thợ.

## 4. Tiến độ hiện tại & Tech Stack
*   **Frontend:** Đã hoàn thiện bằng HTML/CSS/JS thuần, thiết kế Mobile-first dạng thẻ (Card-based UI), màu chủ đạo là Xanh dương (`#00a0e9`).
*   **Backend:** Đang xây dựng.
    *   Node.js (Express)
    *   Cơ sở dữ liệu PostgreSQL tích hợp PostGIS (để tính toán vị trí không gian)
    *   Redis (cache trạng thái thợ)
    *   Socket.io (để xử lý realtime GPS và chat)
    *   Được đóng gói bằng Docker.
*   **Yêu cầu phi chức năng (NFR):** Hệ thống phải matching thợ dưới 10 giây và cập nhật GPS với độ trễ ≤ 5 giây.

## 5. Ràng buộc quan trọng (CRITICAL CONSTRAINT)
*   Cấu trúc và logic có thể viết bằng tiếng Anh.
*   **TOÀN BỘ văn bản hiển thị cho người dùng trên giao diện (UI text, buttons, labels, dummy data) BẮT BUỘC phải là Tiếng Việt.**
