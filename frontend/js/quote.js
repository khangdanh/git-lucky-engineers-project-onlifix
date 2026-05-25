// ============================================
// Quote Approval Page — OnliFix
// Modal logic + Button interactions
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const btnApprove = document.getElementById('btn-approve');
    const btnReject = document.getElementById('btn-reject');

    // Success Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const btnGoHome = document.getElementById('btn-go-home');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Reject Modal
    const rejectOverlay = document.getElementById('reject-modal-overlay');
    const btnConfirmReject = document.getElementById('btn-confirm-reject');
    const btnCancelReject = document.getElementById('btn-cancel-reject');

    // --- Mở Modal ---
    function openModal(overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Khóa cuộn trang
    }

    // --- Đóng Modal ---
    function closeModal(overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Mở khóa cuộn trang
    }

    // ============================================
    // NÚT "ĐỒNG Ý SỬA CHỮA"
    // ============================================
    btnApprove.addEventListener('click', async () => {
        // Hiệu ứng loading trên nút
        const originalHTML = btnApprove.innerHTML;
        btnApprove.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        btnApprove.disabled = true;
        btnApprove.style.opacity = '0.7';

        try {
            const activeOrder = JSON.parse(localStorage.getItem('onlifix_active_order'));
            const token = localStorage.getItem('onlifix_token');
            const orderId = activeOrder ? activeOrder.id.replace('#OLF-', '') : null;

            if (orderId && token) {
                const res = await fetch(`${window.API_BASE_URL}/api/bookings/${orderId}/respond`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'accept' })
                });
                if (!res.ok) throw new Error('Lỗi phản hồi báo giá');
            }

            // Khôi phục nút
            btnApprove.innerHTML = originalHTML;
            btnApprove.disabled = false;
            btnApprove.style.opacity = '1';

            // Cập nhật trạng thái đơn hàng thành "Đang sửa chữa" trong localStorage
            let ordersHistory = JSON.parse(localStorage.getItem('onlifix_orders')) || [];
            if (ordersHistory.length > 0) {
                ordersHistory[0].status = 'Repairing';
                ordersHistory[0].statusText = 'Đang sửa chữa';
                localStorage.setItem('onlifix_orders', JSON.stringify(ordersHistory));
            }

            // Mở modal thành công
            openModal(modalOverlay);
        } catch (error) {
            console.error(error);
            alert('Lỗi khi gửi phản hồi, vui lòng thử lại.');
            btnApprove.innerHTML = originalHTML;
            btnApprove.disabled = false;
            btnApprove.style.opacity = '1';
        }
    });

    // ============================================
    // NÚT "TỪ CHỐI — CHỈ TRẢ PHÍ KHẢO SÁT"
    // ============================================
    btnReject.addEventListener('click', () => {
        openModal(rejectOverlay);
    });

    // Xác nhận từ chối
    btnConfirmReject.addEventListener('click', async () => {
        // Hiệu ứng loading
        const originalHTML = btnConfirmReject.innerHTML;
        btnConfirmReject.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        btnConfirmReject.disabled = true;

        try {
            const activeOrder = JSON.parse(localStorage.getItem('onlifix_active_order'));
            const token = localStorage.getItem('onlifix_token');
            const orderId = activeOrder ? activeOrder.id.replace('#OLF-', '') : null;

            if (orderId && token) {
                await fetch(`${window.API_BASE_URL}/api/bookings/${orderId}/respond`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'reject' })
                });
            }

            closeModal(rejectOverlay);
            btnConfirmReject.innerHTML = originalHTML;
            btnConfirmReject.disabled = false;

            // Hiển thị thông báo (non-blocking)
            const msg = 'Đã xác nhận từ chối sửa chữa. Phí khảo sát 50.000 ₫ sẽ được trừ từ ví OnliFix Pay của bạn. Cảm ơn bạn đã sử dụng OnliFix!';
            if (typeof showToast === 'function') showToast(msg, 5000); else alert(msg);

            // Chuyển về trang quản lý
            window.location.href = 'customer-dashboard.html';
        } catch (error) {
            console.error(error);
            alert('Lỗi khi gửi phản hồi, vui lòng thử lại.');
            btnConfirmReject.innerHTML = originalHTML;
            btnConfirmReject.disabled = false;
        }
    });

    // --- Đóng modals ---
    btnGoHome.addEventListener('click', () => {
        window.location.href = 'tracking.html';
    });

    btnCloseModal.addEventListener('click', () => {
        closeModal(modalOverlay);
    });

    btnCancelReject.addEventListener('click', () => {
        closeModal(rejectOverlay);
    });

    // Đóng modal khi click bên ngoài
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal(modalOverlay);
    });

    rejectOverlay.addEventListener('click', (e) => {
        if (e.target === rejectOverlay) closeModal(rejectOverlay);
    });

    // Đóng modal bằng phím ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(modalOverlay);
            closeModal(rejectOverlay);
        }
    });
});
