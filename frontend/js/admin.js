document.addEventListener('DOMContentLoaded', () => {
    // Giả lập dữ liệu thợ đăng ký
    let pendingTechnicians = [
        {
            id: 'T001',
            name: 'Trần Hoàng Nam',
            phone: '0901 234 567',
            skill: 'Sửa PC/Laptop',
            doc: 'CCCD + Bằng nghề',
            date: '18/04/2026'
        },
        {
            id: 'T002',
            name: 'Lê Văn Tú',
            phone: '0988 765 432',
            skill: 'Điện lạnh',
            doc: 'CCCD',
            date: '19/04/2026'
        },
        {
            id: 'T003',
            name: 'Phạm Minh',
            phone: '0933 111 222',
            skill: 'Đồ Gia dụng',
            doc: 'CCCD + Chứng chỉ điện',
            date: '20/04/2026'
        }
    ];

    const tableBody = document.getElementById('approval-table-body');

    // Hàm render bảng
    function renderTable() {
        tableBody.innerHTML = ''; // Xóa dữ liệu cũ

        if (pendingTechnicians.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px;">Không có hồ sơ nào đang chờ duyệt.</td></tr>`;
            return;
        }

        pendingTechnicians.forEach(tech => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600; color: #0f172a;">${tech.name}</td>
                <td>${tech.phone}</td>
                <td><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${tech.skill}</span></td>
                <td><span class="doc-link"><i class="fa-solid fa-file-pdf"></i> Xem hồ sơ</span></td>
                <td>${tech.date}</td>
                <td>
                    <button class="btn-sm btn-approve" data-id="${tech.id}"><i class="fa-solid fa-check"></i> Duyệt</button>
                    <button class="btn-sm btn-reject" data-id="${tech.id}"><i class="fa-solid fa-xmark"></i> Từ chối</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Gắn sự kiện cho các nút
        attachActionEvents();
    }

    // Hàm xử lý sự kiện Duyệt/Từ chối
    function attachActionEvents() {
        const approveBtns = document.querySelectorAll('.btn-approve');
        const rejectBtns = document.querySelectorAll('.btn-reject');

        approveBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                if (typeof showConfirm === 'function') {
                    showConfirm('Xác nhận DUYỆT tài khoản thợ này?').then(confirmed => {
                        if (confirmed) {
                            pendingTechnicians = pendingTechnicians.filter(t => t.id !== id);
                            renderTable();
                            if (typeof showToast === 'function') showToast('Đã cấp quyền hoạt động cho thợ thành công!'); else alert('Đã cấp quyền hoạt động cho thợ thành công!');
                        }
                    });
                } else {
                    if (confirm(`Xác nhận DUYỆT tài khoản thợ này?`)) {
                        pendingTechnicians = pendingTechnicians.filter(t => t.id !== id);
                        renderTable();
                        if (typeof showToast === 'function') showToast('Đã cấp quyền hoạt động cho thợ thành công!'); else alert('Đã cấp quyền hoạt động cho thợ thành công!');
                    }
                }
            });
        });

        rejectBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                const reason = prompt('Nhập lý do từ chối (Vd: CCCD mờ, thiếu bằng cấp):');
                if (reason) {
                    pendingTechnicians = pendingTechnicians.filter(t => t.id !== id);
                    renderTable();
                    if (typeof showToast === 'function') showToast('Đã từ chối và gửi email thông báo cho thợ!'); else alert('Đã từ chối và gửi email thông báo cho thợ!');
                }
            });
        });
    }

    // Chạy render lần đầu
    renderTable();

    // ==========================================
    // CHART.JS INITIALIZATION
    // ==========================================
    const ctx = document.getElementById('revenueChart').getContext('2d');

    // Create gradient for the line chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 160, 233, 0.5)'); // Primary color with opacity
    gradient.addColorStop(1, 'rgba(0, 160, 233, 0.0)');

    const revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['23/04', '24/04', '25/04', '26/04', '27/04', '28/04', '29/04'],
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: [12500000, 15000000, 11200000, 18400000, 22000000, 17500000, 24600000],
                borderColor: '#00a0e9',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#00a0e9',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide default legend
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9',
                        drawBorder: false
                    },
                    ticks: {
                        font: { family: 'Inter' },
                        color: '#64748b',
                        callback: function (value) {
                            return value / 1000000 + ' Tr'; // Format as millions
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: { family: 'Inter' },
                        color: '#64748b'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
});