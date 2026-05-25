const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

// Đăng ký
router.post('/register', registerUser);

// Đăng nhập
router.post('/login', loginUser);

// Quên mật khẩu
router.post('/forgot-password', forgotPassword);

// Đặt lại mật khẩu
router.post('/reset-password', resetPassword);

module.exports = router;