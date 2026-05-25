const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

// @route   POST /api/auth/register
// @desc    Đăng ký người dùng mới (Khách hàng)
// @access  Public
const registerUser = async (req, res) => {
  const { full_name, phone_number, email, password, role } = req.body;

  // Chuyển email rỗng thành null để không vi phạm ràng buộc UNIQUE của Database
  const validEmail = (email && email.trim() !== '') ? email : null;

  try {
    // 1. Kiểm tra xem số điện thoại hoặc email đã tồn tại chưa
    const userExists = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1 OR email = $2',
      [phone_number, validEmail]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Số điện thoại hoặc Email đã được sử dụng.' });
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Lưu vào Database
    const newUser = await pool.query(
      'INSERT INTO users (full_name, phone_number, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, full_name, phone_number, email',
      [full_name, phone_number, validEmail, password_hash]
    );

    // 4. Nếu người dùng chọn vai trò là thợ, tạo thêm bản ghi trong bảng technicians
    if (role === 'technician') {
      await pool.query('INSERT INTO technicians (user_id) VALUES ($1)', [newUser.rows[0].id]);
    }

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

// @route   POST /api/auth/login
// @desc    Đăng nhập & Trả về Token
// @access  Public
const loginUser = async (req, res) => {
  const { phone_number, password, role } = req.body;

  try {
    // 1. Tìm user bằng số điện thoại
    const userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    const user = userResult.rows[0];

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    // 3. Kiểm tra xem user này có phải là Thợ không
    const techResult = await pool.query('SELECT id, is_active FROM technicians WHERE user_id = $1', [user.id]);
    const isTechnician = techResult.rows.length > 0;
    const technicianId = isTechnician ? techResult.rows[0].id : null;

    // 4. Kiểm tra sự trùng khớp giữa vai trò khách chọn và dữ liệu thực tế
    if (role === 'technician' && !isTechnician) {
      return res.status(401).json({ message: 'Tài khoản này chưa được đăng ký làm Thợ sửa chữa.' });
    }

    if (role === 'customer' && isTechnician) {
      return res.status(401).json({ message: 'Đây là tài khoản Thợ sửa chữa. Vui lòng chọn đúng vai trò để đăng nhập.' });
    }

    // 4. Tạo JWT Token
    const payload = {
      user: {
        id: user.id,
        isTechnician: isTechnician,
        technicianId: technicianId
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // Token có hạn 7 ngày
      (err, token) => {
        if (err) throw err;
        res.json({
          message: 'Đăng nhập thành công!',
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            phone_number: user.phone_number,
            isTechnician: isTechnician
          }
        });
      }
    );
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Yêu cầu reset mật khẩu
// @access  Public
const forgotPassword = async (req, res) => {
  const { phone_number } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    if (userResult.rows.length === 0) {
      // Vẫn trả về 200 để tránh kẻ xấu dò tìm SĐT người dùng
      return res.status(200).json({ message: 'Nếu số điện thoại tồn tại trong hệ thống, một mã khôi phục đã được gửi.' });
    }

    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash token trước khi lưu vào DB để tăng bảo mật
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // Đặt thời gian hết hạn (10 phút)
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE phone_number = $3',
      [passwordResetToken, passwordResetExpires, phone_number]
    );

    // *** LƯU Ý QUAN TRỌNG CHO MÔI TRƯỜNG DEV ***
    // Ngoài đời thực, bạn sẽ gửi `resetToken` này qua Email/SMS.
    // Để demo, chúng ta sẽ trả thẳng token về cho Frontend.
    res.status(200).json({ 
      message: 'Yêu cầu thành công. Vui lòng kiểm tra "Hộp thư" để lấy mã.',
      resetToken: resetToken // Chỉ trả về trong môi trường dev để test
    });

  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

// @route   POST /api/auth/reset-password
// @desc    Đặt lại mật khẩu bằng token
// @access  Public
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    // Hash token nhận được từ client để so sánh với token trong DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const userResult = await pool.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Mã khôi phục không hợp lệ hoặc đã hết hạn.' });
    }

    const user = userResult.rows[0];
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await pool.query('UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [password_hash, user.id]);

    res.status(200).json({ message: 'Mật khẩu đã được cập nhật thành công!' });
  } catch (error) {
    console.error('Lỗi reset mật khẩu:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
};
