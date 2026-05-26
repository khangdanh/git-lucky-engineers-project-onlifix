-- Bật extension PostGIS để hỗ trợ tính toán không gian (GPS)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Bảng Khách hàng (Users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Thợ sửa chữa (Technicians)
CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- Một user có thể đăng ký làm thợ
    rating DECIMAL(3, 2) DEFAULT 0.0, -- Điểm đánh giá (VD: 4.8)
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE, -- Trạng thái đang sẵn sàng nhận việc
    -- Sử dụng kiểu GEOGRAPHY của PostGIS để lưu kinh độ/vĩ độ (Point(longitude, latitude))
    current_location GEOGRAPHY(POINT, 4326), 
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00, -- Ví tiền (VND)
    identity_card VARCHAR(20) UNIQUE, -- CCCD để xác minh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Danh mục Dịch vụ (Services)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- VD: Vệ sinh máy lạnh, Sửa laptop
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL, -- Giá cước cơ bản
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Kỹ năng của thợ (Technician_Services) - Quan hệ n-n
CREATE TABLE technician_services (
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (technician_id, service_id)
);

-- 5. Bảng Yêu cầu/Đơn đặt hàng (Bookings)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id),
    technician_id INTEGER REFERENCES technicians(id), -- Có thể NULL lúc đầu nếu đang tìm thợ
    service_id INTEGER REFERENCES services(id),
    
    -- Vị trí của khách hàng khi đặt dịch vụ
    customer_location GEOGRAPHY(POINT, 4326) NOT NULL,
    customer_address TEXT NOT NULL, -- Địa chỉ chi tiết (VD: 123 Lê Lợi, Q1)
    
    -- Trạng thái đơn hàng: 'PENDING' (Đang tìm thợ), 'ACCEPTED' (Thợ đã nhận), 'ARRIVED' (Thợ đã đến), 'IN_PROGRESS' (Đang sửa), 'COMPLETED' (Hoàn thành), 'CANCELLED' (Đã hủy)
    status VARCHAR(20) DEFAULT 'PENDING',
    
    quoted_price DECIMAL(15, 2), -- Giá báo động (Dynamic Quotation)
    final_price DECIMAL(15, 2), -- Giá thanh toán cuối cùng
    payment_method VARCHAR(20) DEFAULT 'CASH', -- 'CASH', 'WALLET', 'VNpay'
    is_paid BOOLEAN DEFAULT FALSE,
    
    scheduled_at TIMESTAMP, -- Nếu là đặt lịch trước (Scheduled Booking)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Đánh giá (Reviews)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id),
    technician_id INTEGER REFERENCES technicians(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Thẻ Bảo Hành Điện Tử (E-Warranty)
CREATE TABLE warranties (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    warranty_code VARCHAR(50) UNIQUE NOT NULL, -- Mã bảo hành tra cứu
    terms TEXT, -- Điều kiện bảo hành
    expires_at TIMESTAMP NOT NULL, -- Ngày hết hạn
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Kho Linh Kiện (Parts Warehouses)
CREATE TABLE parts_warehouses (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Người quản lý kho
    name VARCHAR(150) NOT NULL, -- Tên kho (VD: Kho ABC)
    description TEXT,
    address VARCHAR(255) NOT NULL, -- Địa chỉ kho
    warehouse_location GEOGRAPHY(POINT, 4326) NOT NULL, -- Vị trí GPS của kho
    phone_number VARCHAR(20),
    email VARCHAR(100),
    rating DECIMAL(3, 2) DEFAULT 5.0, -- Đánh giá kho
    total_rentals INTEGER DEFAULT 0, -- Tổng số lần cho thuê
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bảng Linh Kiện/Công Cụ (Parts/Tools)
CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL, -- Tên linh kiện (VD: Máy khoan, Bộ tuya, v.v)
    category VARCHAR(100) NOT NULL, -- Danh mục (VD: Điện, Cơ khí, v.v)
    description TEXT,
    image_url VARCHAR(255),
    specifications TEXT, -- Thông số kỹ thuật chi tiết
    brand VARCHAR(100),
    model VARCHAR(100),
    rental_price_per_day DECIMAL(10, 2) NOT NULL, -- Giá cho thuê/ngày (VND)
    rental_deposit DECIMAL(10, 2) DEFAULT 0.00, -- Tiền đặt cọc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bảng Kho Linh Kiện - Danh sách Linh kiện (Parts Inventory)
CREATE TABLE parts_inventory (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES parts_warehouses(id) ON DELETE CASCADE,
    part_id INTEGER REFERENCES parts(id) ON DELETE CASCADE,
    quantity_available INTEGER DEFAULT 0, -- Số lượng có sẵn
    quantity_total INTEGER DEFAULT 0, -- Tổng số lượng
    location_in_warehouse VARCHAR(255), -- Vị trí trong kho (VD: Kệ A-12)
    condition VARCHAR(50) DEFAULT 'GOOD', -- Tình trạng: GOOD, FAIR, NEEDS_REPAIR
    last_maintenance_at TIMESTAMP, -- Lần bảo dưỡng gần nhất
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, part_id)
);

-- 11. Bảng Đơn Đặt Linh Kiện (Parts Rental Bookings)
CREATE TABLE parts_bookings (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER REFERENCES technicians(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES parts_warehouses(id),
    part_id INTEGER REFERENCES parts(id),
    
    -- Số lượng và thời gian
    quantity INTEGER NOT NULL DEFAULT 1,
    rental_start_date DATE NOT NULL, -- Ngày bắt đầu cho thuê
    rental_end_date DATE NOT NULL, -- Ngày kết thúc cho thuê
    
    -- Giá
    daily_price DECIMAL(10, 2) NOT NULL, -- Giá/ngày tại thời điểm đặt
    total_rental_price DECIMAL(15, 2) NOT NULL, -- Tổng giá cho thuê (chưa tính deposit)
    deposit_amount DECIMAL(10, 2) DEFAULT 0.00, -- Tiền đặt cọc
    
    -- Trạng thái: PENDING (Chờ xác nhận), ACTIVE (Đang cho thuê), COMPLETED (Hoàn thành), CANCELLED (Hủy)
    status VARCHAR(20) DEFAULT 'PENDING',
    
    -- Thanh toán
    payment_method VARCHAR(20) DEFAULT 'WALLET', -- 'WALLET', 'CASH', 'VNpay'
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Trả linh kiện
    is_returned BOOLEAN DEFAULT FALSE,
    return_condition VARCHAR(50), -- Tình trạng khi trả: GOOD, DAMAGED, LOST
    return_date TIMESTAMP,
    damage_fee DECIMAL(10, 2) DEFAULT 0.00, -- Phí hư hỏng (nếu có)
    
    notes TEXT, -- Ghi chú thêm
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Bảng Đánh Giá Kho Linh Kiện (Warehouse Reviews)
CREATE TABLE warehouse_reviews (
    id SERIAL PRIMARY KEY,
    parts_booking_id INTEGER UNIQUE REFERENCES parts_bookings(id) ON DELETE CASCADE,
    technician_id INTEGER REFERENCES technicians(id),
    warehouse_id INTEGER REFERENCES parts_warehouses(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index để tối ưu hóa truy vấn GIS tìm thợ gần nhất
CREATE INDEX idx_technicians_location ON technicians USING GIST (current_location);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Tạo Index để tối ưu hóa truy vấn tìm kho linh kiện gần nhất
CREATE INDEX idx_warehouses_location ON parts_warehouses USING GIST (warehouse_location);
CREATE INDEX idx_parts_inventory_warehouse ON parts_inventory(warehouse_id);
CREATE INDEX idx_parts_bookings_status ON parts_bookings(status);
CREATE INDEX idx_parts_bookings_technician ON parts_bookings(technician_id);
