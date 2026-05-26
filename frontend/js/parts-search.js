// Parts Search Page JavaScript

const API_BASE_URL = 'http://localhost:5000/api/parts';
let currentLongitude = 105.8;
let currentLatitude = 21.0;
let selectedPart = null;
let selectedWarehouse = null;

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const searchQuery = document.getElementById('searchQuery');
const categoryFilter = document.getElementById('categoryFilter');
const radiusFilter = document.getElementById('radiusFilter');
const warehousesContainer = document.getElementById('warehousesContainer');
const partsContainer = document.getElementById('partsContainer');

const bookingModal = document.getElementById('bookingModal');
const warehouseModal = document.getElementById('warehouseModal');
const bookingForm = document.getElementById('bookingForm');

// Get user location
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLongitude = position.coords.longitude;
        currentLatitude = position.coords.latitude;
      },
      (error) => {
        console.error('Lỗi lấy vị trí:', error);
      }
    );
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  getUserLocation();
  setupEventListeners();
  displayWarehouses();
});

// Setup event listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', performSearch);
  
  // Close buttons for modals
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.add('hidden');
    });
  });

  // Booking form submit
  bookingForm.addEventListener('submit', submitBooking);

  // Date change listener for price calculation
  document.getElementById('rentalStartDate').addEventListener('change', calculatePrice);
  document.getElementById('rentalEndDate').addEventListener('change', calculatePrice);
  document.getElementById('quantity').addEventListener('change', calculatePrice);
}

// Search for nearby warehouses
async function displayWarehouses() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/warehouses/search?longitude=${currentLongitude}&latitude=${currentLatitude}&radius_km=${radiusFilter.value}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const data = await response.json();

    if (data.warehouses && data.warehouses.length > 0) {
      warehousesContainer.innerHTML = data.warehouses.map(warehouse => `
        <div class="warehouse-card">
          <div class="warehouse-header">
            <div class="warehouse-name">${warehouse.name}</div>
            <div class="warehouse-distance">📍 ${warehouse.distance_km.toFixed(1)} km</div>
          </div>
          <div class="warehouse-body">
            <div class="warehouse-info">
              <div class="info-row">
                <span class="info-label">Địa chỉ:</span>
                <span>${warehouse.address}</span>
              </div>
              <div class="info-row">
                <span class="info-label">SĐT:</span>
                <span>${warehouse.phone_number || 'N/A'}</span>
              </div>
              <div class="warehouse-rating">
                ${'⭐'.repeat(Math.round(warehouse.rating))} ${warehouse.rating}/5.0
              </div>
              <div class="info-row">
                <span class="info-label">Linh kiện:</span>
                <span>${warehouse.total_parts_available} loại</span>
              </div>
            </div>
            <div class="warehouse-actions">
              <button class="btn-secondary" onclick="showWarehouseDetail(${warehouse.id})">Chi tiết</button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      warehousesContainer.innerHTML = '<div class="loading">Không tìm thấy kho gần bạn</div>';
    }
  } catch (error) {
    console.error('Lỗi tải kho:', error);
    warehousesContainer.innerHTML = '<div class="loading">Lỗi khi tải dữ liệu</div>';
  }
}

// Perform search
async function performSearch() {
  const query = searchQuery.value;
  const category = categoryFilter.value;
  const radius = radiusFilter.value;

  try {
    const params = new URLSearchParams({
      longitude: currentLongitude,
      latitude: currentLatitude,
      radius_km: radius,
      ...(query && { search_query: query }),
      ...(category && { category })
    });

    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    const data = await response.json();

    if (data.parts && data.parts.length > 0) {
      partsContainer.innerHTML = data.parts.map(part => `
        <div class="part-card">
          <div class="part-image">🔧</div>
          <div class="part-content">
            <div class="part-name">${part.name}</div>
            <div class="part-category">${part.category}</div>
            <div class="part-details">
              <strong>Thương hiệu:</strong> ${part.brand || 'N/A'}<br>
              <strong>Model:</strong> ${part.model || 'N/A'}
            </div>
            <div class="part-price">${part.rental_price_per_day.toLocaleString('vi-VN')} ₫/ngày</div>
            <div class="part-warehouse">
              📍 Kho: ${part.distance_km.toFixed(1)} km
            </div>
            <button class="btn-primary" onclick="openBookingModal(${part.id}, '${part.name}', ${part.warehouse_id}, ${part.rental_price_per_day}, ${part.rental_deposit})">
              ✅ Đặt cho thuê
            </button>
          </div>
        </div>
      `).join('');
    } else {
      partsContainer.innerHTML = '<div class="loading">Không tìm thấy linh kiện phù hợp</div>';
    }
  } catch (error) {
    console.error('Lỗi tìm kiếm:', error);
    partsContainer.innerHTML = '<div class="loading">Lỗi khi tìm kiếm</div>';
  }
}

// Open booking modal
function openBookingModal(partId, partName, warehouseId, dailyPrice, deposit) {
  selectedPart = {
    id: partId,
    name: partName,
    warehouse_id: warehouseId,
    daily_price: dailyPrice,
    deposit
  };

  document.getElementById('partId').value = partId;
  document.getElementById('partName').value = partName;
  document.getElementById('warehouseId').value = warehouseId;
  
  // Set min dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rentalStartDate').min = today;
  document.getElementById('rentalStartDate').value = today;
  
  bookingModal.classList.remove('hidden');
  calculatePrice();
}

// Calculate price
function calculatePrice() {
  const startDate = new Date(document.getElementById('rentalStartDate').value);
  const endDate = new Date(document.getElementById('rentalEndDate').value);
  const quantity = parseInt(document.getElementById('quantity').value) || 1;

  if (startDate && endDate && endDate >= startDate) {
    const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
    const totalRental = selectedPart.daily_price * rentalDays * quantity;
    const depositAmount = selectedPart.deposit * quantity;

    document.getElementById('dailyPrice').textContent = 
      selectedPart.daily_price.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('rentalDays').textContent = rentalDays;
    document.getElementById('totalRental').textContent = 
      totalRental.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('depositAmount').textContent = 
      depositAmount.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('totalAmount').textContent = 
      (totalRental + depositAmount).toLocaleString('vi-VN') + ' ₫';
  }
}

// Submit booking
async function submitBooking(e) {
  e.preventDefault();

  const partId = document.getElementById('partId').value;
  const warehouseId = document.getElementById('warehouseId').value;
  const quantity = document.getElementById('quantity').value;
  const rentalStartDate = document.getElementById('rentalStartDate').value;
  const rentalEndDate = document.getElementById('rentalEndDate').value;
  const paymentMethod = document.getElementById('paymentMethod').value;

  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        part_id: parseInt(partId),
        warehouse_id: parseInt(warehouseId),
        quantity: parseInt(quantity),
        rental_start_date: rentalStartDate,
        rental_end_date: rentalEndDate,
        payment_method: paymentMethod
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Đặt cho thuê thành công!\nMã booking: ' + data.booking.id);
      bookingModal.classList.add('hidden');
      bookingForm.reset();
    } else {
      alert('❌ Lỗi: ' + (data.message || 'Không thể tạo booking'));
    }
  } catch (error) {
    console.error('Lỗi:', error);
    alert('❌ Lỗi khi tạo booking');
  }
}

// Show warehouse detail
async function showWarehouseDetail(warehouseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}`);
    const data = await response.json();
    const warehouse = data.warehouse;

    const detail = document.getElementById('warehouseDetail');
    detail.innerHTML = `
      <div style="padding: 1rem;">
        <div class="info-row">
          <strong>Tên:</strong> ${warehouse.name}
        </div>
        <div class="info-row">
          <strong>Địa chỉ:</strong> ${warehouse.address}
        </div>
        <div class="info-row">
          <strong>SĐT:</strong> ${warehouse.phone_number || 'N/A'}
        </div>
        <div class="info-row">
          <strong>Email:</strong> ${warehouse.email || 'N/A'}
        </div>
        <div class="info-row">
          <strong>Đánh giá:</strong> ${'⭐'.repeat(Math.round(warehouse.rating))} ${warehouse.rating}/5.0
        </div>
        <div class="info-row">
          <strong>Tổng cho thuê:</strong> ${warehouse.total_rentals} lần
        </div>
        <div class="info-row">
          <strong>Mô tả:</strong> ${warehouse.description || 'N/A'}
        </div>
      </div>
    `;

    warehouseModal.classList.remove('hidden');
  } catch (error) {
    console.error('Lỗi:', error);
    alert('Lỗi khi tải chi tiết kho');
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});
