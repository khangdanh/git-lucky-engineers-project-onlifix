const express = require('express');
const router = express.Router();
const {
  // Warehouse
  searchNearbyWarehouses,
  getWarehouseDetails,
  createWarehouse,
  
  // Parts
  searchParts,
  createPart,
  addPartToInventory,
  getWarehouseInventory,
  
  // Bookings
  createPartsBooking,
  getPartsBookingDetails,
  returnPartsBooking,
  getTechnicianPartBookings,
  
  // Reviews
  reviewWarehouse
} = require('../controllers/partsController');

const { verifyToken } = require('../middlewares/authMiddleware');

// ============ WAREHOUSE ROUTES ============

// GET /api/parts/warehouses/search - Tìm kho linh kiện gần nhất
router.get('/warehouses/search', verifyToken, searchNearbyWarehouses);

// GET /api/parts/warehouses/:id - Lấy chi tiết kho
router.get('/warehouses/:id', getWarehouseDetails);

// POST /api/parts/warehouses - Tạo kho mới
router.post('/warehouses', verifyToken, createWarehouse);

// ============ PARTS ROUTES ============

// GET /api/parts/search - Tìm linh kiện
router.get('/search', searchParts);

// POST /api/parts - Thêm loại linh kiện mới
router.post('/', verifyToken, createPart);

// POST /api/parts/inventory - Thêm linh kiện vào kho
router.post('/inventory', verifyToken, addPartToInventory);

// GET /api/parts/warehouse/:warehouse_id/inventory - Xem danh sách linh kiện trong kho
router.get('/warehouse/:warehouse_id/inventory', getWarehouseInventory);

// ============ PARTS BOOKING ROUTES ============

// POST /api/parts/bookings - Đặt cho thuê linh kiện
router.post('/bookings', verifyToken, createPartsBooking);

// GET /api/parts/bookings/:id - Lấy chi tiết booking
router.get('/bookings/:id', verifyToken, getPartsBookingDetails);

// PUT /api/parts/bookings/:id/return - Trả linh kiện
router.put('/bookings/:id/return', verifyToken, returnPartsBooking);

// GET /api/parts/bookings/technician/:tech_id - Xem lịch sử booking của thợ
router.get('/bookings/technician/:tech_id', verifyToken, getTechnicianPartBookings);

// ============ REVIEW ROUTES ============

// POST /api/parts/warehouses/reviews - Đánh giá kho
router.post('/warehouses/reviews', verifyToken, reviewWarehouse);

module.exports = router;
