document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // SERVICE CATALOG — Dữ liệu lấy từ Database
    // ============================================
    let serviceCatalog = [];

    const TRANSPORT_FEE = 30000;
    const DISCOUNT_THRESHOLD = 500000;
    const DISCOUNT_PERCENT = 5;

    // ============================================
    // DOM References
    // ============================================
    const servicesList = document.getElementById('services-list');
    const summaryServices = document.getElementById('summary-services');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTransport = document.getElementById('summary-transport');
    const summaryDiscountRow = document.getElementById('summary-discount-row');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTotal = document.getElementById('summary-total');
    const summaryDateText = document.getElementById('summary-date-text');
    const summaryTimeText = document.getElementById('summary-time-text');
    const summaryAddressText = document.getElementById('summary-address-text');
    const btnConfirm = document.getElementById('btn-confirm');

    const bookingDate = document.getElementById('booking-date');
    const bookingTime = document.getElementById('booking-time');
    const bookingAddress = document.getElementById('booking-address');
    const bookingName = document.getElementById('booking-name');
    const bookingPhone = document.getElementById('booking-phone');

    // Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const btnGoDashboard = document.getElementById('btn-go-dashboard');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Set min date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    bookingDate.min = `${yyyy}-${mm}-${dd}`;

    // ============================================
    // Tự động điền thông tin người dùng đang đăng nhập
    // ============================================
    const userStr = localStorage.getItem('onlifix_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (bookingName && user.full_name) bookingName.value = user.full_name;
            if (bookingPhone && user.phone_number) bookingPhone.value = user.phone_number;
        } catch (e) {
            console.error('Lỗi khi tự điền thông tin:', e);
        }
    }

    // ============================================
    // Render Services
    // ============================================
    function renderServices() {
        servicesList.innerHTML = '';

        serviceCatalog.forEach((svc, index) => {
            const item = document.createElement('div');
            item.className = 'service-item' + (svc.qty > 0 ? ' active' : '');
            item.style.animationDelay = `${index * 0.05}s`;
            item.innerHTML = `
                <div class="service-icon">
                    <i class="${svc.icon}"></i>
                </div>
                <div class="service-info">
                    <h4>${svc.name}</h4>
                    <span class="service-price">${formatCurrency(svc.price)}</span>
                    <div class="service-desc">${svc.desc}</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" data-action="decrease" data-id="${svc.id}" aria-label="Giảm số lượng">−</button>
                    <div class="qty-value" id="qty-${svc.id}">${svc.qty}</div>
                    <button class="qty-btn" data-action="increase" data-id="${svc.id}" aria-label="Tăng số lượng">+</button>
                </div>
            `;
            servicesList.appendChild(item);
        });

        // Bind quantity buttons
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                const action = this.dataset.action;
                const svc = serviceCatalog.find(s => String(s.id) === String(id));

                if (action === 'increase') {
                    svc.qty = Math.min(svc.qty + 1, 10);
                } else if (action === 'decrease') {
                    svc.qty = Math.max(svc.qty - 1, 0);
                }

                // Update the qty display inline (no full re-render for smoothness)
                const qtyEl = document.getElementById(`qty-${id}`);
                qtyEl.textContent = svc.qty;

                // Toggle active class
                const serviceItem = this.closest('.service-item');
                if (svc.qty > 0) {
                    serviceItem.classList.add('active');
                } else {
                    serviceItem.classList.remove('active');
                }

                updateSummary();
            });
        });
    }

    // ============================================
    // Update Order Summary
    // ============================================
    function updateSummary() {
        const selectedServices = serviceCatalog.filter(s => s.qty > 0);

        // Render selected services in summary
        if (selectedServices.length === 0) {
            summaryServices.innerHTML = '<p class="summary-empty">Chưa có dịch vụ nào được chọn</p>';
        } else {
            summaryServices.innerHTML = '';
            selectedServices.forEach(svc => {
                const row = document.createElement('div');
                row.className = 'summary-service-item';
                row.innerHTML = `
                    <span class="svc-name">${svc.name}</span>
                    <span class="svc-qty">×${svc.qty}</span>
                    <span class="svc-price">${formatCurrency(svc.price * svc.qty)}</span>
                `;
                summaryServices.appendChild(row);
            });
        }

        // Calculate totals
        const subtotal = selectedServices.reduce((sum, s) => sum + (s.price * s.qty), 0);
        let discount = 0;

        if (subtotal >= DISCOUNT_THRESHOLD) {
            discount = Math.round(subtotal * DISCOUNT_PERCENT / 100);
            summaryDiscountRow.style.display = 'flex';
            summaryDiscount.textContent = '-' + formatCurrency(discount);
        } else {
            summaryDiscountRow.style.display = 'none';
        }

        const transport = selectedServices.length > 0 ? TRANSPORT_FEE : 0;
        const total = subtotal + transport - discount;

        summarySubtotal.textContent = formatCurrency(subtotal);
        summaryTransport.textContent = selectedServices.length > 0 ? formatCurrency(TRANSPORT_FEE) : '0 ₫';
        summaryTotal.textContent = formatCurrency(total);

        validateForm();
    }

    // ============================================
    // Form Validation & Summary Sync
    // ============================================
    function validateForm() {
        const hasServices = serviceCatalog.some(s => s.qty > 0);
        const hasDate = bookingDate.value !== '';
        const hasTime = bookingTime.value !== '';
        const hasAddress = bookingAddress.value.trim() !== '';
        const hasName = bookingName.value.trim() !== '';
        const hasPhone = bookingPhone.value.trim() !== '';

        btnConfirm.disabled = !(hasServices && hasDate && hasTime && hasAddress && hasName && hasPhone);
    }

    // Sync date/time/address to summary in real-time
    bookingDate.addEventListener('change', function () {
        if (this.value) {
            const parts = this.value.split('-');
            summaryDateText.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
            summaryDateText.textContent = 'Chưa chọn ngày';
        }
        validateForm();
    });

    bookingTime.addEventListener('change', function () {
        if (this.value) {
            const selected = this.options[this.selectedIndex].text;
            summaryTimeText.textContent = selected;
        } else {
            summaryTimeText.textContent = 'Chưa chọn giờ';
        }
        validateForm();
    });

    bookingAddress.addEventListener('input', function () {
        summaryAddressText.textContent = this.value.trim() || 'Chưa nhập địa chỉ';
        validateForm();
    });

    bookingName.addEventListener('input', validateForm);
    bookingPhone.addEventListener('input', validateForm);

    // ============================================
    // Submit Booking
    // ============================================
    btnConfirm.addEventListener('click', async function (e) {
        if (e) e.preventDefault(); // NGĂN TRÌNH DUYỆT TẢI LẠI TRANG NẾU NÚT NẰM TRONG <FORM>
        if (this.disabled) return;

        // 1. Kiểm tra đăng nhập & Token
        const token = localStorage.getItem('onlifix_token');
        if (!token) {
            if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để đặt lịch!', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        // Đổi text nút thành trạng thái loading
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...';
        this.disabled = true;

        try {
            // 2. Chuẩn bị dữ liệu gửi lên API
            const selectedServices = serviceCatalog.filter(s => s.qty > 0);
            
            // Lấy trực tiếp ID dịch vụ từ Database
            const dbServiceId = selectedServices[0].id;

            // TỔNG HỢP GIỎ HÀNG: Gộp tên + số lượng thành 1 chuỗi và tính tổng tiền
            const issuesText = selectedServices.map(s => s.name + (s.qty > 1 ? ` x${s.qty}` : '')).join(', ');
            const subtotal = selectedServices.reduce((sum, s) => sum + (s.price * s.qty), 0);
            const transport = selectedServices.length > 0 ? TRANSPORT_FEE : 0;
            const discount = subtotal >= DISCOUNT_THRESHOLD ? Math.round(subtotal * DISCOUNT_PERCENT / 100) : 0;
            const totalPrice = subtotal + transport - discount;

            const address = bookingAddress.value.trim();
            // Tạm thời fix cứng tọa độ. Sau này sẽ tích hợp API Geolocation của trình duyệt để lấy GPS thật.
            const longitude = 106.7009;
            const latitude = 10.7769;

            // Lấy Ngày và Giờ từ form, ghép lại thành chuẩn Timestamp của Database
            const dateVal = bookingDate.value;
            const timeVal = bookingTime.value;
            let scheduledAt = null;
            if (dateVal && timeVal) {
                scheduledAt = `${dateVal} ${timeVal}:00`; // Định dạng: YYYY-MM-DD HH:mm:ss
            }

            // 3. Gọi API POST /api/bookings
            const response = await fetch(`${window.API_BASE_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    service_id: dbServiceId,
                    description: issuesText,
                    total_price: totalPrice,
                    address: address,
                    longitude: longitude,
                    latitude: latitude,
                    scheduled_at: scheduledAt
                })
            });

            // CẢI TIẾN BẮT LỖI: Kiểm tra xem Backend có trả về chuẩn JSON hay không (Tránh vỡ Parse)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server gặp sự cố và trả về sai định dạng. Vui lòng kiểm tra log Backend.");
            }

            const data = await response.json();

            if (response.ok) {
                // Thành công! Backend đã trả về ID đơn hàng
                const orderId = '#OLF-' + data.booking.id;
                document.getElementById('modal-order-id').textContent = orderId;

                // Cập nhật thông tin lên Modal
                const dateParts = bookingDate.value.split('-');
                const dateFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                const timeSlot = bookingTime.options[bookingTime.selectedIndex].text;
                document.getElementById('modal-datetime').textContent = `${dateFormatted} — ${timeSlot}`;
                document.getElementById('modal-total').textContent = summaryTotal.textContent;

                // Mở Modal
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';

                // --- Vẫn giữ lại phần lưu localStorage để UI của Frontend chạy mượt mà ---
                const newOrder = {
                    id: orderId,
                    date: dateFormatted,
                    time: timeSlot,
                    issue: issuesText,
                    total: summaryTotal.textContent,
                    status: "Pending",
                    statusText: "Đang chờ thợ"
                };
                
                localStorage.setItem('onlifix_active_order', JSON.stringify(newOrder));
                let ordersHistory = JSON.parse(localStorage.getItem('onlifix_orders')) || [];
                ordersHistory.unshift(newOrder);
                localStorage.setItem('onlifix_orders', JSON.stringify(ordersHistory));
                // -------------------------------------------------------------------------

                if (typeof showToast === 'function') showToast('Tạo đơn đặt lịch thành công!', 'success');
            } else {
                // Xử lý lỗi (ví dụ token hết hạn, hoặc cố tình dùng tài khoản thợ để tự đặt lịch)
                if (typeof showToast === 'function') showToast(data.message, 'error'); else alert(data.message);
                this.innerHTML = originalText;
                this.disabled = false;
            }

        } catch (error) {
            console.error('Chi tiết lỗi khi đặt lịch:', error);
            if (typeof showToast === 'function') showToast('Lỗi hệ thống: ' + error.message, 'error'); else alert('Lỗi hệ thống: ' + error.message);
            this.innerHTML = originalText;
            this.disabled = false;
        }
    });

    // ============================================
    // Modal Controls
    // ============================================
    btnGoDashboard.addEventListener('click', function () {
        window.location.href = 'customer-dashboard.html';
    });

    btnCloseModal.addEventListener('click', function () {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        // Redirect to dashboard as per requirement
        window.location.href = 'customer-dashboard.html';
    });

    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            window.location.href = 'customer-dashboard.html';
        }
    });

    // ============================================
    // Format Currency Helper
    // ============================================
    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN') + ' ₫';
    }

    // ============================================
    // Initialize
    // ============================================
    async function loadServicesFromDB() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/services`);
            if (!response.ok) throw new Error('Không thể tải dịch vụ');
            
            const data = await response.json();
            
            // Chuyển đổi dữ liệu Backend sang cấu trúc UI Frontend
            serviceCatalog = data.map(item => {
                let iconClass = 'fa-solid fa-wrench'; // icon mặc định
                const nameLower = (item.name || '').toLowerCase();
                if (nameLower.includes('máy lạnh')) iconClass = 'fa-solid fa-snowflake';
                else if (nameLower.includes('laptop') || nameLower.includes('pc')) iconClass = 'fa-solid fa-laptop';
                else if (nameLower.includes('máy giặt')) iconClass = 'fa-solid fa-shirt';
                
                return {
                    id: item.id,
                    name: item.name || 'Dịch vụ chưa rõ tên',
                    desc: item.description || '',
                    price: parseInt(item.base_price) || 0,
                    icon: iconClass,
                    qty: 0
                };
            });
            
            renderServices();
            updateSummary();
        } catch (error) {
            console.error(error);
            servicesList.innerHTML = '<p class="summary-empty" style="color:red; text-align:center;">Lỗi khi tải danh sách dịch vụ. Vui lòng tải lại trang.</p>';
        }
    }

    loadServicesFromDB();
});
