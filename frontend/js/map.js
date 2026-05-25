// src/js/map.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo bản đồ, tâm đặt tại Thủ Dầu Một, Bình Dương
    const map = L.map('map-view').setView([10.9804, 106.6519], 14);

    // Sử dụng layer bản đồ đường phố từ OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap - OnliFix Project'
    }).addTo(map);

    // 2. Dữ liệu giả lập (Mock Data) các cửa hàng linh kiện
    const stores = [
        {
            id: 1,
            name: "Linh kiện Điện tử Hoàng Gia",
            address: "123 Đại lộ Bình Dương, Phú Lợi, Thủ Dầu Một",
            type: "Linh kiện PC/Laptop",
            lat: 10.9824,
            lng: 106.6540
        },
        {
            id: 2,
            name: "Vật tư Điện lạnh Hữu Phát",
            address: "45 Lê Hồng Phong, Phú Hòa, Thủ Dầu Một",
            type: "Vật tư Điện lạnh",
            lat: 10.9750,
            lng: 106.6600
        },
        {
            id: 3,
            name: "Thế giới IC Bình Dương",
            address: "88 Yersin, Hiệp Thành, Thủ Dầu Một",
            type: "IC & Mạch điện tử",
            lat: 10.9850,
            lng: 106.6450
        }
    ];

    const storeListContainer = document.getElementById('store-list');
    const markers = [];

    // 3. Render danh sách cửa hàng ra Sidebar và gắn Marker lên Bản đồ
    stores.forEach(store => {
        // Render Marker lên bản đồ
        const marker = L.marker([store.lat, store.lng]).addTo(map);
        marker.bindPopup(`
            <b>${store.name}</b><br>
            <i class="fa-solid fa-location-dot"></i> ${store.address}<br>
            <span style="color: #6b7280; font-size: 12px;">Chuyên: ${store.type}</span>
        `);
        markers.push({ id: store.id, marker: marker });

        // Render Card lên Sidebar
        const card = document.createElement('div');
        card.className = 'store-card';
        card.innerHTML = `
            <h3>${store.name}</h3>
            <p><i class="fa-solid fa-location-dot"></i> ${store.address}</p>
            <span class="badge">${store.type}</span>
        `;

        // Sự kiện: Khi click vào card thì phóng to bản đồ tới vị trí đó
        card.addEventListener('click', () => {
            map.flyTo([store.lat, store.lng], 16);
            marker.openPopup();
        });

        storeListContainer.appendChild(card);
    });
});