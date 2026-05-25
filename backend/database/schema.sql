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

-- Tạo Index để tối ưu hóa truy vấn GIS tìm thợ gần nhất
CREATE INDEX idx_technicians_location ON technicians USING GIST (current_location);
CREATE INDEX idx_bookings_status ON bookings(status);
