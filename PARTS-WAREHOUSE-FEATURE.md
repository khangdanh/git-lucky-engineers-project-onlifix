# 🔧 Tính Năng Kho Linh Kiện (Parts Warehouse) - OnliFix

## Tổng Quan
Tính năng kho linh kiện cho phép thợ sửa chữa tìm kiếm và cho thuê công cụ chuyên biệt trong bán kính hiện tại. Điều này giúp thợ có thể chấp nhận những công việc phức tạp mà không cần phải đầu tư vốn lớn để mua sắm thiết bị đắt tiền.

## Kiến Trúc Hệ Thống

### 1. Database Schema
Đã thêm 5 bảng mới:
- **parts_warehouses**: Lưu thông tin kho linh kiện
- **parts**: Lưu danh sách loại linh kiện/công cụ
- **parts_inventory**: Quản lý kho hàng của từng kho
- **parts_bookings**: Quản lý đơn cho thuê linh kiện
- **warehouse_reviews**: Đánh giá kho linh kiện

### 2. Backend API Endpoints

#### Quản Lý Kho (Warehouse)
```
GET    /api/parts/warehouses/search              - Tìm kho gần nhất
GET    /api/parts/warehouses/:id                 - Lấy chi tiết kho
POST   /api/parts/warehouses                     - Tạo kho mới
```

#### Quản Lý Linh Kiện (Parts)
```
GET    /api/parts/search                         - Tìm linh kiện
POST   /api/parts                                - Thêm loại linh kiện
POST   /api/parts/inventory                      - Thêm linh kiện vào kho
GET    /api/parts/warehouse/:id/inventory        - Xem kho hàng
```

#### Đặt Cho Thuê (Bookings)
```
POST   /api/parts/bookings                       - Đặt cho thuê linh kiện
GET    /api/parts/bookings/:id                   - Lấy chi tiết booking
PUT    /api/parts/bookings/:id/return            - Trả linh kiện
GET    /api/parts/bookings/technician/:id        - Xem lịch sử của thợ
```

#### Đánh Giá
```
POST   /api/parts/warehouses/reviews             - Đánh giá kho
```

### 3. Frontend Pages

#### 📄 parts-search.html
**Trang tìm kiếm linh kiện cho thợ sửa chữa**
- Hiển thị các kho gần nhất theo vị trí GPS
- Tìm kiếm linh kiện theo tên, danh mục, bán kính
- Xem chi tiết kho linh kiện
- Đặt cho thuê linh kiện với tính toán giá động

**Tính năng chính:**
- 📍 Tìm kiếm kho theo bán kính (mặc định 50km)
- 🔍 Tìm kiếm linh kiện theo từ khóa
- 🏷️ Lọc theo danh mục
- 💰 Tính giá tự động dựa trên ngày thuê
- ⭐ Xem đánh giá kho
- 📱 Responsive design

#### 📄 warehouse-management.html
**Trang quản lý kho cho chủ kho**
- Quản lý thông tin kho
- Thêm/quản lý linh kiện trong kho
- Xem đơn cho thuê
- Thống kê doanh thu

**Tính năng chính:**
- 🏢 Tạo và quản lý kho linh kiện
- 📦 Quản lý danh sách linh kiện
- 📅 Xem đơn cho thuê
- 📊 Thống kê doanh thu, đánh giá

## Quy Trình Sử Dụng

### 🔧 Cho Thợ Sửa Chữa (Technician)

1. **Tìm kiếm linh kiện**
   ```
   GET /api/parts/search?longitude=105.8&latitude=21.0&radius_km=50
   ```

2. **Xem chi tiết kho**
   ```
   GET /api/parts/warehouses/123
   ```

3. **Đặt cho thuê linh kiện**
   ```
   POST /api/parts/bookings
   {
     "part_id": 1,
     "warehouse_id": 1,
     "quantity": 1,
     "rental_start_date": "2024-01-20",
     "rental_end_date": "2024-01-25",
     "payment_method": "WALLET"
   }
   ```

4. **Trả linh kiện**
   ```
   PUT /api/parts/bookings/1/return
   {
     "return_condition": "GOOD",
     "damage_fee": 0
   }
   ```

5. **Đánh giá kho**
   ```
   POST /api/parts/warehouses/reviews
   {
     "parts_booking_id": 1,
     "warehouse_id": 1,
     "rating": 5,
     "comment": "Kho sạch sẽ, nhân viên thân thiện"
   }
   ```

### 🏢 Cho Chủ Kho (Warehouse Owner)

1. **Tạo kho mới**
   ```
   POST /api/parts/warehouses
   {
     "name": "Kho ABC",
     "address": "123 Lê Lợi, Q1, TP.HCM",
     "longitude": 105.8,
     "latitude": 21.0,
     "phone_number": "0123456789",
     "email": "kho@example.com"
   }
   ```

2. **Thêm loại linh kiện**
   ```
   POST /api/parts
   {
     "name": "Máy khoan Bosch",
     "category": "Cơ khí",
     "brand": "Bosch",
     "rental_price_per_day": 150000,
     "rental_deposit": 500000
   }
   ```

3. **Thêm linh kiện vào kho**
   ```
   POST /api/parts/inventory
   {
     "warehouse_id": 1,
     "part_id": 1,
     "quantity": 3,
     "location_in_warehouse": "Kệ A-5"
   }
   ```

## Danh Mục Linh Kiện (Categories)
- **Điện**: Khoan, mài, máy khoan vặn, v.v
- **Cơ khí**: Bộ tuya, kìm, cờ lê, v.v
- **Lạnh**: Bộ chân không, manometer, v.v
- **Nước**: Ống, nước, thiết bị đo, v.v
- **Khác**: Các linh kiện khác

## Tính Năng Chi Tiết

### 🔍 Tìm Kiếm Thông Minh
- Sử dụng PostGIS để tính toán khoảng cách
- Tìm kiếm FULL-TEXT cho linh kiện
- Lọc theo danh mục, kho, bán kính

### 💰 Định Giá Động
- Tính giá tự động dựa vào:
  - Giá thuê/ngày
  - Số ngày thuê
  - Số lượng
  - Tiền đặt cọc

### ⭐ Hệ Thống Đánh Giá
- Thợ đánh giá kho sau khi trả hàng
- Điểm đánh giá từ 1-5 sao
- Nhận xét bằng lời

### 📊 Thống Kê & Báo Cáo
- Tổng số lần cho thuê
- Doanh thu từ cho thuê
- Đánh giá trung bình
- Tỷ lệ hoàn thành

### 🎨 Giao Diện Người Dùng
- Responsive design cho mobile/tablet/desktop
- Modal popup cho đặt cho thuê
- Real-time price calculation
- Loading states

## Cấu Trúc File

```
backend/
├── database/
│   └── schema.sql (cập nhật với 5 bảng mới)
├── src/
│   ├── controllers/
│   │   └── partsController.js (mới)
│   ├── routes/
│   │   └── partsRoutes.js (mới)
│   └── server.js (cập nhật)

frontend/
├── html/
│   ├── parts-search.html (mới)
│   └── warehouse-management.html (mới)
├── css/
│   ├── parts-search.css (mới)
│   └── warehouse-management.css (mới)
└── js/
    ├── parts-search.js (mới)
    └── warehouse-management.js (mới)
```

## Cách Sử Dụng API

### 1. Tìm Kho Gần Nhất
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/parts/warehouses/search?longitude=105.8&latitude=21.0&radius_km=50"
```

### 2. Tìm Linh Kiện
```bash
curl "http://localhost:5000/api/parts/search?longitude=105.8&latitude=21.0&search_query=khoan&category=Cơ khí"
```

### 3. Đặt Cho Thuê
```bash
curl -X POST http://localhost:5000/api/parts/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "part_id": 1,
    "warehouse_id": 1,
    "quantity": 1,
    "rental_start_date": "2024-01-20",
    "rental_end_date": "2024-01-25",
    "payment_method": "WALLET"
  }'
```

## Hướng Dẫn Cài Đặt

### 1. Cập Nhật Database
```bash
# Kết nối PostgreSQL và chạy schema.sql
psql -U your_user -d your_db -f backend/database/schema.sql
```

### 2. Cập Nhật Backend
```bash
# File server.js đã được cập nhật với route mới
cd backend
npm install  # nếu cần thêm gói
npm run dev
```

### 3. Truy Cập Frontend
```
http://localhost:3000/html/parts-search.html       (cho thợ)
http://localhost:3000/html/warehouse-management.html (cho chủ kho)
```

## Tính Năng Nâng Cao (Optional)

### Có thể thêm trong tương lai:
- [ ] Hệ thống đặt trước (pre-booking)
- [ ] Gợi ý linh kiện dựa trên AI
- [ ] Bảo hiểm linh kiện
- [ ] Hệ thống thanh toán linh hoạt
- [ ] Tracking vị trí linh kiện
- [ ] Tích hợp với hóa đơn điện tử
- [ ] Mobile app cho iOS/Android

## Xử Lý Lỗi Phổ Biến

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|----------|
| "Vui lòng cung cấp tọa độ GPS" | Thiếu longitude/latitude | Kiểm tra gps parameters |
| "Số lượng linh kiện không đủ" | Kho không còn hàng | Chọn kho khác hoặc giảm số lượng |
| "Bạn không có quyền quản lý kho này" | Owner ID không khớp | Đăng nhập bằng tài khoản chủ kho |
| "Lỗi Database" | PostGIS chưa cài | Chạy `CREATE EXTENSION postgis;` |

## Support & Contact
- Email: support@onlifix.com
- Phone: 0XXX-XXX-XXX
- Website: www.onlifix.com

## Version
- v1.0.0 - Initial release (Jan 2024)

---

**Cập nhật: 26/5/2024**
