const pool = require('../config/db');

// @route   PUT /api/tech/profile
// @desc    Kỹ thuật viên cập nhật CCCD và Chuyên môn
// @access  Private (Chỉ Kỹ thuật viên)
const updateProfile = async (req, res) => {
  const { cccd, expertise } = req.body;
  const userId = req.user.id;

  if (!req.user.isTechnician) {
    return res.status(403).json({ message: 'Chỉ thợ sửa chữa mới được cập nhật hồ sơ.' });
  }

  try {
    const result = await pool.query(
      'UPDATE technicians SET cccd = $1, expertise = $2, is_active = TRUE WHERE user_id = $3 RETURNING id, is_active',
      [cccd, expertise, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu thợ trong hệ thống. Vui lòng đăng ký lại tài khoản Thợ.' });
    }

    res.status(200).json({ message: 'Cập nhật hồ sơ thành công!', profile: result.rows[0] });
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ thợ:', error.message);
    res.status(500).json({ message: 'Lỗi Database: ' + error.message });
  }
};

module.exports = { updateProfile };