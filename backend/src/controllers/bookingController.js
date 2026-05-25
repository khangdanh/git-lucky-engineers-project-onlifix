const pool = require('../config/db');

// @route   POST /api/bookings
// @desc    Tạo đơn đặt lịch mới (Khách hàng gọi thợ)
// @access  Private (Yêu cầu đăng nhập)
const createBooking = async (req, res) => {
  const { service_id, description, total_price, address, longitude, latitude, scheduled_at } = req.body;
  const customer_id = req.user.id;

  // Chặn không cho Thợ sửa chữa tự đi đặt lịch (để tránh lỗi nghiệp vụ)
  if (req.user.isTechnician) {
    return res.status(403).json({ message: 'Thợ sửa chữa không thể tự đặt dịch vụ.' });
  }

  try {
    // Lưu tọa độ GPS dạng số thực thông thường (tránh sập Database nếu chưa cài PostGIS)
    const newBooking = await pool.query(
      `INSERT INTO bookings (customer_id, service_id, description, total_price, longitude, latitude, customer_address, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING id, status, customer_address, created_at`,
      [customer_id, service_id, description, total_price, longitude, latitude, address, scheduled_at || null]
    );

    // 1. Lấy tên Khách hàng và tên Dịch vụ để gửi cho Thợ
    const detailRes = await pool.query(
      'SELECT u.full_name, s.name AS service_name FROM users u, services s WHERE u.id = $1 AND s.id = $2',
      [customer_id, service_id]
    );
    
    // 2. Lấy biến `io` đã setup ở server.js và bắn thông báo (emit)
    const io = req.app.get('io');
    if (io) {
      io.emit('new_booking', {
        booking_id: newBooking.rows[0].id,
        customer_name: detailRes.rows[0]?.full_name || 'Khách hàng',
        service_name: description || detailRes.rows[0]?.service_name || 'Sửa chữa',
        total_price: total_price,
        address: address
      });
    }

    res.status(201).json({ message: 'Tạo đơn đặt lịch thành công! Đang tìm thợ...', booking: newBooking.rows[0] });
  } catch (error) {
    console.error('Lỗi tạo booking:', error.message);
    res.status(500).json({ message: 'Lỗi Database: ' + error.message });
  }
};

// @route   PUT /api/bookings/:id/quote
// @desc    Thợ gửi báo giá cho khách hàng
// @access  Private (Chỉ thợ sửa chữa)
const sendQuote = async (req, res) => {
  const { id } = req.params;
  const { quoted_price } = req.body;

  if (!req.user.isTechnician) {
    return res.status(403).json({ message: 'Chỉ Kỹ thuật viên mới có quyền gửi báo giá.' });
  }

  try {
    const result = await pool.query(
      `UPDATE bookings SET quoted_price = $1, status = 'QUOTED', technician_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, quoted_price, status`,
      [quoted_price, req.user.technicianId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    // Bắn sự kiện Socket.io cho Khách hàng
    const io = req.app.get('io');
    if (io) {
      io.emit('receive_quote', result.rows[0]);
    }

    res.status(200).json({ message: 'Gửi báo giá thành công!', booking: result.rows[0] });
  } catch (error) {
    console.error('Lỗi gửi báo giá:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi báo giá.' });
  }
};

// @route   PUT /api/bookings/:id/respond
// @desc    Khách hàng phản hồi báo giá (Chấp nhận / Từ chối)
// @access  Private (Chỉ Khách hàng)
const respondToQuote = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // action: 'accept' hoặc 'reject'

  if (req.user.isTechnician) {
    return res.status(403).json({ message: 'Chỉ Khách hàng mới có quyền duyệt báo giá.' });
  }

  try {
    let newStatus = '';
    if (action === 'accept') newStatus = 'REPAIRING';
    else if (action === 'reject') newStatus = 'REJECTED';
    else return res.status(400).json({ message: 'Hành động không hợp lệ.' });

    const result = await pool.query(
      `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND customer_id = $3 RETURNING id, status, quoted_price`,
      [newStatus, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền.' });
    }

    // Bắn sự kiện Socket.io cho Thợ sửa chữa biết kết quả
    const io = req.app.get('io');
    if (io) io.emit('quote_response', result.rows[0]);

    res.status(200).json({ message: `Đã ${action === 'accept' ? 'chấp nhận' : 'từ chối'} báo giá.`, booking: result.rows[0] });
  } catch (error) {
    console.error('Lỗi phản hồi báo giá:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
};

// @route   POST /api/bookings/:id/complete
// @desc    Khách hàng thanh toán và đánh giá (Hoàn tất đơn)
// @access  Private (Chỉ Khách hàng)
const completeBooking = async (req, res) => {
  const { id } = req.params;
  const { payment_method, rating, comment } = req.body;
  const customer_id = req.user.id;

  if (req.user.isTechnician) {
    return res.status(403).json({ message: 'Chỉ Khách hàng mới có quyền thanh toán và đánh giá.' });
  }

  try {
    // 1. Cập nhật trạng thái đơn hàng thành COMPLETED và is_paid = TRUE
    const bookingRes = await pool.query(
      `UPDATE bookings 
       SET status = 'COMPLETED', is_paid = TRUE, payment_method = $1, final_price = quoted_price, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND customer_id = $3 RETURNING id, technician_id`,
      [payment_method || 'CASH', id, customer_id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }
    const tech_id = bookingRes.rows[0].technician_id;

    // 2. Lưu Đánh giá (Review) & Cập nhật sao trung bình cho thợ
    if (rating && tech_id) {
      await pool.query(`INSERT INTO reviews (booking_id, customer_id, technician_id, rating, comment) VALUES ($1, $2, $3, $4, $5)`, [id, customer_id, tech_id, rating, comment || '']);
      await pool.query(`UPDATE technicians SET rating = (SELECT AVG(rating) FROM reviews WHERE technician_id = $1), total_reviews = total_reviews + 1 WHERE id = $1`, [tech_id]);
    }

    // 3. Thông báo Real-time cho thợ
    const io = req.app.get('io');
    if (io) io.emit('booking_completed', { booking_id: id, rating, comment });

    res.status(200).json({ message: 'Thanh toán và Đánh giá thành công!' });
  } catch (error) {
    console.error('Lỗi thanh toán & đánh giá:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
};


// @route   GET /api/bookings/tech/current
// @desc    Lấy đơn hàng chờ nhận hoặc đang thực hiện của thợ
// @access  Private (Chỉ Kỹ thuật viên)
const getTechCurrentOrder = async (req, res) => {
  if (!req.user.isTechnician) {
    return res.status(403).json({ message: 'Chỉ thợ mới được xem.' });
  }
  try {
    // 1. Xem thợ có đơn nào đang làm dở không (QUOTED, REPAIRING)
    const activeRes = await pool.query(
      `SELECT b.id AS booking_id, u.full_name AS customer_name, b.description AS service_name, b.total_price, b.customer_address AS address, b.status 
       FROM bookings b JOIN users u ON b.customer_id = u.id 
       WHERE b.technician_id = $1 AND b.status IN ('QUOTED', 'REPAIRING') 
       ORDER BY b.updated_at DESC LIMIT 1`,
      [req.user.technicianId]
    );
    if (activeRes.rows.length > 0) return res.status(200).json({ type: 'ACTIVE', booking: activeRes.rows[0] });

    // 2. Tìm 1 đơn PENDING đang chờ thợ nhận
    const pendingRes = await pool.query(
      `SELECT b.id AS booking_id, u.full_name AS customer_name, b.description AS service_name, b.total_price, b.customer_address AS address 
       FROM bookings b JOIN users u ON b.customer_id = u.id 
       WHERE b.status = 'PENDING' 
       ORDER BY b.created_at ASC LIMIT 1`
    );
    if (pendingRes.rows.length > 0) return res.status(200).json({ type: 'PENDING', booking: pendingRes.rows[0] });

    res.status(200).json({ type: 'NONE', booking: null });
  } catch (error) {
    console.error('Lỗi lấy đơn thợ:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ.' });
  }
};

module.exports = { createBooking, sendQuote, respondToQuote, completeBooking, getTechCurrentOrder };