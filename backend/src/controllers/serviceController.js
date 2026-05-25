const pool = require('../config/db');

// @route   GET /api/services
// @desc    Lấy danh sách tất cả dịch vụ để hiển thị lên App
// @access  Public
const getServices = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description, base_price FROM services ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách dịch vụ:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách dịch vụ.' });
  }
};

module.exports = { getServices };