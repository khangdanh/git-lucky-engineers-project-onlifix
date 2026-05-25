document.addEventListener("DOMContentLoaded", function() {
    // --- 1. Tab Switching Logic ---
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            tabPanes.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked
            this.classList.add('active');
            const targetId = this.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- 2. Dummy JSON Data & Mocking ---
    
    // E-Warranty Data
    const warranties = [
        {
            id: "BH-10293",
            device: "Laptop Dell XPS 15",
            serial: "S/N: DL8839201",
            expiry: "15/12/2026"
        },
        {
            id: "BH-99281",
            device: "Máy lạnh Panasonic 1HP",
            serial: "S/N: PN-AC-223",
            expiry: "05/08/2025"
        }
    ];

    // Orders Data (Read from localStorage or initialize with defaults)
    let defaultOrders = [
        {
            id: "ORD-5582",
            date: "Hôm nay, 10:30",
            issue: "Sửa máy giặt Toshiba không vắt",
            status: "Pending", // Pending, Repairing, Completed
            statusText: "Đang chờ thợ"
        },
        {
            id: "ORD-5560",
            date: "Hôm nay, 08:15",
            issue: "Vệ sinh máy lạnh 2 dàn + bơm gas",
            status: "Repairing",
            statusText: "Đang sửa chữa"
        },
        {
            id: "ORD-5520",
            date: "12/04/2026",
            issue: "Vệ sinh máy lạnh 2 ngựa",
            status: "Completed",
            statusText: "Đã hoàn thành"
        }
    ];

    let orders = JSON.parse(localStorage.getItem('onlifix_orders'));
    if (!orders) {
        orders = defaultOrders;
        localStorage.setItem('onlifix_orders', JSON.stringify(orders));
    }

    // --- 3. Render E-Warranty Cards ---
    const warrantyContainer = document.getElementById('warranty-container');
    warranties.forEach(w => {
        const card = document.createElement('div');
        card.className = 'warranty-card';
        card.innerHTML = `
            <div class="warranty-header">
                <span class="warranty-title">OnliFix Thẻ Bảo Hành</span>
                <i class="fa-solid fa-microchip" style="font-size: 1.5rem; color: #00a0e9;"></i>
            </div>
            <div class="warranty-body">
                <div class="qr-placeholder">
                    <i class="fa-solid fa-qrcode"></i>
                </div>
                <div class="device-details">
                    <p>Thiết bị: <strong>${w.device}</strong></p>
                    <p>Số Serial: <strong>${w.serial}</strong></p>
                    <p>Hạn bảo hành: <strong>${w.expiry}</strong></p>
                </div>
            </div>
            <div class="warranty-footer">
                <button class="btn">Xem chi tiết</button>
            </div>
        `;
        warrantyContainer.appendChild(card);
    });

    // --- 4. Render Orders ---
    const ordersContainer = document.getElementById('orders-container');
    orders.forEach(o => {
        let badgeClass = '';
        let actionHtml = '';

        if (o.status === 'Pending') {
            badgeClass = 'badge-pending';
            actionHtml = `<a href="quote.html" class="btn btn-primary" style="background:#00a0e9; color:white;">Xem báo giá</a>`;
        } else if (o.status === 'Repairing') {
            badgeClass = 'badge-repairing';
            actionHtml = `<a href="tracking.html" class="btn btn-primary" style="background:#3b82f6; color:white;"><i class="fa-solid fa-location-dot"></i> Theo dõi</a>`;
        } else {
            badgeClass = 'badge-completed';
            actionHtml = `<a href="checkout.html" class="btn btn-outline" style="border: 1px solid #00a0e9; color: #00a0e9;">Thanh toán & Đánh giá</a>`;
        }

        const item = document.createElement('div');
        item.className = 'order-item';
        item.innerHTML = `
            <div class="order-info">
                <h3>Mã đơn: ${o.id} <span class="badge ${badgeClass}">${o.statusText}</span></h3>
                <p><i class="fa-regular fa-clock"></i> ${o.date}</p>
                <p><strong>Vấn đề:</strong> ${o.issue}</p>
            </div>
            <div class="order-action">
                ${actionHtml}
            </div>
        `;
        ordersContainer.appendChild(item);
    });
});
