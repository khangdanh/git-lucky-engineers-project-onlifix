document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.getElementById('step-1-request');
    const step2 = document.getElementById('step-2-reset');
    const requestForm = document.getElementById('request-form');
    const resetForm = document.getElementById('reset-form');
    const API_URL = `${window.API_BASE_URL}/api/auth`;

    // --- Xử lý Form 1: Gửi yêu cầu lấy mã ---
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone_number = document.getElementById('request-phone').value;
        const btn = requestForm.querySelector('button');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number })
            });

            const data = await response.json();

            if (typeof showToast === 'function') showToast(data.message, 'info', 5000);

            // Chuyển sang bước 2
            step1.style.display = 'none';
            step2.style.display = 'block';

            // Hiển thị token cho người dùng (chỉ trong môi trường dev)
            if (data.resetToken) {
                document.getElementById('token-display').style.display = 'block';
                document.getElementById('token-value').textContent = data.resetToken;
            }

        } catch (error) {
            console.error('Lỗi yêu cầu reset:', error);
            if (typeof showToast === 'function') showToast('Lỗi kết nối máy chủ.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // --- Xử lý Form 2: Gửi mã và mật khẩu mới ---
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = document.getElementById('reset-token').value;
        const password = document.getElementById('reset-pass').value;
        const btn = resetForm.querySelector('button');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();
            const messageType = response.ok ? 'success' : 'error';
            if (typeof showToast === 'function') showToast(data.message, messageType);

            if (response.ok) {
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Lỗi cập nhật mật khẩu:', error);
            if (typeof showToast === 'function') showToast('Lỗi kết nối máy chủ.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});