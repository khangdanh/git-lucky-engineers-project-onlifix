const express = require('express');
const router = express.Router();
const { createBooking, sendQuote, respondToQuote, completeBooking, getTechCurrentOrder } = require('../controllers/bookingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// POST /api/bookings - Gọi hàm verifyToken trước khi gọi hàm createBooking
router.post('/', verifyToken, createBooking);

// PUT /api/bookings/:id/quote - Thợ gửi báo giá
router.put('/:id/quote', verifyToken, sendQuote);

// PUT /api/bookings/:id/respond - Khách hàng duyệt/từ chối báo giá
router.put('/:id/respond', verifyToken, respondToQuote);

// POST /api/bookings/:id/complete - Khách hàng thanh toán và đánh giá
router.post('/:id/complete', verifyToken, completeBooking);

// GET /api/bookings/tech/current - Lấy đơn hàng hiện tại cho thợ
router.get('/tech/current', verifyToken, getTechCurrentOrder);

module.exports = router;