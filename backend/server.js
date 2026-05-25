require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Bắt các lỗi sập Server đột ngột để in ra log chi tiết (Tránh bị ẩn lỗi)
process.on('uncaughtException', (err) => {
  console.error('\n🔥 LỖI NGHIÊM TRỌNG LÀM SẬP SERVER:', err.message);
  console.error(err.stack, '\n');
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Sẽ thu hẹp lại khi triển khai production
    methods: ['GET', 'POST']
  }
});

// Gắn Socket.io vào Express App để có thể gọi từ bất kỳ Controller nào
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Khai báo Routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Khai báo Route Bookings
const bookingRoutes = require('./src/routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Khai báo Route Services
const serviceRoutes = require('./src/routes/serviceRoutes');
app.use('/api/services', serviceRoutes);

// Khai báo Route Kỹ thuật viên
const techRoutes = require('./src/routes/techRoutes');
app.use('/api/tech', techRoutes);

// API Route kiểm tra health
app.get('/', (req, res) => {
  res.send('OnliFix API Server is running...');
});

// Khởi tạo Socket.io để chuẩn bị cho Tracking định vị Thợ
io.on('connection', (socket) => {
  console.log('Một client đã kết nối (Socket):', socket.id);

  // 1. Thợ hoặc Khách tham gia vào phòng (room) tracking của đơn hàng
  socket.on('join_tracking', (orderId) => {
    socket.join(`tracking_${orderId}`);
  });

  // 2. Nhận tọa độ GPS từ Thợ và phát (broadcast) cho Khách hàng
  socket.on('tech_location_update', (data) => {
    io.to(`tracking_${data.orderId}`).emit('tech_location_changed', { lat: data.lat, lng: data.lng });
  });

  socket.on('disconnect', () => console.log('Client ngắt kết nối:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy trên cổng ${PORT} và chấp nhận kết nối LAN (0.0.0.0)`);
});