// Warehouse Management JavaScript

const API_BASE_URL = 'http://localhost:5000/api/parts';
let warehouses = [];
let parts = [];
let bookings = [];

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const createWarehouseBtn = document.getElementById('createWarehouseBtn');
const createPartBtn = document.getElementById('createPartBtn');
const addToInventoryBtn = document.getElementById('addToInventoryBtn');

const warehouseModal = document.getElementById('warehouseModal');
const partModal = document.getElementById('partModal');
const inventoryModal = document.getElementById('inventoryModal');

const warehouseForm = document.getElementById('warehouseForm');
const partForm = document.getElementById('partForm');
const inventoryForm = document.getElementById('inventoryForm');

const warehousesList = document.getElementById('warehousesList');
const partsList = document.getElementById('partsList');
const bookingsList = document.getElementById('bookingsList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupEventListeners();
  loadData();
});

// Setup tab navigation
function setupTabNavigation() {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(content => content.classList.add('hidden'));
      
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Close modal buttons
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.add('hidden');
    });
  });

  // Create buttons
  createWarehouseBtn.addEventListener('click', () => warehouseModal.classList.remove('hidden'));
  createPartBtn.addEventListener('click', () => partModal.classList.remove('hidden'));
  addToInventoryBtn.addEventListener('click', () => {
    loadWarehousesForInventory();
    loadPartsForInventory();
    inventoryModal.classList.remove('hidden');
  });

  // Form submissions
  warehouseForm.addEventListener('submit', submitWarehouseForm);
  partForm.addEventListener('submit', submitPartForm);
  inventoryForm.addEventListener('submit', submitInventoryForm);

  // Booking status filter
  document.getElementById('bookingStatusFilter')?.addEventListener('change', filterBookings);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });
}

// Load all data
async function loadData() {
  loadWarehouses();
  loadParts();
  loadBookings();
  loadAnalytics();
}

// ============ WAREHOUSES ============

async function loadWarehouses() {
  try {
    // In a real app, you'd fetch from the API
    warehousesList.innerHTML = '<div class="loading">Chưa có kho nào</div>';
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

async function submitWarehouseForm(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('whName').value,
    description: document.getElementById('whDescription').value,
    address: document.getElementById('whAddress').value,
    longitude: parseFloat(document.getElementById('whLongitude').value),
    latitude: parseFloat(document.getElementById('whLatitude').value),
    phone_number: document.getElementById('whPhone').value,
    email: document.getElementById('whEmail').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/warehouses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Tạo kho thành công!');
      warehouseModal.classList.add('hidden');
      warehouseForm.reset();
      loadWarehouses();
    } else {
      alert('❌ Lỗi: ' + (data.message || 'Không thể tạo kho'));
    }
  } catch (error) {
    console.error('Lỗi:', error);
    alert('❌ Lỗi khi tạo kho');
  }
}

// ============ PARTS ============

async function loadParts() {
  try {
    partsList.innerHTML = '<div class="loading">Chưa có linh kiện nào</div>';
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

async function submitPartForm(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('partName').value,
    category: document.getElementById('partCategory').value,
    description: document.getElementById('partDescription').value,
    brand: document.getElementById('partBrand').value,
    model: document.getElementById('partModel').value,
    rental_price_per_day: parseFloat(document.getElementById('partPrice').value),
    rental_deposit: parseFloat(document.getElementById('partDeposit').value) || 0,
    specifications: document.getElementById('partSpecs').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Thêm linh kiện thành công!');
      partModal.classList.add('hidden');
      partForm.reset();
      loadParts();
    } else {
      alert('❌ Lỗi: ' + (data.message || 'Không thể thêm linh kiện'));
    }
  } catch (error) {
    console.error('Lỗi:', error);
    alert('❌ Lỗi khi thêm linh kiện');
  }
}

async function loadWarehousesForInventory() {
  try {
    const select = document.getElementById('invWarehouse');
    select.innerHTML = '<option value="">-- Chọn kho --</option>';
    // Populate with actual warehouses
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

async function loadPartsForInventory() {
  try {
    const select = document.getElementById('invPart');
    select.innerHTML = '<option value="">-- Chọn linh kiện --</option>';
    // Populate with actual parts
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

async function submitInventoryForm(e) {
  e.preventDefault();

  const formData = {
    warehouse_id: parseInt(document.getElementById('invWarehouse').value),
    part_id: parseInt(document.getElementById('invPart').value),
    quantity: parseInt(document.getElementById('invQuantity').value),
    location_in_warehouse: document.getElementById('invLocation').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Thêm vào kho thành công!');
      inventoryModal.classList.add('hidden');
      inventoryForm.reset();
    } else {
      alert('❌ Lỗi: ' + (data.message || 'Không thể thêm vào kho'));
    }
  } catch (error) {
    console.error('Lỗi:', error);
    alert('❌ Lỗi khi thêm vào kho');
  }
}

// ============ BOOKINGS ============

async function loadBookings() {
  try {
    bookingsList.innerHTML = '<div class="loading">Đang tải đơn cho thuê...</div>';
    
    // In a real app, fetch bookings from API
    // For now, show placeholder
    bookingsList.innerHTML = '<div class="loading">Chưa có đơn cho thuê nào</div>';
  } catch (error) {
    console.error('Lỗi:', error);
    bookingsList.innerHTML = '<div class="loading">Lỗi khi tải dữ liệu</div>';
  }
}

function filterBookings() {
  const status = document.getElementById('bookingStatusFilter').value;
  // Filter bookings by status
  loadBookings();
}

// ============ ANALYTICS ============

async function loadAnalytics() {
  try {
    // Calculate and display analytics
    document.getElementById('totalRentals').textContent = '0';
    document.getElementById('totalRevenue').textContent = '0 ₫';
    document.getElementById('averageRating').textContent = '5.0';
    document.getElementById('completionRate').textContent = '100%';
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

// Utility function to format currency
function formatCurrency(amount) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

// Utility function to get status badge
function getStatusBadge(status) {
  const statusClass = `status-${status.toLowerCase()}`;
  const statusText = {
    'PENDING': 'Chờ xác nhận',
    'ACTIVE': 'Đang cho thuê',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  };
  return `<span class="card-status ${statusClass}">${statusText[status] || status}</span>`;
}
