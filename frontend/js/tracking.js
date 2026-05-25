document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // CONFIG
    // ============================================
    const FALLBACK_POS = [10.7769, 106.7009]; // Quận 1, HCMC — fallback if geolocation fails
    const TECH_OFFSET_KM = 2;                 // dummy tech ~2 km away

    let map, customerMarker, techMarker, routingControl;
    let customerPos = null;
    let techPos = null;
    
    const socket = typeof io !== 'undefined' ? io(window.API_BASE_URL) : null;

    // ============================================
    // 1. INITIALIZE MAP
    // ============================================
    map = L.map('tracking-map', {
        zoomControl: false,
        attributionControl: false
    }).setView(FALLBACK_POS, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // ============================================
    // 2. CUSTOM MARKER FACTORY
    // ============================================
    function makeIcon(type, faClass) {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-pin ${type}"><i class="${faClass}"></i></div>`,
            iconSize: [46, 56],
            iconAnchor: [23, 56],
            popupAnchor: [0, -58]
        });
    }

    // ============================================
    // 3. GENERATE TECH POSITION ~2 km FROM USER
    // ============================================
    function generateTechPosition(userLat, userLng) {
        // Random angle
        const angle = Math.random() * 2 * Math.PI;
        // ~2 km offset (1° latitude ≈ 111 km)
        const dLat = (TECH_OFFSET_KM / 111) * Math.cos(angle);
        const dLng = (TECH_OFFSET_KM / (111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle);
        return [userLat + dLat, userLng + dLng];
    }

    // ============================================
    // 4. PLACE MARKERS & DRAW ROUTE
    // ============================================
    function setupTracking(userLat, userLng) {
        customerPos = [userLat, userLng];
        techPos = generateTechPosition(userLat, userLng);

        // Kết nối vào phòng Socket Tracking của đơn hàng hiện tại
        const activeOrder = JSON.parse(localStorage.getItem('onlifix_active_order'));
        const orderId = activeOrder ? activeOrder.id.replace('#OLF-', '') : null;
        if (socket && orderId) {
            socket.emit('join_tracking', orderId);
        }

        // Customer "Home" marker
        customerMarker = L.marker(customerPos, {
            icon: makeIcon('home', 'fa-solid fa-house')
        }).addTo(map);
        customerMarker.bindPopup('<b>Nhà của bạn</b><br>Vị trí hiện tại').openPopup();

        // Technician marker
        techMarker = L.marker(techPos, {
            icon: makeIcon('tech', 'fa-solid fa-motorcycle')
        }).addTo(map);
        techMarker.bindPopup('<b>KTV Đặng Anh Khoa</b><br>Đang di chuyển đến bạn...');

        // Fit both markers in view
        map.fitBounds(L.latLngBounds([customerPos, techPos]).pad(0.25));

        // Draw driving route via Leaflet Routing Machine
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(techPos[0], techPos[1]),
                L.latLng(customerPos[0], customerPos[1])
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            show: false,           // hide itinerary text panel
            createMarker: function () { return null; }, // we already have custom markers
            lineOptions: {
                styles: [
                    { color: '#0066cc', opacity: 0.3, weight: 10 },  // glow
                    { color: '#00a0e9', opacity: 0.85, weight: 5 }   // main line
                ],
                addWaypoints: false
            },
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                language: 'vi'
            })
        }).addTo(map);

        // Listen for route found to extract ETA and distance
        routingControl.on('routesfound', function (e) {
            const route = e.routes[0];
            const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
            const timeMin = Math.ceil(route.summary.totalTime / 60);

            document.getElementById('eta-time').textContent = timeMin + ' phút';
            document.getElementById('eta-km').textContent = distanceKm + ' km';

            // Update status text
            document.getElementById('tech-status').innerHTML =
                '<i class="fa-solid fa-motorcycle"></i> Đang di chuyển — còn khoảng <strong>' + timeMin + ' phút</strong>';

            // Start simulated movement
            simulateTechMovement(route);
        });

        routingControl.on('routingerror', function () {
            // If OSRM fails, show straight-line distance
            const distKm = haversineDistance(techPos, customerPos);
            const etaMin = Math.ceil(distKm / 0.5); // rough estimate 30 km/h city
            document.getElementById('eta-time').textContent = '~' + etaMin + ' phút';
            document.getElementById('eta-km').textContent = distKm.toFixed(1) + ' km';
            document.getElementById('tech-status').innerHTML =
                '<i class="fa-solid fa-motorcycle"></i> Đang di chuyển — còn khoảng <strong>~' + etaMin + ' phút</strong>';

            // Fallback: simple straight-line movement
            simulateStraightLine();
        });
    }

    // ============================================
    // 4.5. LẮNG NGHE TỌA ĐỘ THẬT TỪ SOCKET.IO
    // ============================================
    if (socket) {
        socket.on('tech_location_changed', (data) => {
            if (techMarker) {
                techMarker.setLatLng([data.lat, data.lng]);
                const remKm = haversineDistance([data.lat, data.lng], customerPos);
                const remMin = Math.max(1, Math.ceil(remKm / 0.5));
                document.getElementById('eta-km').textContent = remKm.toFixed(1) + ' km';
                document.getElementById('eta-time').textContent = remMin + ' phút';
            }
        });
    }

    // ============================================
    // 5. HTML5 GEOLOCATION
    // ============================================
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                setupTracking(position.coords.latitude, position.coords.longitude);
            },
            function (err) {
                console.warn('Geolocation lỗi:', err.message);
                // Fallback to default HCMC position
                setupTracking(FALLBACK_POS[0], FALLBACK_POS[1]);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    } else {
        setupTracking(FALLBACK_POS[0], FALLBACK_POS[1]);
    }

    // ============================================
    // 6. SIMULATE TECH MOVEMENT ALONG ROUTE
    // ============================================
    function simulateTechMovement(route) {
        const coords = route.coordinates; // array of L.LatLng
        if (!coords || coords.length < 2) return;

        let idx = 0;
        const step = Math.max(1, Math.floor(coords.length / 80)); // ~80 animation frames

        const interval = setInterval(function () {
            idx += step;
            if (idx >= coords.length) {
                idx = coords.length - 1;
                clearInterval(interval);
                onTechArrived();
            }

            const pos = coords[idx];
            techMarker.setLatLng([pos.lat, pos.lng]);

            // Update remaining distance and ETA
            const remaining = coords.slice(idx);
            let remDist = 0;
            for (let i = 1; i < remaining.length; i++) {
                remDist += remaining[i - 1].distanceTo(remaining[i]);
            }
            const remKm = (remDist / 1000).toFixed(1);
            const remMin = Math.max(1, Math.ceil(remDist / 1000 / 0.5));

            document.getElementById('eta-km').textContent = remKm + ' km';
            document.getElementById('eta-time').textContent = remMin + ' phút';
        }, 1500);
    }

    // Fallback: straight-line movement
    function simulateStraightLine() {
        const steps = 60;
        let current = 0;
        const dLat = (customerPos[0] - techPos[0]) / steps;
        const dLng = (customerPos[1] - techPos[1]) / steps;

        const interval = setInterval(function () {
            current++;
            if (current >= steps) {
                clearInterval(interval);
                onTechArrived();
                return;
            }
            const lat = techPos[0] + dLat * current;
            const lng = techPos[1] + dLng * current;
            techMarker.setLatLng([lat, lng]);

            const remKm = haversineDistance([lat, lng], customerPos);
            const remMin = Math.max(1, Math.ceil(remKm / 0.5));
            document.getElementById('eta-km').textContent = remKm.toFixed(1) + ' km';
            document.getElementById('eta-time').textContent = remMin + ' phút';
        }, 2000);
    }

    // ============================================
    // 7. TECH ARRIVED
    // ============================================
    function onTechArrived() {
        document.getElementById('eta-time').textContent = 'Đã đến nơi!';
        document.getElementById('eta-km').textContent = '0 m';
        document.getElementById('tech-status').innerHTML =
            '<i class="fa-solid fa-circle-check" style="color:#10b981"></i> <strong>Kỹ thuật viên đã đến!</strong>';

        // Auto redirect to checkout after 4s
        setTimeout(function () {
            window.location.href = 'checkout.html';
        }, 4000);
    }

    // ============================================
    // 8. HELPER — Haversine Distance (km)
    // ============================================
    function haversineDistance(a, b) {
        const R = 6371;
        const dLat = (b[0] - a[0]) * Math.PI / 180;
        const dLon = (b[1] - a[1]) * Math.PI / 180;
        const lat1 = a[0] * Math.PI / 180;
        const lat2 = b[0] * Math.PI / 180;
        const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    // ============================================
    // 9. BUTTON HANDLERS
    // ============================================
    document.getElementById('btn-call').addEventListener('click', function () {
        const msgCall = 'Đang gọi cho KTV Đặng Anh Khoa... Số điện thoại: 0909 123 456';
        if (typeof showToast === 'function') showToast(msgCall, 4000); else alert(msgCall);
    });

    document.getElementById('btn-chat').addEventListener('click', function () {
        const msgChat = 'Tính năng nhắn tin sẽ sớm được cập nhật! Vui lòng gọi điện để liên hệ nhanh.';
        if (typeof showToast === 'function') showToast(msgChat, 4000); else alert(msgChat);
    });

    document.getElementById('btn-cancel').addEventListener('click', function () {
        const question = 'Bạn có chắc chắn muốn huỷ đơn hàng này không?\nPhí khảo sát 50.000 ₫ vẫn sẽ được tính.';
        if (typeof showConfirm === 'function') {
            showConfirm(question).then(confirmed => {
                if (confirmed) {
                    const msg = 'Đã huỷ đơn hàng. Bạn sẽ được chuyển về trang quản lý.';
                    if (typeof showToast === 'function') showToast(msg, 3000); else alert(msg);
                    window.location.href = 'customer-dashboard.html';
                }
            });
        } else {
            if (confirm('Bạn có chắc chắn muốn huỷ đơn hàng này không?\nPhí khảo sát 50.000 ₫ vẫn sẽ được tính.')) {
                const msg = 'Đã huỷ đơn hàng. Bạn sẽ được chuyển về trang quản lý.';
                if (typeof showToast === 'function') showToast(msg, 3000); else alert(msg);
                window.location.href = 'customer-dashboard.html';
            }
        }
    });
});
