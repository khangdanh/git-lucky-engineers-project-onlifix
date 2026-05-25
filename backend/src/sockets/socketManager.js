const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const initializeSockets = (io) => {
  // Middleware xác thực Socket.io
  io.use((socket, next) => {
    // Client có thể gửi token qua auth object: socket.auth.token
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Người dùng kết nối: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.isTechnician ? 'Thợ' : 'Khách'})`);

    // Lưu socket.id vào Redis để tiện gửi thông báo trực tiếp (nếu cần)
    const socketKey = `user:${socket.user.id}:socket`;
    redisClient.set(socketKey, socket.id, { EX: 86400 }); // Hết hạn sau 1 ngày

    // Lắng nghe sự kiện cập nhật vị trí từ Thợ
    socket.on('update_location', async (data) => {
      if (!socket.user.isTechnician) return; // Chỉ thợ mới được cập nhật vị trí lên bản đồ
      
      const { latitude, longitude } = data;
      if (!latitude || !longitude) return;

      const techId = socket.user.id; // Hoặc socket.user.technicianId nếu dùng ID bảng technicians
      
      try {
        // Sử dụng GEOADD của Redis để lưu tọa độ
        // Redis GEOADD format: GEOADD key longitude latitude member
        await redisClient.geoAdd('technician_locations', {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          member: techId.toString()
        });
        
        // Cũng có thể lưu thêm thời gian cập nhật cuối cùng
        await redisClient.hSet(`technician:${techId}:info`, 'last_updated', Date.now());
        await redisClient.expire(`technician:${techId}:info`, 300); // 5 phút không update -> offline
        
      } catch (error) {
        console.error('Lỗi khi cập nhật vị trí thợ lên Redis:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Người dùng ngắt kết nối: ${socket.id}`);
      
      // Xóa socket id
      await redisClient.del(socketKey);
      
      // Nếu là thợ ngắt kết nối, có thể xóa vị trí khỏi bản đồ (hoặc để TTL tự hết hạn)
      if (socket.user.isTechnician) {
        await redisClient.zRem('technician_locations', socket.user.id.toString());
      }
    });
  });
};

module.exports = { initializeSockets };