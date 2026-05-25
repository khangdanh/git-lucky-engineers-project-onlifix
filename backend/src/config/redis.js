const { createClient } = require('redis');

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Đã kết nối thành công với Redis.'));

// Tự động kết nối
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Không thể kết nối Redis lúc khởi động:', error);
  }
})();

module.exports = redisClient;