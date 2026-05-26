const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Trong môi trường production, chúng ta sẽ cần thay đổi origin cho an toàn
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/parts', require('./routes/partsRoutes'));

// Basic Route để kiểm tra server hoạt động
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Chào mừng đến với API Backend của OnliFix!'
  });
});

// Thiết lập Socket.io
io.on('connection', (socket) => {
  console.log(`Một người dùng đã kết nối: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Máy chủ đang chạy tại cổng: ${PORT}`);
});
