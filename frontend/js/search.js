// ============================================
// Search Results Page — OnliFix
// Skeleton loading + Technician card rendering
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const resultsGrid = document.getElementById('results-grid');
    const resultsSummary = document.getElementById('results-summary');
    const resultsCount = document.getElementById('results-count');
    const distanceRange = document.getElementById('distance-range');
    const distanceValue = document.getElementById('distance-value');
    const sortSelect = document.getElementById('sort-select');
    const resetBtn = document.getElementById('reset-filters');
    const applyBtn = document.getElementById('apply-filters');

    // --- Mock Data: Đội ngũ kỹ thuật viên ---
    const technicians = [
        {
            id: 1,
            name: "Nguyễn Văn Hùng",
            initials: "NH",
            rating: 4.9,
            reviewCount: 127,
            distance: 1.2,
            expertise: "PC/Laptop",
            expertiseIcon: "fa-laptop",
            category: "laptop",
            completedJobs: 342,
            yearsExp: 8,
            responseTime: "~15 phút",
            verified: true
        },
        {
            id: 2,
            name: "Trần Minh Tuấn",
            initials: "TT",
            rating: 4.8,
            reviewCount: 98,
            distance: 2.5,
            expertise: "Điện thoại/Tablet",
            expertiseIcon: "fa-mobile-screen-button",
            category: "phone",
            completedJobs: 256,
            yearsExp: 5,
            responseTime: "~20 phút",
            verified: true
        },
        {
            id: 3,
            name: "Lê Hoàng Phúc",
            initials: "LP",
            rating: 4.7,
            reviewCount: 84,
            distance: 3.1,
            expertise: "Điện lạnh",
            expertiseIcon: "fa-snowflake",
            category: "ac",
            completedJobs: 198,
            yearsExp: 10,
            responseTime: "~30 phút",
            verified: true
        },
        {
            id: 4,
            name: "Phạm Thanh Sơn",
            initials: "PS",
            rating: 4.6,
            reviewCount: 72,
            distance: 4.0,
            expertise: "PC/Laptop",
            expertiseIcon: "fa-laptop",
            category: "laptop",
            completedJobs: 185,
            yearsExp: 6,
            responseTime: "~25 phút",
            verified: true
        },
        {
            id: 5,
            name: "Võ Quốc Bảo",
            initials: "VB",
            rating: 4.5,
            reviewCount: 63,
            distance: 3.8,
            expertise: "TV & Âm thanh",
            expertiseIcon: "fa-tv",
            category: "tv",
            completedJobs: 144,
            yearsExp: 7,
            responseTime: "~20 phút",
            verified: false
        },
        {
            id: 6,
            name: "Đặng Anh Khoa",
            initials: "ĐK",
            rating: 4.9,
            reviewCount: 156,
            distance: 1.8,
            expertise: "PC/Laptop",
            expertiseIcon: "fa-laptop",
            category: "laptop",
            completedJobs: 410,
            yearsExp: 12,
            responseTime: "~10 phút",
            verified: true
        },
        {
            id: 7,
            name: "Huỳnh Đức Mạnh",
            initials: "HM",
            rating: 4.3,
            reviewCount: 41,
            distance: 5.2,
            expertise: "Đồ gia dụng",
            expertiseIcon: "fa-blender",
            category: "home-appliance",
            completedJobs: 89,
            yearsExp: 3,
            responseTime: "~35 phút",
            verified: false
        },
        {
            id: 8,
            name: "Bùi Trọng Nghĩa",
            initials: "BN",
            rating: 4.7,
            reviewCount: 91,
            distance: 2.9,
            expertise: "Smart Home",
            expertiseIcon: "fa-house-signal",
            category: "smarthome",
            completedJobs: 167,
            yearsExp: 4,
            responseTime: "~25 phút",
            verified: true
        }
    ];

    // --- Generate Star HTML ---
    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let html = '';
        for (let i = 0; i < fullStars; i++) html += '★';
        if (hasHalf) html += '★';
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        let emptyHtml = '';
        for (let i = 0; i < emptyStars; i++) emptyHtml += '★';
        return `<span class="stars">${html}</span>${emptyHtml ? `<span class="stars-empty">${emptyHtml}</span>` : ''}`;
    }

    // --- Render Skeleton Loading ---
    function renderSkeletons(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card" style="animation-delay: ${i * 0.1}s">
                    <div class="skeleton-header">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-text-group">
                            <div class="skeleton-line w-60 h-20"></div>
                            <div class="skeleton-line w-40 h-10"></div>
                        </div>
                    </div>
                    <div class="skeleton-meta">
                        <div class="skeleton-tag"></div>
                        <div class="skeleton-tag"></div>
                    </div>
                    <div class="skeleton-line w-100 h-10"></div>
                    <div class="skeleton-line w-80 h-10"></div>
                    <div class="skeleton-line w-100 h-40"></div>
                </div>
            `;
        }
        resultsGrid.innerHTML = html;
    }

    // --- Render Technician Card ---
    function renderTechCard(tech) {
        return `
            <div class="tech-card" data-id="${tech.id}">
                <div class="tech-card-header">
                    <div class="tech-avatar">${tech.initials}</div>
                    <div class="tech-info">
                        <h3>${tech.name}${tech.verified ? ' <i class="fa-solid fa-circle-check" style="color: var(--primary-color); font-size: 14px;" title="Đã xác minh"></i>' : ''}</h3>
                        <div class="tech-rating">
                            ${generateStars(tech.rating)}
                            <span class="tech-rating-score">${tech.rating}</span>
                            <span class="tech-rating-count">(${tech.reviewCount} đánh giá)</span>
                        </div>
                    </div>
                </div>
                <div class="tech-meta">
                    <span class="tech-meta-tag distance">
                        <i class="fa-solid fa-location-dot"></i> ${tech.distance} km
                    </span>
                    <span class="tech-meta-tag expertise">
                        <i class="fa-solid ${tech.expertiseIcon}"></i> ${tech.expertise}
                    </span>
                    <span class="tech-meta-tag jobs">
                        <i class="fa-solid fa-briefcase"></i> ${tech.completedJobs} đơn
                    </span>
                </div>
                <div class="tech-stats">
                    <div class="tech-stat">
                        <div class="tech-stat-value">${tech.yearsExp}</div>
                        <div class="tech-stat-label">Năm KN</div>
                    </div>
                    <div class="tech-stat">
                        <div class="tech-stat-value">${tech.completedJobs}</div>
                        <div class="tech-stat-label">Đơn hoàn tất</div>
                    </div>
                    <div class="tech-stat">
                        <div class="tech-stat-value">${tech.responseTime}</div>
                        <div class="tech-stat-label">Phản hồi</div>
                    </div>
                </div>
                <div class="tech-card-actions">
                    <button class="btn-select" onclick="selectTechnician(${tech.id}, '${tech.name}')">
                        <i class="fa-solid fa-check-circle"></i> Chọn thợ này
                    </button>
                    <button class="btn-profile" title="Xem hồ sơ" onclick="window.location.href='technician.html'">
                        <i class="fa-solid fa-user"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // --- Render Results ---
    function renderResults(techList) {
        if (techList.length === 0) {
            resultsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fa-solid fa-user-slash" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                    <h3 style="color: var(--text-dark); margin-bottom: 8px;">Không tìm thấy kỹ thuật viên</h3>
                    <p style="color: var(--text-light);">Hãy thử mở rộng bộ lọc khoảng cách hoặc giảm yêu cầu đánh giá.</p>
                </div>
            `;
            resultsCount.innerHTML = `<strong>0</strong> kỹ thuật viên`;
            return;
        }

        resultsGrid.innerHTML = techList.map(renderTechCard).join('');
        resultsCount.innerHTML = `Tìm thấy <strong>${techList.length}</strong> kỹ thuật viên gần bạn`;
        resultsSummary.textContent = `Đã tìm thấy ${techList.length} kỹ thuật viên phù hợp trong bán kính ${distanceRange.value} km`;

        // Animate cards appearing one by one
        const cards = resultsGrid.querySelectorAll('.tech-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.4s ease ${index * 0.08}s, transform 0.4s ease ${index * 0.08}s`;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            });
        });
    }

    // --- Filter & Sort Logic ---
    function getFilteredResults() {
        const maxDistance = parseInt(distanceRange.value);
        const minRating = parseFloat(document.querySelector('input[name="min-rating"]:checked')?.value || 3);
        const selectedCategories = Array.from(document.querySelectorAll('.category-filter input:checked')).map(cb => cb.value);

        let filtered = technicians.filter(tech => {
            if (tech.distance > maxDistance) return false;
            if (tech.rating < minRating) return false;
            if (selectedCategories.length > 0 && !selectedCategories.includes(tech.category)) return false;
            return true;
        });

        // Sorting
        const sortBy = sortSelect.value;
        switch (sortBy) {
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'distance':
                filtered.sort((a, b) => a.distance - b.distance);
                break;
            case 'jobs':
                filtered.sort((a, b) => b.completedJobs - a.completedJobs);
                break;
            default: // recommended: combination score
                filtered.sort((a, b) => {
                    const scoreA = (a.rating * 20) + (a.completedJobs / 10) - (a.distance * 2);
                    const scoreB = (b.rating * 20) + (b.completedJobs / 10) - (b.distance * 2);
                    return scoreB - scoreA;
                });
        }

        return filtered;
    }

    // --- Distance Slider ---
    distanceRange.addEventListener('input', () => {
        const val = distanceRange.value;
        distanceValue.textContent = `${val} km`;
        // Update slider gradient fill
        const percent = ((val - 1) / (20 - 1)) * 100;
        distanceRange.style.background = `linear-gradient(90deg, var(--primary-color) ${percent}%, var(--border-color) ${percent}%)`;
    });

    // --- Sort Change ---
    sortSelect.addEventListener('change', () => {
        renderResults(getFilteredResults());
    });

    // --- Apply Filters ---
    applyBtn.addEventListener('click', () => {
        renderResults(getFilteredResults());
    });

    // --- Reset Filters ---
    resetBtn.addEventListener('click', () => {
        distanceRange.value = 10;
        distanceValue.textContent = '10 km';
        distanceRange.style.background = `linear-gradient(90deg, var(--primary-color) 47.4%, var(--border-color) 47.4%)`;

        document.querySelector('input[name="min-rating"][value="4"]').checked = true;

        document.querySelectorAll('.category-filter input').forEach(cb => {
            cb.checked = cb.value === 'laptop';
        });

        sortSelect.value = 'recommended';
        renderResults(getFilteredResults());
    });

    // ============================================
    // PAGE LOAD: Skeleton → Render
    // ============================================
    renderSkeletons(6); // Show 6 skeleton cards
    resultsSummary.textContent = 'Đang chạy thuật toán Matching để tìm thợ phù hợp nhất...';
    resultsCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm kiếm...';

    // Simulate matching algorithm delay (1.5 seconds)
    setTimeout(() => {
        renderResults(getFilteredResults());
    }, 1500);

    // Set initial slider background
    const initPercent = ((distanceRange.value - 1) / (20 - 1)) * 100;
    distanceRange.style.background = `linear-gradient(90deg, var(--primary-color) ${initPercent}%, var(--border-color) ${initPercent}%)`;
});

// --- Global: Select Technician Action ---
function selectTechnician(id, name) {
    // Chuyển hướng sang màn hình đặt lịch sửa chữa
    window.location.href = 'booking.html';
}
