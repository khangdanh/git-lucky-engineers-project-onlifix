// src/js/technician.js
document.addEventListener('DOMContentLoaded', () => {
    // Hiệu ứng đếm số cho các thông số thống kê
    const counters = document.querySelectorAll('.stat-card h3');

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.innerText.replace('+', '').replace('k', '000');
            const count = +counter.getAttribute('data-current') || 0;
            const speed = 200;
            const inc = target / speed;

            if (count < target) {
                const nextVal = Math.ceil(count + inc);
                counter.setAttribute('data-current', nextVal);
                counter.innerText = nextVal > 999 ? (nextVal / 1000).toFixed(0) + 'k+' : nextVal + '+';
                setTimeout(updateCount, 1);
            }
        };
        updateCount();
    });
});