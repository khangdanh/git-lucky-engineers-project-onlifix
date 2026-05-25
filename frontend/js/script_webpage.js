// === GLOBAL CONFIG ===
// Kiểm tra nếu đang chạy local/LAN thì dùng cổng 5000, nếu đã deploy thì dùng link Cloud
const hostname = window.location.hostname;

// Kiểm tra xem hostname có phải là một địa chỉ IP (dạng số X.X.X.X) hay không
const isIpAddress = /^[0-9]+(\.[0-9]+){3}$/.test(hostname);

// Thêm điều kiện hostname === '' để hỗ trợ mở trực tiếp file HTML (file://)
if (hostname === 'localhost' || isIpAddress || hostname === '') {
    window.API_BASE_URL = `http://${hostname || 'localhost'}:5000`;
} else {
    window.API_BASE_URL = 'https://onlifix-api.onrender.com'; // <--- Thay bằng link Backend thật của bạn sau khi deploy
}

// === AUTHENTICATION GUARD (BẢO VỆ TRANG) ===
(function checkAuth() {
    // Danh sách các file HTML yêu cầu phải đăng nhập mới được xem
    const protectedPages = [
        'customer-dashboard.html', 
        'tech-workspace.html', 
        'admin.html', 
        'booking.html', 
        'tracking.html'
    ];
    
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'webpage.html';

    if (protectedPages.includes(currentPage)) {
        const token = localStorage.getItem('onlifix_token');
        const userString = localStorage.getItem('onlifix_user');
        
        // 1. Chặn người chưa đăng nhập
        if (!token || !userString) {
            alert('Vui lòng đăng nhập để truy cập trang này!');
            window.location.replace('login.html'); // Dùng replace thay vì href để người dùng không bấm nút Back (Trở lại) trên trình duyệt được
            return;
        }

        // 2. Phân quyền: Chặn Khách hàng lẻn vào trang của Thợ sửa chữa
        try {
            const user = JSON.parse(userString);
            if (currentPage === 'tech-workspace.html' && !user.isTechnician) {
                alert('Trang này chỉ dành cho Kỹ thuật viên!');
                window.location.replace('customer-dashboard.html');
            }
        } catch (e) {
            console.error('Lỗi kiểm tra phân quyền:', e);
        }
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // === SCROLL REVEAL ANIMATIONS ===
    // IntersectionObserver to animate elements when they scroll into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Auto-apply animation to grid children with stagger delays
    const staggerContainers = document.querySelectorAll('.category-grid, .steps-grid, .features-grid');
    staggerContainers.forEach(container => {
        Array.from(container.children).forEach((child, index) => {
            child.classList.add('animate-on-scroll');
            child.classList.add(`stagger-${Math.min(index + 1, 6)}`);
            observer.observe(child);
        });
    });

    // === DEVICE SELECT & CATEGORY INTERACTION ===
    const categoryCards = document.querySelectorAll('.category-card');
    const deviceSelect = document.getElementById('device-select');
    const searchBtn = document.getElementById('search-btn');

    // 1. Chọn danh mục thiết bị từ lưới Grid
    categoryCards.forEach(card => {
        card.addEventListener('click', function (event) {
            event.preventDefault(); // Ngăn trình duyệt nhảy trang khi bấm thẻ <a>

            // Lấy giá trị data-value tương ứng với thiết bị
            const selectedValue = this.getAttribute('data-value');

            if (selectedValue && deviceSelect) {
                // Cập nhật giá trị cho dropdown ở trên cùng
                deviceSelect.value = selectedValue;

                // Cuộn màn hình mượt mà lên vị trí thanh tìm kiếm
                window.scrollTo({
                    top: document.getElementById('top-search').offsetTop,
                    behavior: 'smooth'
                });

                // Thêm hiệu ứng chớp sáng để báo hiệu cho người dùng
                deviceSelect.classList.add('highlight-select');

                // Tắt hiệu ứng sau 1.5 giây
                setTimeout(() => {
                    deviceSelect.classList.remove('highlight-select');
                }, 1500);
            }
        });
    });

    // 2. Mô phỏng thuật toán matching khi bấm "Tìm thợ ngay"
    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            const selectedDevice = deviceSelect.value;

            // Validate: Nếu chưa chọn thiết bị
            if (!selectedDevice) {
                showToast('Vui lòng chọn thiết bị cần sửa chữa để OnliFix tìm thợ phù hợp.');
                return;
            }

            // Đổi trạng thái nút thành loading
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm thợ...';
            this.disabled = true;

            // Mô phỏng độ trễ của server (đáp ứng NFR: Phản hồi dưới 10s)
            setTimeout(() => {
                // Chuyển hướng sang màn hình tìm thợ với tham số danh mục
                window.location.href = `search-results.html?category=${selectedDevice}`;
            }, 1000); // Mô phỏng tốn 1 giây để thuật toán chạy
        });
    }

    // === MOBILE NAV TOGGLE ===
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.getElementById('main-nav');
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', String(!expanded));
            mainNav.classList.toggle('open');
        });
    }

    // Close mobile nav when clicking outside or selecting a link
    document.addEventListener('click', (e) => {
        if (!mainNav || !mobileToggle) return;
        const target = e.target;
        if (mainNav.classList.contains('open')) {
            // if click is outside the nav and not the toggle
            if (!mainNav.contains(target) && !mobileToggle.contains(target)) {
                mainNav.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Close nav when a nav link is activated (improves keyboard/ARIA behavior)
    mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav.classList.contains('open')) {
                mainNav.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // === TOAST / NON-BLOCKING ALERT ===
    const toastEl = document.getElementById('toast');
    function showToast(message, duration = 3000) {
        if (!toastEl) {
            alert(message);
            return;
        }
        toastEl.textContent = message;
        toastEl.setAttribute('aria-hidden', 'false');
        toastEl.classList.add('visible');
        setTimeout(() => {
            toastEl.classList.remove('visible');
            toastEl.setAttribute('aria-hidden', 'true');
        }, duration);
    }

    // === CONFIRM MODAL (promise-based) ===
    // Creates a reusable confirm modal in the document and returns a Promise<boolean>
    function ensureConfirmModal() {
        let modal = document.getElementById('confirm-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-overlay" tabindex="-1" data-role="overlay">
                <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div class="confirm-body">
                        <p id="confirm-title" class="confirm-message"></p>
                    </div>
                    <div class="confirm-actions">
                        <button class="btn btn-outline" data-role="cancel">Hủy</button>
                        <button class="btn btn-primary" data-role="confirm">Xác nhận</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    function trapFocus(modalEl) {
        const focusable = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return () => {};
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        function handleKey(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            } else if (e.key === 'Escape') {
                // let caller decide; close on Escape by clicking cancel
                modalEl.querySelector('[data-role="cancel"]').click();
            }
        }

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }

    function showConfirm(message, opts = {}) {
        return new Promise((resolve) => {
            const modal = ensureConfirmModal();
            const overlay = modal.querySelector('[data-role="overlay"]');
            const msgEl = modal.querySelector('.confirm-message');
            const btnConfirm = modal.querySelector('[data-role="confirm"]');
            const btnCancel = modal.querySelector('[data-role="cancel"]');

            msgEl.textContent = message || 'Bạn có chắc chắn?';

            // show
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            const previousFocus = document.activeElement;
            // Focus first actionable element
            btnConfirm.focus();

            const removeTrap = trapFocus(modal);

            function cleanup() {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                removeTrap();
                btnConfirm.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
                if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
            }

            function onConfirm() {
                cleanup();
                resolve(true);
            }

            function onCancel() {
                cleanup();
                resolve(false);
            }

            btnConfirm.addEventListener('click', onConfirm);
            btnCancel.addEventListener('click', onCancel);
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) onCancel();
            });
        });
    }

    // === HEADER SCROLL SHADOW ===
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            } else {
                header.style.boxShadow = 'none';
            }
        }, { passive: true });
    }

    // === USER AUTH & GREETING ===
    const userString = localStorage.getItem('onlifix_user');
    if (userString) {
        try {
            const user = JSON.parse(userString);
            
            // Cập nhật tên hiển thị ở góc trên và trong thẻ Hồ sơ
            const nameElements = document.querySelectorAll('.display-user-name');
            nameElements.forEach(el => {
                el.textContent = user.full_name;
            });

            // Cập nhật số điện thoại và email ở trang hồ sơ (nếu có)
            const profilePhone = document.getElementById('profile-phone');
            if (profilePhone) profilePhone.textContent = user.phone_number || 'Chưa cập nhật';
            const profileEmail = document.getElementById('profile-email');
            if (profileEmail) profileEmail.textContent = user.email || 'Chưa cập nhật';

            // Tự động thay đổi Avatar theo chữ cái đầu của tên
            const avatarImgs = document.querySelectorAll('.user-greeting .avatar, .tech-profile .avatar');
            avatarImgs.forEach(img => {
                const encodedName = encodeURIComponent(user.full_name);
                img.src = `https://ui-avatars.com/api/?name=${encodedName}&background=00a0e9&color=fff`;
            });
        } catch (error) {
            console.error('Lỗi khi đọc thông tin người dùng:', error);
        }
    }
});

// Hàm đăng xuất (Gọi khi bấm nút Đăng xuất)
window.handleLogout = function() {
    localStorage.removeItem('onlifix_token');
    localStorage.removeItem('onlifix_user');
    // Chuyển hướng về trang đăng nhập
    window.location.href = 'login.html';
};