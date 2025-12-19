let wsManager = null;

// Cấu hình Lịch sử Vị trí và Cảnh báo
const HISTORY_WINDOW_MS = 10 * 60 * 1000; // 10 phút lịch sử
const LOCAL_STORAGE_KEY_COUNTER = 'geofenceAlertCounter'; // Bộ đếm vẫn lưu cục bộ (trong ngày)

// Kích thước Bản đồ và Vùng tọa độ
//const MAP_WIDTH = 800;
//const MAP_HEIGHT = 600;

// Hằng số Tọa độ Max linh hoạt theo tầng (Đơn vị: mét)
const WORLD_COORD_MAX_XY = 1500;
const WORLD_COORD_MAX_Y_TRET = 770;

const ROTATE_DEG = 0; // âm = xoay trái
const ROTATE_RAD = (ROTATE_DEG * Math.PI) / 180;

const IMAGE_NATURAL_SIZE = {
    width: 579,
    height: 665,
};

// Góc trên trái của bản đồ
const MAP_TOP_LEFT = {
    lat: 10.912548,
    lon: 106.586196,
};

const MAP_TOP_RIGHT = {
    lat: 10.913049,
    lon: 106.588877,
};

// Góc dưới phải của bản đồ
const MAP_BOTTOM_RIGHT = {
    lat: 10.908987,
    lon: 106.590065,
};

const MAP_BOTTOM_LEFT = {
    lat: 10.908231,
    lon: 106.586435,
};

// Cấu hình Geofencing
const WARNING_THRESHOLD_METERS = 5; // Cảnh báo sớm khi cách 5m

let FORBIDDEN_AREAS = [];
let beaconId = [];
let trackers_users = [];
let list_alamrs = [];
let count_alarm = 0;
let currentUser = '';

const liveLocations = {};
let currentFloor = 'Tầng Trệt';
const mapImageBaseName = './asset/floor_plan_';

// Tham chiếu DOM
const mapContainer = document.getElementById('map-container');
const guestList = document.getElementById('guest-list');
const statusElement = document.getElementById('status');
const floorPlanImage = document.getElementById('floor-plan');
const mapTitle = document.getElementById('map-title');
const historyContent = document.getElementById('history-content');
const alertBellBtn = document.getElementById('alert-bell-btn');
const alertCounter = document.getElementById('alert-counter');
const alertPopup = document.getElementById('alert-popup');
const alertHistoryContent = document.getElementById('alert-history-content');

const updateTrackerAlarm = (alarm) => {
    count_alarm += 1;
    list_alamrs.push(alarm);
    //updateMapMarker(liveLocations[alarm.DeviceId]);
    displayWebAlert(liveLocations[alarm.DeviceId], alarm.Location, 'INTRUSION');

    document
        .getElementById(`tracker-${alarm.DeviceId}`)
        .classList.add('alert-active');

    updateBellUI(count_alarm);
};

const updateDataTrackerAndUsersForUpdateHistory = (history, isGPS) => {
    const now = Date.now();

    if (liveLocations[history.DeviceId]) {
        liveLocations[history.DeviceId].history.push(history);
        liveLocations[history.DeviceId].floor = history.Floor;
        liveLocations[history.DeviceId].room = history.Location;
        liveLocations[history.DeviceId].x = history.x;
        liveLocations[history.DeviceId].y = history.y;

        // 1. CẬP NHẬT DỮ LIỆU LIVE - SỬ DỤNG DỮ LIỆU THỰC TỪ MQTT
        const updatedTracker = {
            ...liveLocations[history.DeviceId],
            // Sử dụng dữ liệu thực từ MQTT payload
            x: liveLocations[history.DeviceId].x, // Giữ giá trị cũ nếu không có mới
            y: liveLocations[history.DeviceId].y,
            floor: liveLocations[history.DeviceId].floor || 'Tầng 4', // Mặc định Tầng 3 nếu không có
            room: liveLocations[history.DeviceId].room,
            guest_name: liveLocations[history.DeviceId].guest_name,
            timestamp: now,
        };

        // 4. HIỂN THỊ MARKER NẾU Ở TẦNG HIỆN TẠI - SỬA LỖI LOGIC FLOOR
        if (updatedTracker.floor === currentFloor) {
            updateMapMarker(updatedTracker, isGPS);
        } else {
            // Xóa marker nếu không ở tầng hiện tại
            document.getElementById(`marker-${history.DeviceId}`)?.remove();
            document.getElementById(`alert-${history.DeviceId}`)?.remove();
        }

        if (currentUser === history.DeviceId) {
            displayGuestHistory(liveLocations[history.DeviceId]);
        }

        document.getElementById(`name-${history.DeviceId}`).textContent =
            history.Name;
        document.getElementById(
            `room-${history.DeviceId}`,
        ).textContent = ` (${history.Location}) - `;
        document.getElementById(
            `floor-${history.DeviceId}`,
        ).textContent = ` (${history.Floor})`;
    }
};

const updateDataTrackerAndUsers = () => {
    const now = Date.now();

    for (const item of trackers_users) {
        if (!liveLocations[item.DeviceId]) {
            // Nếu là tracker mới, gán ID và khởi tạo lịch sử
            liveLocations[item.DeviceId] = {
                tracker_id: item.TrackerId,
                deviceId: item.DeviceId,
                history: item.history,
                cccd: item.CCCD,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Màu ngẫu nhiên
                alertType: null,
                guest_name: item.Name || `Khách ${trackerId.slice(-4)}`,

                room:
                    item.history.length > 0
                        ? item.history[item.history.length - 1].Location
                        : 'Phòng bảo vệ',
                floor:
                    item.history.length > 0
                        ? item.history[item.history.length - 1].Floor
                        : 'Tầng Trệt',
                x:
                    item.history.length > 0
                        ? item.history[item.history.length - 1].x
                        : 0,
                y:
                    item.history.length > 0
                        ? item.history[item.history.length - 1].y
                        : 0,
            };
        }

        // 1. CẬP NHẬT DỮ LIỆU LIVE - SỬ DỤNG DỮ LIỆU THỰC TỪ MQTT
        const updatedTracker = {
            ...liveLocations[item.DeviceId],
            // Sử dụng dữ liệu thực từ MQTT payload
            x: liveLocations[item.DeviceId].x, // Giữ giá trị cũ nếu không có mới
            y: liveLocations[item.DeviceId].y,
            floor: liveLocations[item.DeviceId].floor || 'Tầng 4', // Mặc định Tầng 3 nếu không có
            room: liveLocations[item.DeviceId].room,
            guest_name: liveLocations[item.DeviceId].guest_name,
            timestamp: now,
        };

        console.log(updatedTracker);

        // 4. HIỂN THỊ MARKER NẾU Ở TẦNG HIỆN TẠI - SỬA LỖI LOGIC FLOOR
        if (updatedTracker.floor === currentFloor) {
            updateMapMarker(
                updatedTracker,
                updatedTracker.history[updatedTracker.history.length - 1].isGPS,
            );
        } else {
            // Xóa marker nếu không ở tầng hiện tại
            document.getElementById(`marker-${item.DeviceId}`)?.remove();
            document.getElementById(`alert-${item.DeviceId}`)?.remove();
        }

        checkForbiddenArea(updatedTracker);

        // 6. CẬP NHẬT SIDEBAR
        updateGuestList();
    }
};

const getAlarms = () => {
    try {
        const startDate = new Date(Date.now());
        startDate.setDate(startDate.getDate() - 1);
        const endDate = Date.now();

        axios
            .get(
                `${hostname}/alarms/date-range?startDate=${startDate.getTime()}&endDate=${endDate}`,
            )
            .then((res) => {
                updateBellUI(res.data.length);
                count_alarm = res.data.length;

                list_alamrs = res.data.sort(
                    (a, b) =>
                        new Date(b.DateAlarm).getTime() -
                        new Date(a.DateAlarm).getTime(),
                );
            })
            .catch((err) => {
                console.error(err);
            });
    } catch (error) {
        console.error(
            'Error fetching alerts history (Server API down?):',
            error,
        );
        return [];
    }
};

getAlarms();

const FLOOR_COLORS = {
    'Tầng Trệt': '#e67e22',
    'Tầng 3': '#007bff',
    'Tầng 4': '#dc3545',
};

// =======================================================================
//                       HÀM CHUYỂN ĐỔI VÀ VẼ
// =======================================================================

function getImageOffset() {
    const el = document.getElementById('floor-plan');
    const rect = el.getBoundingClientRect();

    const rectBody = document.body.getBoundingClientRect();

    const cornersBody = {
        topLeft: { x: rectBody.left, y: rectBody.top },
        topRight: { x: rectBody.right, y: rectBody.top },
        bottomRight: { x: rectBody.right, y: rectBody.bottom },
        bottomLeft: { x: rectBody.left, y: rectBody.bottom },
    };

    const corners = {
        topLeft: { x: rect.left, y: rect.top },
        topRight: { x: rect.right, y: rect.top },
        bottomRight: { x: rect.right, y: rect.bottom },
        bottomLeft: { x: rect.left, y: rect.bottom },
    };

    const offsetXLeft = corners.topLeft.x - cornersBody.topLeft.x;
    const offsetYLeft = corners.topLeft.y - cornersBody.topLeft.y;

    const offsetXRight = corners.topRight.x - cornersBody.topRight.x;
    const offsetYRight = corners.topRight.y - cornersBody.topRight.y;

    const offsetXBottom = corners.bottomRight.x - cornersBody.bottomRight.x;
    const offsetYBottom = corners.bottomRight.y - cornersBody.bottomRight.y;

    const offsetXTop = corners.bottomLeft.x - cornersBody.bottomLeft.x;
    const offsetYTop = corners.bottomLeft.y - cornersBody.bottomLeft.y;

    return [
        {
            offsetXLeft,
            offsetYLeft,
            offsetXRight,
            offsetYRight,
            offsetXBottom,
            offsetYBottom,
            offsetXTop,
            offsetYTop,
        },
        corners,
    ];
}

function latLonToPixel(lat, lon) {
    const img = document.getElementById('floor-plan');
    if (!img) return { x: 0, y: 0 };

    // 2️⃣ Scale ảnh gốc → pixel hiển thị
    const scaleX = img.offsetWidth / IMAGE_NATURAL_SIZE.width;
    const scaleY = img.offsetHeight / IMAGE_NATURAL_SIZE.height;

    // lat/lon range
    const latMin = MAP_BOTTOM_LEFT.lat;
    const latMax = MAP_TOP_RIGHT.lat;
    const lonMin = MAP_TOP_LEFT.lon;
    const lonMax = MAP_BOTTOM_RIGHT.lon;

    const offset = getImageOffset();

    // screen range
    const xMin = offset[1].topLeft.x;
    const xMax = offset[1].topRight.x;
    const yMin = offset[1].topLeft.y;
    const yMax = offset[1].bottomLeft.y;

    // 1️⃣ Map lat/lon → pixel thẳng
    const x0 = xMin + ((lon - lonMin) / (lonMax - lonMin)) * (xMax - xMin);

    const y0 = yMax - ((lat - latMin) / (latMax - latMin)) * (yMax - yMin);

    // 2️⃣ Tâm ảnh (xoay quanh đây)
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;

    // 3️⃣ Xoay điểm
    const angle = (ROTATE_DEG * Math.PI) / 180; // xoay trái 30°
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const dx = x0 - cx;
    const dy = y0 - cy;

    const x = cx + dx * cos - dy * sin - 50 * scaleX;
    const y = cy + dx * sin + dy * cos - 60 * scaleY;

    return { x, y };
}

/** Chuyển đổi tọa độ World (mét) sang Pixel (màn hình) */
function toPixel(x, y) {
    /* *** CẢI THIỆN: Lấy kích thước từ thẻ <img> floor-plan thay vì container *** */
    const floorPlanImage = document.getElementById('floor-plan');
    if (!floorPlanImage) return { x: 0, y: 0 };

    // Lấy kích thước thực tế của hình ảnh đã được scale trên màn hình (Responsive!)
    const currentMapWidth = floorPlanImage.offsetWidth;
    const currentMapHeight = floorPlanImage.offsetHeight;

    let maxY = WORLD_COORD_MAX_XY;
    let maxX = WORLD_COORD_MAX_XY;

    if (currentFloor === 'Tầng Trệt') {
        maxY = WORLD_COORD_MAX_Y_TRET;
    }

    // Tính toán tỷ lệ dựa trên kích thước thực tế của hình ảnh
    const scaleX = currentMapWidth / maxX;
    const scaleY = currentMapHeight / maxY;

    const pixelX = x * scaleX;
    // Đảo ngược trục Y vì pixel bắt đầu từ trên (0) xuống (currentMapHeight)
    const pixelY = currentMapHeight - y * scaleY;

    return { x: pixelX, y: pixelY };
}

/** Vẽ khu vực cấm (Geofence) lên bản đồ */
function drawForbiddenAreas() {
    document
        .querySelectorAll('.forbidden-area-overlay')
        .forEach((d) => d.remove());

    for (const area of FORBIDDEN_AREAS) {
        if (area.Floor !== currentFloor) continue;

        // Chuyển đổi tọa độ để tính toán pixel
        // Lấy góc trên bên trái (x_min, y_max) và góc dưới bên phải (x_max, y_min)
        const startPixel = toPixel(area.x_min, area.y_max);
        const endPixel = toPixel(area.x_max, area.y_min);

        console.log(startPixel, endPixel);

        const div = document.createElement('div');
        div.className = 'forbidden-area-overlay';
        div.style.backgroundColor = area.color;

        //div.style.left = `${startPixel.x}px`;
        div.style.left = `${area.x_min}px`;
        //div.style.top = `${startPixel.y}px`;
        div.style.top = `${area.y_min}px`;
        div.style.width = `${endPixel.x - startPixel.x}px`;
        div.style.height = `${endPixel.y - startPixel.y}px`;

        mapContainer.appendChild(div);
    }
}

/** Cập nhật vị trí và thông tin của Marker trên bản đồ */
function updateMapMarker(data, isGPS) {
    let marker = document.getElementById(`marker-${data.deviceId}`);
    document
        .getElementById(`tracker-${data.deviceId}`)
        ?.classList.remove('alert-active');
    document.getElementById(`alert-${data.deviceId}`)?.remove();

    if (data.floor !== currentFloor) {
        if (marker) marker.remove();
        document.getElementById(`alert-${data.deviceId}`)?.remove();
        return;
    }

    const randomx = Math.floor(Math.random() * 10) - 1;
    const randomy = Math.floor(Math.random() * 10) - 1;

    let pixelPos = null;
    if (isGPS) {
        const last = data.history[data.history.length - 1];
        pixelPos = latLonToPixel(last.x, last.y);
    }
    // else {
    //     pixelPos = toPixel(
    //         data.history[data.history.length - 1].x + randomx,
    //         data.history[data.history.length - 1].y + randomy,
    //     );
    // }

    if (!marker) {
        marker = document.createElement('div');
        marker.id = `marker-${data.deviceId}`;
        marker.className = 'tracker-marker';
        mapContainer.appendChild(marker);

        const info = document.createElement('div');
        info.className = 'tracker-info';
        marker.appendChild(info);
    }

    marker.style.backgroundColor = data.color || '#dc3545';
    if (isGPS) {
        const img = document.getElementById('floor-plan');
        const scaleY = img.offsetHeight / IMAGE_NATURAL_SIZE.height;

        if (pixelPos.y <= 265 - 50 * scaleY) {
            marker.style.left = `${pixelPos.x + 300}px`;
        } else if (pixelPos.y <= 465 - 50 * scaleY) {
            marker.style.left = `${pixelPos.x + 150}px`;
        } else if (pixelPos.y <= 645 - 50 * scaleY) {
            marker.style.left = `${pixelPos.x + 80}px`;
        } else {
            marker.style.left = `${pixelPos.x + 30}px`;
        }

        marker.style.top = `${pixelPos.y}px`;
    } else {
        marker.style.left = `${data.history[data.history.length - 1].x}px`;
        marker.style.top = `${data.history[data.history.length - 1].y}px`;
    }

    const infoContent = `
        Khách: ${data.guest_name || 'N/A'}<br>
        Phòng: ${data.room}<br>
        Tầng: ${data.floor}<br>
        Time: ${new Date().toLocaleTimeString()}
    `;
    marker.querySelector('.tracker-info').innerHTML = infoContent;

    checkForbiddenArea(data);
}

// =======================================================================
//                      HÀM GEOFENCING VÀ CẢNH BÁO
// =======================================================================

/** Gửi lệnh cảnh báo ngược lại cho Server (Giả định) */
function sendMqttCommandToServer(trackerId, areaName, type) {}

/** Hiển thị Cảnh báo trên Marker (Web Alert) */
function displayWebAlert(trackerData, areaName, type) {
    let marker = document.getElementById(`marker-${trackerData.deviceId}`);
    if (!marker) return;

    // Xóa alert cũ nếu có
    document.getElementById(`alert-${trackerData.deviceId}`)?.remove();

    let alertDiv = document.createElement('div');
    alertDiv.id = `alert-${trackerData.deviceId}`;

    let alertText = '';
    let alertClass = '';

    if (type === 'INTRUSION') {
        alertText = `⚠ ĐÃ XÂM NHẬP: ${areaName}`;
        alertClass = 'alert-intrusion';
    } else {
        // APPROACHING
        alertText = `⚠️ TIẾP CẬN VÙNG CẤM: ${areaName}`;
        alertClass = 'alert-approaching';
    }

    alertDiv.textContent = alertText;
    alertDiv.className = `forbidden-alert ${alertClass}`;
    marker.appendChild(alertDiv);

    updateGuestList(); // Cập nhật sidebar để áp dụng highlight
}

/** Kiểm tra và gửi cảnh báo Geofencing */
function checkForbiddenArea(trackerData) {
    let isAlertActive = false;
    let nearestArea = null;
    let distanceToNearestArea = Infinity;
    const trackerId = trackerData.deviceId;
    const x = trackerData.x;
    const y = trackerData.y;
    const floor = trackerData.floor;
    const trackerDataGlobal = liveLocations[trackerId]; // Lấy dữ liệu global

    // Xóa cảnh báo cũ trên DOM (Marker và Sidebar)
    document
        .querySelector(`.guest-item[data-tracker-id="${trackerId}"]`)
        ?.classList.remove('alert-active');
    document.getElementById(`alert-${trackerId}`)?.remove();
    trackerDataGlobal.alertType = null; // Reset trạng thái alert global

    if (typeof x === 'undefined' || typeof y === 'undefined') return;

    for (const area of FORBIDDEN_AREAS) {
        if (area.Floor !== floor) continue;

        // 1. Kiểm tra Tracker ĐÃ VÀO khu vực cấm (INTRUSION)
        if (
            x >= area.x_min &&
            x <= area.x_max &&
            y >= area.y_min &&
            y <= area.y_max
        ) {
            // Chỉ ghi log và tăng counter nếu đây là một cảnh báo mới (ngăn lặp)
            if (trackerDataGlobal.alertType !== 'XÂM NHẬP') {
                trackerDataGlobal.alertType = 'XÂM NHẬP';
            }

            displayWebAlert(trackerData, area.Name, 'INTRUSION');

            //sendMqttCommandToServer(trackerData.deviceId, area.Name, "INTRUSION");
            return; // Ưu tiên cảnh báo Xâm nhập
        }

        // 2. Kiểm tra Tracker GẦN khu vực cấm (APPROACHING)
        const nearestX = Math.max(area.x_min, Math.min(x, area.x_max));
        const nearestY = Math.max(area.y_min, Math.min(y, area.y_max));
        const distance = Math.sqrt(
            Math.pow(x - nearestX, 2) + Math.pow(y - nearestY, 2),
        );

        if (distance <= WARNING_THRESHOLD_METERS) {
            if (distance < distanceToNearestArea) {
                distanceToNearestArea = distance;
                nearestArea = area;
                isAlertActive = true;
            }
        }
    }

    // Nếu gần khu vực nào đó nhưng chưa xâm nhập
    if (isAlertActive && nearestArea) {
        // Chỉ ghi log và tăng counter nếu đây là một cảnh báo mới (ngăn lặp)
        if (
            trackerDataGlobal.alertType !== 'TIẾP CẬN' &&
            trackerDataGlobal.alertType !== 'XÂM NHẬP'
        ) {
            trackerDataGlobal.alertType = 'TIẾP CẬN';
        }

        displayWebAlert(trackerData, nearestArea.Name, 'APPROACHING');

        // sendMqttCommandToServer(
        //   trackerData.deviceId,
        //   nearestArea.Name,
        //   "APPROACHING"
        // );
    }
}

// =======================================================================
//                       HÀM LỊCH SỬ VÀ SIDEBAR
// =======================================================================

// Giả định rằng bạn đã lấy được phần tử DOM của tiêu đề lịch sử
const historyTitle = document.querySelector('.history-title');

/** Hiển thị lịch sử di chuyển của khách được chọn (Cập nhật tiêu đề)
 * @param {Object} trackerData - Dữ liệu của khách hàng được chọn.
 */
function displayGuestHistory(trackerData) {
    // --- 1. CẬP NHẬT TIÊU ĐỀ HISTORY ---
    if (historyTitle) {
        // Lấy tên khách hoặc dùng tên mặc định 'Khách Vãng Lai'
        const guestName = trackerData?.guest_name || 'Khách Vãng Lai';

        // Tạo nội dung tiêu đề mới, sử dụng style inline để làm nổi bật tên khách
        historyTitle.innerHTML = `
            Lịch Sử Di Chuyển
            <br>
            <span style="font-size: 16px; color: ${
                trackerData.color || '#333'
            }; font-weight: bold; line-height: 1.5;">
                ${guestName}
            </span>
        `;
    }

    // --- 2. XỬ LÝ VÀ HIỂN THỊ LỊCH SỬ CŨ ---

    // Đảm bảo phần nội dung lịch sử (historyContent) đã được định nghĩa
    if (!historyContent) {
        console.error("Lỗi: Không tìm thấy phần tử 'history-content'.");
        return;
    }

    // Reset nội dung
    historyContent.innerHTML = '';

    // Kiểm tra dữ liệu
    if (
        !trackerData ||
        !trackerData.history ||
        trackerData.history.length === 0
    ) {
        historyContent.innerHTML =
            '<p class="history-placeholder">Không có dữ liệu lịch sử gần nhất.</p>';
        return;
    }

    // Sắp xếp và lọc lịch sử để chỉ hiển thị các thay đổi phòng/tầng duy nhất
    const sortedHistory = [...trackerData.history].sort(
        (a, b) =>
            new Date(b.TimeStamp).getTime() - new Date(a.TimeStamp).getTime(),
    );
    const uniqueHistory = sortedHistory.filter((pos, index, arr) => {
        if (index === 0) return true;
        const prev = arr[index - 1];
        // Chỉ ghi lại nếu có thay đổi về Tầng hoặc Khu vực (room)
        return pos.Floor !== prev.Floor || pos.Location !== prev.Location;
    });

    // Hiển thị các mục lịch sử
    uniqueHistory.forEach((pos) => {
        const item = document.createElement('div');
        item.className = 'history-item';

        // Định dạng thời gian
        const time = new Date(pos.TimeStamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        // Thêm nội dung: [Thời gian] Tầng (Khu vực)
        item.innerHTML = `[${time}] ${pos.Floor} <strong>(${pos.Location})</strong>`;
        historyContent.appendChild(item);
    });

    // Cuộn lên đầu
    historyContent.scrollTop = 0;
}

/** Cập nhật danh sách khách và highlight khi có cảnh báo */
function updateGuestList() {
    // Lấy input tìm kiếm nếu có
    const searchInput = document.getElementById('guest-search-input');
    const searchTerm = searchInput
        ? searchInput.value.toLowerCase().trim()
        : '';

    guestList.innerHTML = '';

    const trackers = Object.values(liveLocations)
        // Lọc theo từ khóa tìm kiếm
        .filter((tracker) => {
            const searchTarget = `${tracker.guest_name || ''} ${
                tracker.deviceId || ''
            } ${tracker.room || ''}`.toLowerCase();
            return searchTarget.includes(searchTerm);
        })
        .sort((a, b) => (a.guest_name || '').localeCompare(b.guest_name || ''));

    if (trackers.length === 0) {
        guestList.innerHTML = `<p>Không tìm thấy khách nào.${
            searchTerm ? ' (Đang tìm kiếm: ' + searchTerm + ')' : ''
        }</p>`;
        historyContent.innerHTML =
            '<p class="history-placeholder">Chọn một khách để xem lịch sử.</p>';
        return;
    }
    trackers.forEach((tracker) => {
        const item = document.createElement('div');
        item.className = 'guest-item active';

        // Kiểm tra alertType (đã được set trong checkForbiddenArea)
        if (tracker.alertType) {
            item.classList.add('alert-active');
        }

        item.setAttribute('data-tracker-id', tracker.deviceId);
        item.setAttribute('id', `tracker-${tracker.deviceId}`);
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            e.preventDefault();
            changeFloor(tracker.floor);
            highlightGuest(tracker.deviceId);
            displayGuestHistory(tracker);
            currentUser = tracker.deviceId;
        });
        const markerColor = tracker.color || '#dc3545';
        const floorColor = FLOOR_COLORS[tracker.floor] || '#95a5a6';

        // Thêm chấm màu theo màu marker
        const colorDot = document.createElement('span');
        colorDot.className = 'guest-dot';
        colorDot.style.backgroundColor = markerColor;
        item.appendChild(colorDot);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = tracker.guest_name || 'Khách Vãng Lai';
        nameSpan.style.color = markerColor;
        nameSpan.id = `name-${tracker.deviceId}`;

        const roomSpan = document.createElement('span');
        roomSpan.textContent = ` (${tracker.room})`;
        roomSpan.style.color = markerColor;
        roomSpan.id = `room-${tracker.deviceId}`;

        const floorLabel = document.createElement('span');
        floorLabel.textContent = ` - ${tracker.floor}`;
        floorLabel.style.color = floorColor;
        floorLabel.style.fontWeight = 'bold';
        floorLabel.id = `floor-${tracker.deviceId}`;

        item.appendChild(nameSpan);
        item.appendChild(roomSpan);
        item.appendChild(floorLabel);

        guestList.appendChild(item);
    });
}

/** Lọc và hiển thị Marker khi chuyển tầng */
function filterAndDisplayMarkers() {
    // Loại bỏ tất cả marker không còn trên tầng hiện tại
    document.querySelectorAll('.tracker-marker').forEach((m) => {
        const trackerId = m.id.replace('marker-', '');
        if (
            !liveLocations[trackerId] ||
            liveLocations[trackerId].floor !== currentFloor
        ) {
            m.remove();
            document.getElementById(`alert-${trackerId}`)?.remove();
        }
    });
    // Cập nhật danh sách khách (có thể bị ảnh hưởng bởi floor)
    updateGuestList();
}

// =======================================================================
//                   HÀM QUẢN LÝ LỊCH SỬ CẢNH BÁO (SỬ DỤNG SERVER API)
// =======================================================================

// --- HÀM QUẢN LÝ BỘ ĐẾM CHUÔNG (Vẫn Dùng Local Storage) ---

/** Tải và hiển thị bộ đếm cảnh báo chưa xem trong ngày */
function loadAndDisplayCounter() {
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEY_COUNTER),
    ) || { date: today, count: 0 };

    // Nếu là ngày mới, reset bộ đếm
    if (stored.date !== today) {
        stored.date = today;
        stored.count = 0;
        localStorage.setItem(LOCAL_STORAGE_KEY_COUNTER, JSON.stringify(stored));
    }

    updateBellUI(stored.count);
    return stored.count;
}

/** Cập nhật UI của chuông (số đếm và hiệu ứng lắc) */
function updateBellUI(count) {
    if (count > 0) {
        alertCounter.textContent = count > 99 ? '99+' : count;
        alertCounter.classList.remove('hidden');
        alertBellBtn.classList.add('active'); // Kích hoạt hiệu ứng lắc
    } else {
        alertCounter.classList.add('hidden');
        alertBellBtn.classList.remove('active'); // Tắt hiệu ứng lắc
    }
}

/** Tăng bộ đếm và lưu lại */
function incrementAlertCounter() {
    const today = new Date().toISOString().split('T')[0];
    let stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_COUNTER));

    if (!stored || stored.date !== today) {
        stored = { date: today, count: 0 };
    }

    stored.count += 1;
    localStorage.setItem(LOCAL_STORAGE_KEY_COUNTER, JSON.stringify(stored));
    updateBellUI(stored.count);
}

function formatDate(date = new Date()) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/** Hiển thị và Lọc Lịch sử Cảnh báo trong Popup (Cập nhật thành TABLE) */
async function displayAlertHistory() {
    const filterInput = document.getElementById('alert-date-filter');
    let filterDate = filterInput.value;

    if (
        filterInput.value == '' ||
        filterInput.value == undefined ||
        filterInput.value == null
    ) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        filterInput.value = `${year}-${month}-${day}`;

        filterDate = filterInput.value;
    }

    alertHistoryContent.innerHTML = '';

    let start = null;
    let end = null;

    if (filterDate) {
        start = new Date(filterDate);
        end = new Date(filterDate);
        end.setDate(end.getDate() + 1);

        axios
            .get(
                `${hostname}/alarms/date-range?startDate=${start.getTime()}&endDate=${end.getTime()}`,
            )
            .then((res) => {
                count_alarm = res.data.length;
                updateBellUI(res.data.length);

                list_alamrs = res.data.sort(
                    (a, b) =>
                        new Date(b.DateAlarm).getTime() -
                        new Date(a.DateAlarm).getTime(),
                );

                if (list_alamrs.length === 0) {
                    alertHistoryContent.innerHTML =
                        '<p class="history-placeholder">Chưa có cảnh báo nào được ghi lại.</p>';
                    return;
                } else {
                    // --- 1. TẠO BẢNG VÀ TIÊU ĐỀ BẢNG (HEADER) ---
                    const table = document.createElement('table');
                    table.className = 'alert-history-table';
                    table.innerHTML = `
                                <thead>
                                    <tr>
                                        <th style="width: 15%;">Thời Gian</th>
                                        <th style="width: 25%;">Họ Tên (ID)</th>
                                        <th style="width: 25%;">Khu Vực Cảnh Báo</th>
                                        <th style="width: 15%;">Loại</th>
                                        <th style="width: 20%;">Tầng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            `;
                    const tbody = table.querySelector('tbody');

                    // --- 2. ĐIỀN DỮ LIỆU VÀO CÁC DÒNG (ROW) ---
                    list_alamrs.forEach((alert) => {
                        const row = tbody.insertRow();
                        row.className = 'alert-history-row';

                        let typeClass =
                            alert.Type === 'XÂM NHẬP'
                                ? 'intrusion-type'
                                : 'approaching-type';

                        // Thêm sự kiện click để chuyển đến vị trí
                        row.addEventListener('click', () => {
                            changeFloor(alert.Floor);

                            // Highlight khách trên danh sách sidebar
                            const guestItem = document.querySelector(
                                `.guest-item[data-tracker-id="${alert.TrackerId}"]`,
                            );
                            if (guestItem) {
                                guestItem.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest',
                                });
                            }
                            highlightGuest(alert.TrackerId);

                            toggleAlertPopup(); // Đóng popup sau khi click
                        });

                        // Cột 1: Thời Gian
                        row.insertCell().textContent = `${formatDate(
                            new Date(alert.DateAlarm),
                        )}`; // Hiển thị Giờ (Tháng-Ngày)

                        // Cột 2: Họ Tên (ID)
                        const trackerIdShort = alert.TrackerId.split('-').pop(); // Lấy phần cuối của ID
                        row.insertCell().innerHTML = `
            ${alert.Name}
            <span class="tracker-id-small">(${trackerIdShort})</span>
        `;

                        // Cột 3: Khu Vực Cảnh Báo
                        row.insertCell().textContent = alert.Location;

                        // Cột 4: Loại Cảnh Báo
                        row.insertCell().innerHTML = `<span class="${typeClass} alert-type-cell">${alert.Type}</span>`;

                        // Cột 5: Tầng
                        row.insertCell().textContent = alert.Floor;
                    });

                    // --- 3. HIỂN THỊ BẢNG ---
                    alertHistoryContent.appendChild(table);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }
}

function onReloadClicked() {
    alertHistoryContent.innerHTML = '';
    list_alamrs = list_alamrs.sort(
        (a, b) =>
            new Date(b.DateAlarm).getTime() - new Date(a.DateAlarm).getTime(),
    );

    if (list_alamrs.length === 0) {
        alertHistoryContent.innerHTML =
            '<p class="history-placeholder">Chưa có cảnh báo nào được ghi lại.</p>';
        return;
    } else {
        // --- 1. TẠO BẢNG VÀ TIÊU ĐỀ BẢNG (HEADER) ---
        const table = document.createElement('table');
        table.className = 'alert-history-table';
        table.innerHTML = `
                  <thead>
                      <tr>
                          <th style="width: 15%;">Thời Gian</th>
                          <th style="width: 25%;">Họ Tên (ID)</th>
                          <th style="width: 25%;">Khu Vực Cảnh Báo</th>
                          <th style="width: 15%;">Loại</th>
                          <th style="width: 20%;">Tầng</th>
                      </tr>
                  </thead>
                  <tbody>
                  </tbody>
              `;
        const tbody = table.querySelector('tbody');

        // --- 2. ĐIỀN DỮ LIỆU VÀO CÁC DÒNG (ROW) ---
        list_alamrs.forEach((alert) => {
            const row = tbody.insertRow();
            row.className = 'alert-history-row';

            let typeClass =
                alert.Type === 'XÂM NHẬP'
                    ? 'intrusion-type'
                    : 'approaching-type';

            // Thêm sự kiện click để chuyển đến vị trí
            row.addEventListener('click', () => {
                changeFloor(alert.Floor);

                // Highlight khách trên danh sách sidebar
                const guestItem = document.querySelector(
                    `.guest-item[data-tracker-id="${alert.TrackerId}"]`,
                );
                if (guestItem) {
                    guestItem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                    });
                }
                highlightGuest(alert.TrackerId);

                toggleAlertPopup(); // Đóng popup sau khi click
            });

            // Cột 1: Thời Gian
            row.insertCell().textContent = `${formatDate(
                new Date(alert.DateAlarm),
            )}`; // Hiển thị Giờ (Tháng-Ngày)

            // Cột 2: Họ Tên (ID)
            const trackerIdShort = alert.TrackerId.split('-').pop(); // Lấy phần cuối của ID
            row.insertCell().innerHTML = `
${alert.Name}
<span class="tracker-id-small">(${trackerIdShort})</span>
`;

            // Cột 3: Khu Vực Cảnh Báo
            row.insertCell().textContent = alert.Location;

            // Cột 4: Loại Cảnh Báo
            row.insertCell().innerHTML = `<span class="${typeClass} alert-type-cell">${alert.Type}</span>`;

            // Cột 5: Tầng
            row.insertCell().textContent = alert.Floor;
        });

        // --- 3. HIỂN THỊ BẢNG ---
        alertHistoryContent.appendChild(table);
    }
}

/** Mở/Đóng Popup Cảnh báo */
function toggleAlertPopup() {
    if (alertPopup.classList.contains('hidden')) {
        alertPopup.classList.remove('hidden');
        document.body.classList.add('alert-popup-overlay');
        displayAlertHistory(); // Hiển thị lịch sử
    } else {
        alertPopup.classList.add('hidden');
        document.body.classList.remove('alert-popup-overlay');
    }
}

// =======================================================================
//                         HÀM CHUYỂN TẦNG VÀ KHỞI TẠO
// =======================================================================

/** Hàm chính để chuyển tầng */
function changeFloor(floor) {
    if (floor !== currentFloor) {
        document.querySelectorAll('.floor-btn').forEach((btn) => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-floor="${floor}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        currentFloor = floor;

        let fileName;
        if (floor === 'Tầng Trệt') {
            fileName = './asset/floor_plan_Tret.png';
        } else {
            fileName = `${mapImageBaseName}${floor.replace('Tầng ', '')}.png`;
        }

        floorPlanImage.src = fileName;
        mapTitle.textContent = `${floor}`;

        drawForbiddenAreas();

        // Vòng lặp qua tất cả liveLocations để vẽ lại marker cho tầng mới
        Object.values(liveLocations).forEach((tracker) => {
            // Nếu tracker ở tầng hiện tại, cập nhật marker
            if (tracker.floor === currentFloor) {
                updateMapMarker(tracker);
                checkForbiddenArea(tracker);
            } else {
                // Xóa marker nếu nó không thuộc tầng hiện tại
                document
                    .getElementById(`marker-${tracker.tracker_id}`)
                    ?.remove();
                document
                    .getElementById(`alert-${tracker.tracker_id}`)
                    ?.remove();
            }
        });

        filterAndDisplayMarkers(); // Cập nhật lại danh sách khách (sidebar)
    }
}

/** Highlight khách trên Sidebar (Hiệu ứng) */
function highlightGuest(trackerId) {
    document
        .querySelectorAll('.guest-item')
        .forEach((el) => el.classList.remove('highlighted'));

    const itemToHighlight = document.querySelector(
        `.guest-item[data-tracker-id="${trackerId}"]`,
    );
    if (itemToHighlight) {
        itemToHighlight.classList.add('highlighted');

        // Bỏ highlight sau 3 giây
        setTimeout(() => {
            itemToHighlight.classList.remove('highlighted');
        }, 3000);
    }
}

// --- KHỞI ĐỘNG HỆ THỐNG ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the WebSocket worker manager
    wsManager = new WebSocketWorkerManager();

    // 1. Khởi tạo hiển thị ban đầu (Mặc định là Tầng 3)
    changeFloor(currentFloor);

    // 2. Tải và hiển thị bộ đếm cảnh báo (Cục bộ)
    loadAndDisplayCounter();

    // 3. Thiết lập sự kiện cho các nút chuyển tầng
    document.querySelectorAll('.floor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            changeFloor(btn.getAttribute('data-floor'));
        });
    });

    // 4. Thiết lập sự kiện cho ô tìm kiếm
    const searchInput = document.getElementById('guest-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', updateGuestList);
    }

    // 5. THIẾT LẬP SỰ KIỆN CHO CHUÔNG VÀ POPUP
    alertBellBtn.addEventListener('click', toggleAlertPopup);
    document
        .getElementById('close-popup-btn')
        .addEventListener('click', toggleAlertPopup);
    document.getElementById('alert-popup').addEventListener('click', (e) => {
        // Ngăn sự kiện click từ bên trong lan ra bên ngoài, trừ các hành động cụ thể
        e.stopPropagation();
    });

    const filterInput = document.getElementById('alert-date-filter');
    const clearBtn = document.getElementById('clear-filter-btn');

    filterInput.addEventListener('change', displayAlertHistory);

    clearBtn.addEventListener('click', () => {
        filterInput.value = '';
        displayAlertHistory();
    });

    window.addEventListener('resize', () => {
        // Chạy lại hàm vẽ marker cho tất cả các vị trí đang hiển thị trên tầng hiện tại
        Object.values(liveLocations).forEach((tracker) => {
            if (tracker.floor === currentFloor) {
                updateMapMarker(tracker);
            }
        });
        drawForbiddenAreas(); // Vẽ lại Geofence
    });
});

window.addEventListener('beforeunload', () => {
    wsManager.closeConnection();
});

function onChangeBeaconPageClicked() {
    window.location.href = '/beacon.html';
}

function onChangeTrackerPageClicked() {
    window.location.href = '/tracker.html';
}

function onChangeAlarmAreaPageClicked() {
    window.location.href = '/alarmArea.html';
}
