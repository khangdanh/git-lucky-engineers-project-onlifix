document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById("online-toggle");
    const statusLabel = document.getElementById("status-label");
    const pulsingIndicator = document.getElementById("pulsing-indicator");
    const incomingModal = document.getElementById("incoming-modal");
    
    const btnReject = document.getElementById("btn-reject");
    const btnAccept = document.getElementById("btn-accept");
    const activeOrderContainer = document.getElementById("active-order-container");

    // Kết nối Socket.io tới Backend
    const socket = typeof io !== 'undefined' ? io(window.API_BASE_URL) : null;
    let isOnline = false;
    let currentIncomingBooking = null; // Lưu tạm thông tin đơn hàng
    let watchPositionId = null; // ID theo dõi GPS

    // 1. Toggle Go Online
    toggleBtn.addEventListener("change", function() {
        isOnline = this.checked;
        if (this.checked) {
            statusLabel.textContent = "Đang nhận đơn";
            statusLabel.classList.add("online");
            pulsingIndicator.classList.remove("hidden");
            checkPendingOrders(); // Tự quét tìm đơn khi bật online
        } else {
            statusLabel.textContent = "Đang ngoại tuyến";
            statusLabel.classList.remove("online");
            pulsingIndicator.classList.add("hidden");
        }
    });

    // 1.5 Lắng nghe sự kiện Đơn đặt lịch mới từ Backend (Real-time)
    if (socket) {
        socket.on('new_booking', (data) => {
            if (!isOnline) return; // Nếu thợ đang gạt nút tắt thì không làm phiền
            
            showIncomingModal(data);
        });

        // Lắng nghe kết quả Khách phản hồi Báo giá
        socket.on('quote_response', (data) => {
            if (data.status === 'REPAIRING') {
                if (typeof showToast === 'function') showToast('Khách hàng đã ĐỒNG Ý báo giá!', 'success');
                else alert('Khách hàng đã ĐỒNG Ý báo giá! Vui lòng tiến hành sửa chữa.');
                statusLabel.textContent = "Đang sửa chữa";
            } else if (data.status === 'REJECTED') {
                if (typeof showToast === 'function') showToast('Khách hàng đã TỪ CHỐI báo giá.', 'error');
                else alert('Khách hàng đã TỪ CHỐI báo giá. Đơn hàng kết thúc.');
                activeOrderContainer.innerHTML = '<div class="empty-state"><p>Đơn hàng đã bị khách từ chối.</p></div>';
                statusLabel.textContent = "Đang nhận đơn";
            }
        });

        // Lắng nghe kết quả Khách đã thanh toán và đánh giá
        socket.on('booking_completed', (data) => {
            if (typeof showToast === 'function') showToast(`Đơn hàng hoàn tất! Bạn nhận được ${data.rating} sao.`, 'success');
            else alert(`Đơn hàng hoàn tất! Khách hàng đã đánh giá ${data.rating} sao.`);
            
            activeOrderContainer.innerHTML = '<div class="empty-state"><p>Đơn hàng đã hoàn thành. Hãy tiếp tục tìm đơn mới!</p></div>';
            statusLabel.textContent = "Đang nhận đơn";
            currentIncomingBooking = null;
        });
    }

    // 2. Reject Order
    btnReject.addEventListener("click", function() {
        incomingModal.classList.add("hidden");
        // Resume searching
        pulsingIndicator.classList.remove("hidden");
        statusLabel.textContent = "Đang nhận đơn";
        currentIncomingBooking = null;
    });

    // 3. Accept Order -> Render Active Order Card
    btnAccept.addEventListener("click", function() {
        incomingModal.classList.add("hidden");
        statusLabel.textContent = "Đang bận (Có đơn)";
        
        // Remove empty state and render active order
        renderActiveOrderCard(currentIncomingBooking);

        // KHI NHẬN ĐƠN: Bắt đầu theo dõi và gửi GPS thật của Thợ lên Server
        if (navigator.geolocation && socket && currentIncomingBooking) {
            watchPositionId = navigator.geolocation.watchPosition(
                (pos) => {
                    socket.emit('tech_location_update', {
                        orderId: currentIncomingBooking.booking_id,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => console.warn('Lỗi lấy GPS thợ:', err),
                { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
            );
        }
    });

    // Tái sử dụng: Hàm hiển thị Popup Đơn mới
    function showIncomingModal(data) {
        currentIncomingBooking = data;
        const issueBox = document.querySelector('.issue-box');
        if (issueBox) {
            issueBox.innerHTML = `
                <p><strong>Khách hàng:</strong> ${data.customer_name}</p>
                <p><strong>Dịch vụ:</strong> ${data.service_name}</p>
                ${data.total_price ? `<p><strong>Tạm tính:</strong> ${data.total_price.toLocaleString('vi-VN')} ₫</p>` : ''}
                <p><strong>Địa chỉ:</strong> ${data.address}</p>
            `;
        }
        incomingModal.classList.remove("hidden");
        pulsingIndicator.classList.add("hidden");
        statusLabel.textContent = "Có đơn mới!";
    }

    // Tái sử dụng: Hàm render card Đơn hàng đang làm
    function renderActiveOrderCard(data) {
        activeOrderContainer.innerHTML = `
            <div class="active-order-card">
                <h3>Khách hàng: ${data ? data.customer_name : 'Khách hàng'}</h3>
                <p><strong>Mã Đơn hàng:</strong> #OLF-${data ? data.booking_id : ''}</p>
                <p><strong>Địa chỉ:</strong> ${data ? data.address : 'Đang cập nhật...'}</p>
                <div class="order-actions">
                    <a href="tracking.html" class="btn-map-action"><i class="fa-solid fa-map-location-dot"></i> Chỉ đường</a>
                    <a href="#" onclick="handleSendQuote(event)" class="btn-quote-action"><i class="fa-solid fa-file-invoice-dollar"></i> Gửi báo giá</a>
                </div>
            </div>
        `;
    }

    // API: Tìm đơn chờ nhận hoặc đơn đang làm dở
    async function checkPendingOrders() {
        const token = localStorage.getItem('onlifix_token');
        if (!token) return;
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/bookings/tech/current`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.type === 'ACTIVE' && data.booking) {
                currentIncomingBooking = data.booking;
                renderActiveOrderCard(data.booking);
                statusLabel.textContent = "Đang bận (Có đơn)";
            } else if (data.type === 'PENDING' && data.booking && isOnline) {
                showIncomingModal(data.booking);
            }
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        }
    }

    // Kiểm tra ngay khi vừa tải lại trang (nếu có đơn ACTIVE thì tự hiện lại)
    checkPendingOrders();
});

// 4. Hàm xử lý khi Thợ bấm "Gửi báo giá"
window.handleSendQuote = async function(e) {
    e.preventDefault(); // Ngăn trình duyệt nhảy lên đầu trang
    
    // Lấy thông tin đơn hàng hiện tại
    const orderId = currentIncomingBooking ? currentIncomingBooking.booking_id : null;
    if (!orderId) {
        alert('Không tìm thấy mã đơn hàng!');
        return;
    }

    // Hiển thị hộp thoại để thợ nhập giá
    const priceStr = prompt("Nhập số tiền báo giá cho khách hàng (VNĐ):\n(Ví dụ: 250000)", "250000");
    if (!priceStr) return; // Nếu thợ bấm Hủy

    const quoted_price = parseInt(priceStr);
    const token = localStorage.getItem('onlifix_token');

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/bookings/${orderId}/quote`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ quoted_price })
        });

        const data = await response.json();
        if (response.ok) {
            if (typeof showToast === 'function') showToast('Đã gửi báo giá cho khách hàng!', 'success');
            else alert('Đã gửi báo giá cho khách hàng!');
        } else {
            alert(data.message || 'Lỗi gửi báo giá');
        }
    } catch (err) {
        console.error(err);
        alert('Không thể kết nối đến máy chủ.');
    }
};

// 5. Xử lý Hồ sơ Kỹ thuật viên (CCCD, Chuyên môn)
document.addEventListener("DOMContentLoaded", function() {
    const btnOpenProfile = document.getElementById("btn-open-profile");
    const profileModal = document.getElementById("profile-modal");
    const btnCloseProfile = document.getElementById("btn-close-profile");
    const profileForm = document.getElementById("tech-profile-form");

    if (btnOpenProfile && profileModal) {
        btnOpenProfile.addEventListener("click", (e) => {
            e.preventDefault();
            profileModal.classList.remove("hidden");
        });
    }

    if (btnCloseProfile && profileModal) {
        btnCloseProfile.addEventListener("click", () => {
            profileModal.classList.add("hidden");
        });
    }

    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const cccd = document.getElementById("tech-cccd").value;
            const expertise = document.getElementById("tech-expertise").value;
            const token = localStorage.getItem("onlifix_token");

            // Đổi text nút thành Đang lưu...
            const btnSubmit = profileForm.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            btnSubmit.disabled = true;

            try {
                const response = await fetch(`${window.API_BASE_URL}/api/tech/profile`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ cccd, expertise })
                });
                const data = await response.json();
                if (response.ok) {
                    if (typeof showToast === 'function') showToast(data.message, 'success');
                    profileModal.classList.add("hidden");
                } else {
                    alert(data.message || "Lỗi cập nhật hồ sơ");
                }
            } catch (error) {
                console.error(error);
                alert("Lỗi kết nối máy chủ");
            } finally {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }
        });
    }
});
