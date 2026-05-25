document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // DOM REFERENCES
    // ============================================
    const stepPayment = document.getElementById('step-payment');
    const stepReview = document.getElementById('step-review');
    const progStep1 = document.getElementById('prog-step-1');
    const progStep2 = document.getElementById('prog-step-2');
    const progLineFill = document.getElementById('prog-line-fill');
    const btnPay = document.getElementById('btn-pay');
    const btnSubmitReview = document.getElementById('btn-submit-review');
    const btnSkip = document.getElementById('btn-skip');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnGoDashboard = document.getElementById('btn-go-dashboard');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const starRating = document.getElementById('star-rating');
    const ratingLabel = document.getElementById('rating-label');
    const reviewTags = document.getElementById('review-tags');

    let selectedRating = 0;
    const ratingLabels = [
        '',
        'Rất tệ 😞',
        'Không hài lòng 😕',
        'Bình thường 😐',
        'Hài lòng 😊',
        'Tuyệt vời! 🤩'
    ];

    // ============================================
    // PAYMENT METHOD SELECTION
    // ============================================
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function () {
            paymentOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });

    // ============================================
    // PAY BUTTON — Transition to Step 2
    // ============================================
    btnPay.addEventListener('click', function () {
        // Loading state
        this.classList.add('loading');
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

        setTimeout(() => {
            // Update progress bar
            progStep1.classList.remove('active');
            progStep1.classList.add('completed');
            progStep1.querySelector('.step-circle').innerHTML = '<i class="fa-solid fa-check"></i>';
            progLineFill.style.width = '100%';

            setTimeout(() => {
                progStep2.classList.add('active');

                // Switch steps
                stepPayment.classList.remove('active');
                stepReview.classList.add('active');

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 400);
        }, 1500);
    });

    // ============================================
    // 5-STAR RATING
    // ============================================
    const starBtns = starRating.querySelectorAll('.star-btn');

    // Hover preview
    starBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function () {
            const val = parseInt(this.dataset.value);
            starBtns.forEach(s => {
                const sv = parseInt(s.dataset.value);
                s.classList.toggle('hover-preview', sv <= val && !s.classList.contains('active'));
            });
            ratingLabel.textContent = ratingLabels[val];
            ratingLabel.style.color = '#f59e0b';
        });

        btn.addEventListener('mouseleave', function () {
            starBtns.forEach(s => s.classList.remove('hover-preview'));
            ratingLabel.textContent = selectedRating > 0 ? ratingLabels[selectedRating] : 'Chạm để đánh giá';
            ratingLabel.style.color = selectedRating > 0 ? '#f59e0b' : '';
        });

        // Click to select
        btn.addEventListener('click', function () {
            selectedRating = parseInt(this.dataset.value);
            starBtns.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating);
            });
            ratingLabel.textContent = ratingLabels[selectedRating];
            ratingLabel.style.color = '#f59e0b';

            // Enable submit
            btnSubmitReview.disabled = false;

            // Bounce animation
            this.style.transform = 'scale(1.3)';
            setTimeout(() => { this.style.transform = ''; }, 200);
        });
    });

    // ============================================
    // QUICK TAGS
    // ============================================
    reviewTags.querySelectorAll('.tag-btn').forEach(tag => {
        tag.addEventListener('click', function () {
            this.classList.toggle('selected');
        });
    });

    // ============================================
    // SUBMIT REVIEW
    // ============================================
    btnSubmitReview.addEventListener('click', async function () {
        if (this.disabled) return;

        // Loading
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        this.disabled = true;

        try {
            const activeOrder = JSON.parse(localStorage.getItem('onlifix_active_order'));
            const token = localStorage.getItem('onlifix_token');
            const orderId = activeOrder ? activeOrder.id.replace('#OLF-', '') : null;
            
            const activePayment = document.querySelector('.payment-option.active input[type="radio"]');
            const payment_method = activePayment ? (activePayment.id === 'pay-cash' ? 'CASH' : 'E-WALLET') : 'CASH';
            const selectedTags = Array.from(reviewTags.querySelectorAll('.tag-btn.selected')).map(t => t.textContent).join(', ');

            if (orderId && token) {
                await fetch(`${window.API_BASE_URL}/api/bookings/${orderId}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ payment_method, rating: selectedRating, comment: selectedTags })
                });
            }

            // Show modal
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error(error);
            alert('Lỗi gửi đánh giá, vui lòng thử lại.');
            this.innerHTML = 'Gửi đánh giá';
            this.disabled = false;
        }
    });

    // Helper to mark order as completed in localStorage
    function markOrderCompletedAndRedirect() {
        let ordersHistory = JSON.parse(localStorage.getItem('onlifix_orders')) || [];
        if (ordersHistory.length > 0) {
            ordersHistory[0].status = 'Completed';
            ordersHistory[0].statusText = 'Đã hoàn thành';
            localStorage.setItem('onlifix_orders', JSON.stringify(ordersHistory));
        }
        window.location.href = 'customer-dashboard.html';
    }

    // ============================================
    // SKIP BUTTON
    // ============================================
    btnSkip.addEventListener('click', function () {
        markOrderCompletedAndRedirect();
    });

    // ============================================
    // MODAL DISMISS
    // ============================================
    btnGoDashboard.addEventListener('click', function () {
        markOrderCompletedAndRedirect();
    });

    btnCloseModal.addEventListener('click', function () {
        markOrderCompletedAndRedirect();
    });

    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            markOrderCompletedAndRedirect();
        }
    });
});
