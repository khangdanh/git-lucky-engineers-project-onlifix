document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.auth-content');
    const API_URL = `${window.API_BASE_URL}/api/auth`;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');

            // Cập nhật trạng thái nút Tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Cập nhật nội dung hiển thị
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${target}-section`) {
                    content.classList.add('active');
                }
            });
        });
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone_number = document.getElementById('login-phone').value;
            const password = document.getElementById('login-pass').value;
            const role = document.querySelector('input[name="login_role"]:checked')?.value || 'customer';

            if (typeof showToast === 'function') showToast('Đang xác thực thông tin... Vui lòng chờ trong giây lát!', 'info');

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phone_number, password, role }),
                });

                const data = await response.json();

                if (response.ok) {
                    if (typeof showToast === 'function') showToast('Đăng nhập thành công!', 'success');
                    
                    // Lưu token và thông tin user vào localStorage
                    localStorage.setItem('onlifix_token', data.token);
                    localStorage.setItem('onlifix_user', JSON.stringify(data.user));

                    setTimeout(() => {
                        if (role === 'technician') {
                            window.location.href = 'tech-workspace.html';
                        } else {
                            window.location.href = 'customer-dashboard.html';
                        }
                    }, 1000);
                } else {
                    if (typeof showToast === 'function') {
                        showToast(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.', 'error');
                    } else {
                        alert(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
                    }
                }
            } catch (error) {
                console.error('Lỗi đăng nhập:', error);
                if (typeof showToast === 'function') {
                    showToast('Lỗi kết nối máy chủ. Vui lòng thử lại sau.', 'error');
                } else {
                    alert('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
                }
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('reg-name').value;
            const phone_number = document.getElementById('reg-phone').value;
            const email = document.getElementById('reg-email')?.value || '';
            const password = document.getElementById('reg-pass').value;
            const role = document.querySelector('input[name="role"]:checked')?.value || 'customer';

            if (typeof showToast === 'function') showToast('Đang đăng ký tài khoản... Vui lòng chờ!', 'info');

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ full_name, phone_number, email, password, role }),
                });

                const data = await response.json();

                if (response.ok) {
                    if (typeof showToast === 'function') showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                    
                    setTimeout(() => {
                        // Chuyển tab sang đăng nhập
                        document.querySelector('.tab-btn[data-target="login"]').click();
                        document.getElementById('login-phone').value = phone_number;
                        // Lưu ý: Nếu họ chọn role là thợ, chúng ta sẽ cần điều hướng họ tới trang bổ sung hồ sơ thợ (sẽ làm ở bước sau)
                    }, 1500);
                } else {
                    let errorMsg = data.message || 'Đăng ký thất bại.';
                    if (data.errors && data.errors.length > 0) {
                        errorMsg = data.errors[0].msg; // Lấy lỗi validation đầu tiên
                    }
                    if (typeof showToast === 'function') {
                        showToast(errorMsg, 'error');
                    } else {
                        alert(errorMsg);
                    }
                }
            } catch (error) {
                console.error('Lỗi đăng ký:', error);
                if (typeof showToast === 'function') {
                    showToast('Lỗi kết nối máy chủ. Vui lòng thử lại sau.', 'error');
                } else {
                    alert('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
                }
            }
        });
    }
});