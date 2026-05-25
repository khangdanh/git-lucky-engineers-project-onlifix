const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/techController');
const { verifyToken } = require('../middlewares/authMiddleware');

// PUT /api/tech/profile
router.put('/profile', verifyToken, updateProfile);

module.exports = router;