const pool = require('../config/db');

// ============ WAREHOUSE MANAGEMENT ============

// @route   GET /api/parts/warehouses/search
// @desc    Tìm kho linh kiện gần nhất trong bán kính (VD: 50km)
// @access  Private
const searchNearbyWarehouses = async (req, res) => {
  const { longitude, latitude, radius_km = 50 } = req.query;

  if (!longitude || !latitude) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tọa độ GPS' });
  }

  try {
    // Sử dụng PostGIS để tính toán khoảng cách giữa điểm hiện tại và các kho
    const warehouses = await pool.query(
      `SELECT 
        w.id, w.name, w.address, w.phone_number, w.email, w.rating, w.total_rentals,
        ST_Distance(w.warehouse_location, ST_Point($1, $2)::geography) / 1000 as distance_km,
        COUNT(pi.part_id) as total_parts_available
      FROM parts_warehouses w
      LEFT JOIN parts_inventory pi ON w.id = pi.warehouse_id AND pi.quantity_available > 0
      WHERE ST_Distance(w.warehouse_location, ST_Point($1, $2)::geography) <= $3 * 1000
        AND w.is_active = TRUE
      GROUP BY w.id
      ORDER BY distance_km ASC`,
      [longitude, latitude, radius_km]
    );

    res.status(200).json({
      message: 'Tìm thấy kho linh kiện gần bạn',
      count: warehouses.rows.length,
      warehouses: warehouses.rows
    });
  } catch (error) {
    console.error('Lỗi tìm kho:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   GET /api/parts/warehouses/:id
// @desc    Lấy chi tiết kho linh kiện
// @access  Public
const getWarehouseDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const warehouse = await pool.query(
      `SELECT w.*, u.full_name as owner_name
       FROM parts_warehouses w
       LEFT JOIN users u ON w.owner_id = u.id
       WHERE w.id = $1`,
      [id]
    );

    if (warehouse.rows.length === 0) {
      return res.status(404).json({ message: 'Kho không tìm thấy' });
    }

    res.status(200).json({ warehouse: warehouse.rows[0] });
  } catch (error) {
    console.error('Lỗi lấy chi tiết kho:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   POST /api/parts/warehouses
// @desc    Tạo kho linh kiện mới (Admin/Owner)
// @access  Private
const createWarehouse = async (req, res) => {
  const { name, description, address, longitude, latitude, phone_number, email } = req.body;
  const owner_id = req.user.id;

  if (!name || !address || !longitude || !latitude) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
  }

  try {
    const newWarehouse = await pool.query(
      `INSERT INTO parts_warehouses (owner_id, name, description, address, warehouse_location, phone_number, email)
       VALUES ($1, $2, $3, $4, ST_Point($5, $6)::geography, $7, $8)
       RETURNING *`,
      [owner_id, name, description, address, longitude, latitude, phone_number, email]
    );

    res.status(201).json({
      message: 'Tạo kho linh kiện thành công',
      warehouse: newWarehouse.rows[0]
    });
  } catch (error) {
    console.error('Lỗi tạo kho:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// ============ PARTS MANAGEMENT ============

// @route   GET /api/parts/search
// @desc    Tìm linh kiện theo tiêu chí (danh mục, kho, tên, etc)
// @access  Public
const searchParts = async (req, res) => {
  const { warehouse_id, category, search_query, longitude, latitude, radius_km = 50 } = req.query;

  try {
    let query = `SELECT DISTINCT p.*, pi.quantity_available, pi.warehouse_id,
                  ST_Distance(w.warehouse_location, ST_Point($1, $2)::geography) / 1000 as distance_km
                  FROM parts p
                  JOIN parts_inventory pi ON p.id = pi.part_id
                  JOIN parts_warehouses w ON pi.warehouse_id = w.id
                  WHERE pi.quantity_available > 0 AND w.is_active = TRUE`;
    
    const params = [longitude || 105.8, latitude || 21.0];

    if (warehouse_id) {
      query += ` AND pi.warehouse_id = $${params.length + 1}`;
      params.push(warehouse_id);
    }

    if (category) {
      query += ` AND p.category = $${params.length + 1}`;
      params.push(category);
    }

    if (search_query) {
      query += ` AND (p.name ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`;
      params.push(`%${search_query}%`, `%${search_query}%`);
    }

    if (longitude && latitude) {
      query += ` AND ST_Distance(w.warehouse_location, ST_Point($${params.length - 1}, $${params.length})::geography) <= $${params.length + 1} * 1000`;
      params.push(radius_km);
    }

    query += ` ORDER BY distance_km ASC, p.name ASC`;

    const parts = await pool.query(query, params);

    res.status(200).json({
      message: 'Tìm thấy linh kiện',
      count: parts.rows.length,
      parts: parts.rows
    });
  } catch (error) {
    console.error('Lỗi tìm linh kiện:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   POST /api/parts
// @desc    Thêm loại linh kiện mới vào hệ thống
// @access  Private (Admin/Owner)
const createPart = async (req, res) => {
  const { name, category, description, brand, model, rental_price_per_day, rental_deposit, specifications } = req.body;

  if (!name || !category || !rental_price_per_day) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
  }

  try {
    const newPart = await pool.query(
      `INSERT INTO parts (name, category, description, brand, model, rental_price_per_day, rental_deposit, specifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, description, brand, model, rental_price_per_day, rental_deposit || 0, specifications]
    );

    res.status(201).json({
      message: 'Thêm linh kiện thành công',
      part: newPart.rows[0]
    });
  } catch (error) {
    console.error('Lỗi thêm linh kiện:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   POST /api/parts/inventory
// @desc    Thêm linh kiện vào kho (quản lý kho hàng)
// @access  Private (Warehouse Owner)
const addPartToInventory = async (req, res) => {
  const { warehouse_id, part_id, quantity, location_in_warehouse } = req.body;
  const owner_id = req.user.id;

  if (!warehouse_id || !part_id || !quantity) {
    return res.status(400).json({ message: 'Vui lòng cung cấp warehouse_id, part_id, quantity' });
  }

  try {
    // Kiểm tra người dùng có quyền quản lý kho này không
    const warehouseCheck = await pool.query(
      'SELECT id FROM parts_warehouses WHERE id = $1 AND owner_id = $2',
      [warehouse_id, owner_id]
    );

    if (warehouseCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý kho này' });
    }

    // Thêm hoặc cập nhật linh kiện trong kho
    const result = await pool.query(
      `INSERT INTO parts_inventory (warehouse_id, part_id, quantity_available, quantity_total, location_in_warehouse, condition)
       VALUES ($1, $2, $3, $3, $4, 'GOOD')
       ON CONFLICT (warehouse_id, part_id) 
       DO UPDATE SET 
         quantity_available = quantity_available + $3,
         quantity_total = quantity_total + $3,
         location_in_warehouse = COALESCE($4, location_in_warehouse),
         updated_at = NOW()
       RETURNING *`,
      [warehouse_id, part_id, quantity, location_in_warehouse]
    );

    res.status(201).json({
      message: 'Thêm linh kiện vào kho thành công',
      inventory: result.rows[0]
    });
  } catch (error) {
    console.error('Lỗi thêm linh kiện vào kho:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   GET /api/parts/warehouse/:warehouse_id/inventory
// @desc    Xem danh sách linh kiện trong kho
// @access  Public
const getWarehouseInventory = async (req, res) => {
  const { warehouse_id } = req.params;

  try {
    const inventory = await pool.query(
      `SELECT pi.id, pi.quantity_available, pi.quantity_total, pi.location_in_warehouse, pi.condition,
              pi.last_maintenance_at, p.name, p.category, p.brand, p.rental_price_per_day, p.rental_deposit
       FROM parts_inventory pi
       JOIN parts p ON pi.part_id = p.id
       WHERE pi.warehouse_id = $1
       ORDER BY p.name ASC`,
      [warehouse_id]
    );

    res.status(200).json({
      message: 'Danh sách linh kiện trong kho',
      inventory: inventory.rows
    });
  } catch (error) {
    console.error('Lỗi lấy kho hàng:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// ============ PARTS BOOKING/RENTAL ============

// @route   POST /api/parts/bookings
// @desc    Đặt cho thuê linh kiện
// @access  Private (Technician)
const createPartsBooking = async (req, res) => {
  const { part_id, warehouse_id, quantity, rental_start_date, rental_end_date, payment_method } = req.body;
  const technician_id = req.user.technicianId;

  if (!part_id || !warehouse_id || !quantity || !rental_start_date || !rental_end_date) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  try {
    // Kiểm tra tính hợp lệ của ngày
    const startDate = new Date(rental_start_date);
    const endDate = new Date(rental_end_date);
    if (startDate > endDate) {
      return res.status(400).json({ message: 'Ngày bắt đầu phải trước ngày kết thúc' });
    }

    const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Lấy thông tin linh kiện
    const partInfo = await pool.query(
      'SELECT rental_price_per_day, rental_deposit FROM parts WHERE id = $1',
      [part_id]
    );

    if (partInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Linh kiện không tìm thấy' });
    }

    const { rental_price_per_day, rental_deposit } = partInfo.rows[0];
    const totalRentalPrice = rental_price_per_day * rentalDays * quantity;
    const depositAmount = rental_deposit * quantity;

    // Kiểm tra số lượng có sẵn
    const inventoryCheck = await pool.query(
      'SELECT quantity_available FROM parts_inventory WHERE warehouse_id = $1 AND part_id = $2',
      [warehouse_id, part_id]
    );

    if (inventoryCheck.rows.length === 0 || inventoryCheck.rows[0].quantity_available < quantity) {
      return res.status(400).json({ message: 'Số lượng linh kiện không đủ' });
    }

    // Tạo booking
    const newBooking = await pool.query(
      `INSERT INTO parts_bookings 
       (technician_id, warehouse_id, part_id, quantity, rental_start_date, rental_end_date, 
        daily_price, total_rental_price, deposit_amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
       RETURNING *`,
      [technician_id, warehouse_id, part_id, quantity, rental_start_date, rental_end_date,
       rental_price_per_day, totalRentalPrice, depositAmount, payment_method || 'WALLET']
    );

    // Cập nhật số lượng có sẵn
    await pool.query(
      'UPDATE parts_inventory SET quantity_available = quantity_available - $1 WHERE warehouse_id = $2 AND part_id = $3',
      [quantity, warehouse_id, part_id]
    );

    res.status(201).json({
      message: 'Đặt cho thuê linh kiện thành công',
      booking: newBooking.rows[0],
      summary: {
        rentalDays,
        dailyPrice: rental_price_per_day,
        totalRentalPrice,
        depositAmount,
        totalAmount: totalRentalPrice + depositAmount
      }
    });
  } catch (error) {
    console.error('Lỗi tạo booking:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   GET /api/parts/bookings/:id
// @desc    Lấy chi tiết booking linh kiện
// @access  Private
const getPartsBookingDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await pool.query(
      `SELECT pb.*, p.name as part_name, p.category, w.name as warehouse_name, w.address as warehouse_address
       FROM parts_bookings pb
       JOIN parts p ON pb.part_id = p.id
       JOIN parts_warehouses w ON pb.warehouse_id = w.id
       WHERE pb.id = $1`,
      [id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking không tìm thấy' });
    }

    res.status(200).json({ booking: booking.rows[0] });
  } catch (error) {
    console.error('Lỗi lấy chi tiết booking:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   PUT /api/parts/bookings/:id/return
// @desc    Trả linh kiện
// @access  Private
const returnPartsBooking = async (req, res) => {
  const { id } = req.params;
  const { return_condition, damage_fee } = req.body;

  if (!return_condition) {
    return res.status(400).json({ message: 'Vui lòng chọn tình trạng linh kiện khi trả' });
  }

  try {
    // Lấy thông tin booking
    const booking = await pool.query(
      'SELECT * FROM parts_bookings WHERE id = $1',
      [id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking không tìm thấy' });
    }

    const bookingData = booking.rows[0];

    // Cập nhật status booking và trả hàng
    const updatedBooking = await pool.query(
      `UPDATE parts_bookings 
       SET is_returned = TRUE, return_condition = $1, return_date = NOW(), 
           damage_fee = $2, status = 'COMPLETED', updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [return_condition, damage_fee || 0, id]
    );

    // Cập nhật lại số lượng có sẵn
    await pool.query(
      'UPDATE parts_inventory SET quantity_available = quantity_available + $1 WHERE warehouse_id = $2 AND part_id = $3',
      [bookingData.quantity, bookingData.warehouse_id, bookingData.part_id]
    );

    res.status(200).json({
      message: 'Trả linh kiện thành công',
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    console.error('Lỗi trả linh kiện:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// @route   GET /api/parts/bookings/technician/:tech_id
// @desc    Xem lịch sử booking của thợ
// @access  Private
const getTechnicianPartBookings = async (req, res) => {
  const { tech_id } = req.params;

  try {
    const bookings = await pool.query(
      `SELECT pb.*, p.name as part_name, w.name as warehouse_name, w.address as warehouse_address
       FROM parts_bookings pb
       JOIN parts p ON pb.part_id = p.id
       JOIN parts_warehouses w ON pb.warehouse_id = w.id
       WHERE pb.technician_id = $1
       ORDER BY pb.created_at DESC`,
      [tech_id]
    );

    res.status(200).json({
      message: 'Danh sách booking linh kiện của thợ',
      bookings: bookings.rows
    });
  } catch (error) {
    console.error('Lỗi lấy booking:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

// ============ REVIEWS ============

// @route   POST /api/parts/warehouses/reviews
// @desc    Đánh giá kho linh kiện
// @access  Private
const reviewWarehouse = async (req, res) => {
  const { parts_booking_id, warehouse_id, rating, comment } = req.body;
  const technician_id = req.user.technicianId;

  if (!parts_booking_id || !warehouse_id || !rating) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
  }

  try {
    const review = await pool.query(
      `INSERT INTO warehouse_reviews (parts_booking_id, technician_id, warehouse_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parts_booking_id, technician_id, warehouse_id, rating, comment]
    );

    // Cập nhật điểm đánh giá trung bình của kho
    const avgRating = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM warehouse_reviews WHERE warehouse_id = $1`,
      [warehouse_id]
    );

    await pool.query(
      `UPDATE parts_warehouses 
       SET rating = $1, total_rentals = $2, updated_at = NOW()
       WHERE id = $3`,
      [avgRating.rows[0].avg_rating || 5, avgRating.rows[0].total_reviews, warehouse_id]
    );

    res.status(201).json({
      message: 'Đánh giá kho thành công',
      review: review.rows[0]
    });
  } catch (error) {
    console.error('Lỗi đánh giá:', error.message);
    res.status(500).json({ message: 'Lỗi Server: ' + error.message });
  }
};

module.exports = {
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
};
