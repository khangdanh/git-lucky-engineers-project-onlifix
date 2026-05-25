const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Hàm tự động thử lại kết nối
const connectWithRetry = () => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Lỗi kết nối cơ sở dữ liệu:', err.message);
      console.log('Đang thử kết nối lại sau 3 giây...');
      setTimeout(connectWithRetry, 3000); // Thử lại sau 3 giây
    } else {
      console.log('Đã kết nối thành công với cơ sở dữ liệu PostgreSQL (PostGIS).');
      release(); // Trả kết nối lại cho pool
    }
  });
};

connectWithRetry();

pool.on('error', (err) => {
  console.error('Lỗi kết nối cơ sở dữ liệu bất ngờ:', err.message);
});

module.exports = pool;