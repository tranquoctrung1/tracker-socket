const API_BASE_URL = hostname;

class AlarmAreaManager {
    constructor() {
        this.currentEditId = null;
        this.alarmAreas = [];
        this.rooms = [];
        this.selectedRoom = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAlarmAreas();
        this.loadRooms();
        this.calculateManualArea();
    }

    bindEvents() {
        // Form submission
        document
            .getElementById('alarmAreaForm')
            .addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });

        // Cancel edit
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Room selection
        document
            .getElementById('roomSelect')
            .addEventListener('change', (e) => {
                this.handleRoomSelection(e.target.value);
            });

        // Use room coordinates
        document
            .getElementById('useRoomCoordinates')
            .addEventListener('click', () => {
                this.useRoomCoordinates();
            });

        // Manual coordinate changes
        document
            .getElementById('x_min')
            .addEventListener('input', () => this.calculateManualArea());
        document
            .getElementById('y_min')
            .addEventListener('input', () => this.calculateManualArea());
        document
            .getElementById('x_max')
            .addEventListener('input', () => this.calculateManualArea());
        document
            .getElementById('y_max')
            .addEventListener('input', () => this.calculateManualArea());

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.handleSearch();
        });

        document
            .getElementById('searchInput')
            .addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });

        // Clear search
        document.getElementById('clearSearch').addEventListener('click', () => {
            this.clearSearch();
        });

        // Filters
        document
            .getElementById('floorFilter')
            .addEventListener('change', () => {
                this.applyFilters();
            });

        document
            .getElementById('colorFilter')
            .addEventListener('change', () => {
                this.applyFilters();
            });

        // Modal
        document
            .getElementById('cancelDelete')
            .addEventListener('click', () => {
                this.hideDeleteModal();
            });
    }

    async loadAlarmAreas() {
        this.showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/alarm-areas`);
            const data = await response.json();

            if (response.ok) {
                this.alarmAreas = data || [];
                this.displayAlarmAreas(this.alarmAreas);
                this.updateStatistics();
                this.updateFilters();
            } else {
                throw new Error(data.error || 'Failed to load alarm areas');
            }
        } catch (error) {
            this.showError('Lỗi tải khu vực báo động: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadRooms() {
        try {
            const response = await fetch(`${API_BASE_URL}/rooms`);
            const data = await response.json();

            if (response.ok) {
                this.rooms = data || [];
                this.populateRoomSelect();
            } else {
                throw new Error(data.error || 'Failed to load rooms');
            }
        } catch (error) {
            console.error('Lỗi tải danh sách phòng:', error);
        }
    }

    populateRoomSelect() {
        const roomSelect = document.getElementById('roomSelect');

        // Clear existing options except the first one
        roomSelect.innerHTML = '<option value="">-- Chọn phòng --</option>';

        // Group rooms by floor
        const roomsByFloor = {};
        this.rooms.forEach((room) => {
            if (!roomsByFloor[room.Floor]) {
                roomsByFloor[room.Floor] = [];
            }
            roomsByFloor[room.Floor].push(room);
        });

        // Add options grouped by floor
        Object.keys(roomsByFloor)
            .sort()
            .forEach((floor) => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = `Tầng: ${floor}`;

                roomsByFloor[floor].forEach((room) => {
                    const option = document.createElement('option');
                    option.value = room._id;
                    option.textContent = `${room.Name} (${room.x_min},${room.y_min} - ${room.x_max},${room.y_max})`;
                    option.setAttribute('data-room', JSON.stringify(room));
                    optgroup.appendChild(option);
                });

                roomSelect.appendChild(optgroup);
            });
    }

    handleRoomSelection(roomId) {
        const roomSelect = document.getElementById('roomSelect');
        const selectedOption = roomSelect.options[roomSelect.selectedIndex];

        if (roomId && selectedOption) {
            const roomData = JSON.parse(
                selectedOption.getAttribute('data-room'),
            );
            this.selectedRoom = roomData;
            this.displayRoomCoordinates(roomData);
            document.getElementById('Name').value = roomData.Name;
        } else {
            this.selectedRoom = null;
            document.getElementById('roomCoordinates').style.display = 'none';
        }
    }

    displayRoomCoordinates(room) {
        document.getElementById('roomXMin').textContent = room.x_min;
        document.getElementById('roomYMin').textContent = room.y_min;
        document.getElementById('roomXMax').textContent = room.x_max;
        document.getElementById('roomYMax').textContent = room.y_max;

        const area = (room.x_max - room.x_min) * (room.y_max - room.y_min);
        document.getElementById('roomArea').textContent = area.toFixed(2);

        document.getElementById('roomCoordinates').style.display = 'block';

        // Auto-fill floor if empty
        const floorInput = document.getElementById('Floor');
        if (!floorInput.value) {
            floorInput.value = room.Floor;
        }
    }

    useRoomCoordinates() {
        if (!this.selectedRoom) return;

        document.getElementById('x_min').value = this.selectedRoom.x_min;
        document.getElementById('y_min').value = this.selectedRoom.y_min;
        document.getElementById('x_max').value = this.selectedRoom.x_max;
        document.getElementById('y_max').value = this.selectedRoom.y_max;

        this.calculateManualArea();

        this.showSuccess('Đã áp dụng tọa độ từ phòng!');
    }

    calculateManualArea() {
        const x_min = parseFloat(document.getElementById('x_min').value) || 0;
        const y_min = parseFloat(document.getElementById('y_min').value) || 0;
        const x_max = parseFloat(document.getElementById('x_max').value) || 0;
        const y_max = parseFloat(document.getElementById('y_max').value) || 0;

        if (
            x_min &&
            y_min &&
            x_max &&
            y_max &&
            x_max > x_min &&
            y_max > y_min
        ) {
            const area = (x_max - x_min) * (y_max - y_min);
            document.getElementById('manualArea').textContent = area.toFixed(2);
            document.getElementById('manualAreaInfo').style.display = 'block';
        } else {
            document.getElementById('manualAreaInfo').style.display = 'none';
        }
    }

    displayAlarmAreas(alarmAreas) {
        const tbody = document.getElementById('alarmAreasTableBody');

        if (alarmAreas.length === 0) {
            this.showNoData();
            return;
        }

        this.hideNoData();

        tbody.innerHTML = alarmAreas
            .map((area) => {
                const areaValue =
                    area.x_min !== null &&
                    area.x_max !== null &&
                    area.y_min !== null &&
                    area.y_max !== null
                        ? (area.x_max - area.x_min) * (area.y_max - area.y_min)
                        : 0;

                return `
                <tr>
                    <td>
                        <strong>${this.escapeHtml(area.Name)}</strong>
                        <div style="background-color: ${area.color}; width: 20px; height: 20px; display: inline-block; margin-left: 10px; border: 1px solid #ccc;"></div>
                    </td>
                    <td>${this.escapeHtml(area.Floor)}</td>
                    <td>
                        <small>
                            (${area.x_min}, ${area.y_min}) - (${area.x_max}, ${area.y_max})
                        </small>
                    </td>
                    <td>
                        <code>${area.color}</code>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-warning" onclick="alarmAreaManager.editAlarmArea('${area._id}')">
                                <i class="fas fa-edit"></i> Sửa
                            </button>
                            <button class="action-btn btn-danger" onclick="alarmAreaManager.confirmDelete('${area._id}', '${this.escapeHtml(area.Name)}')">
                                <i class="fas fa-trash"></i> Xóa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            })
            .join('');
    }

    async handleFormSubmit() {
        const formData = new FormData(document.getElementById('alarmAreaForm'));
        const alarmAreaData = {
            Name: formData.get('Name'),
            Floor: formData.get('Floor'),
            x_min: parseFloat(formData.get('x_min')),
            y_min: parseFloat(formData.get('y_min')),
            x_max: parseFloat(formData.get('x_max')),
            y_max: parseFloat(formData.get('y_max')),
            color: formData.get('color'),
        };

        // Validation
        if (!alarmAreaData.Name || !alarmAreaData.Floor) {
            this.showError('Tên khu vực và Tầng là bắt buộc');
            return;
        }

        try {
            let response;
            if (this.currentEditId) {
                // Update existing alarm area
                response = await fetch(
                    `${API_BASE_URL}/alarm-areas/${this.currentEditId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(alarmAreaData),
                    },
                );
            } else {
                // Create new alarm area
                response = await fetch(`${API_BASE_URL}/alarm-areas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(alarmAreaData),
                });
            }

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(
                    this.currentEditId
                        ? 'Cập nhật khu vực báo động thành công!'
                        : 'Thêm khu vực báo động thành công!',
                );
                this.resetForm();
                this.loadAlarmAreas();
            } else {
                throw new Error(result.error || 'Operation failed');
            }
        } catch (error) {
            this.showError('Lỗi: ' + error.message);
        }
    }

    async editAlarmArea(alarmAreaId) {
        const alarmArea = this.alarmAreas.find((a) => a._id === alarmAreaId);
        if (!alarmArea) return;

        // Fill form with alarm area data
        document.getElementById('Name').value = alarmArea.Name;
        document.getElementById('Floor').value = alarmArea.Floor;
        document.getElementById('color').value = alarmArea.color;
        document.getElementById('x_min').value = alarmArea.x_min;
        document.getElementById('y_min').value = alarmArea.y_min;
        document.getElementById('x_max').value = alarmArea.x_max;
        document.getElementById('y_max').value = alarmArea.y_max;

        // Change form to edit mode
        this.currentEditId = alarmAreaId;
        document.querySelector('.form-section h2').innerHTML =
            '<i class="fas fa-edit"></i> Chỉnh sửa Khu vực Báo động';
        document.querySelector('button[type="submit"]').innerHTML =
            '<i class="fas fa-save"></i> Cập nhật Khu vực';
        document.getElementById('cancelEdit').style.display = 'inline-flex';

        // Calculate area
        this.calculateManualArea();

        // Scroll to form
        document
            .querySelector('.form-section')
            .scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        document.getElementById('alarmAreaForm').reset();
        document.getElementById('Floor').value = 'Tầng Trệt';
        document.getElementById('color').value = '#FF0000';
        this.currentEditId = null;
        this.selectedRoom = null;
        document.getElementById('roomCoordinates').style.display = 'none';
        document.getElementById('manualAreaInfo').style.display = 'none';
        document.querySelector('.form-section h2').innerHTML =
            '<i class="fas fa-plus-circle"></i> Thêm Khu vực Báo động Mới';
        document.querySelector('button[type="submit"]').innerHTML =
            '<i class="fas fa-save"></i> Thêm Khu vực';
        document.getElementById('cancelEdit').style.display = 'none';
    }

    confirmDelete(alarmAreaId, alarmAreaName) {
        this.alarmAreaToDelete = alarmAreaId;
        document.getElementById('deleteMessage').textContent =
            `Bạn có chắc chắn muốn xóa khu vực báo động "${alarmAreaName}"?`;
        this.showDeleteModal();
    }

    async performDelete() {
        if (!this.alarmAreaToDelete) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/alarm-areas/${this.alarmAreaToDelete}`,
                {
                    method: 'DELETE',
                },
            );

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Xóa khu vực báo động thành công!');
                this.loadAlarmAreas();
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            this.showError('Lỗi xóa: ' + error.message);
        } finally {
            this.hideDeleteModal();
            this.alarmAreaToDelete = null;
        }
    }

    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();

        if (!query) {
            this.displayAlarmAreas(this.alarmAreas);
            return;
        }

        this.showLoading();
        try {
            const response = await fetch(
                `${API_BASE_URL}/alarm-areas/search?q=${encodeURIComponent(query)}`,
            );
            const data = await response.json();

            if (response.ok) {
                this.displayAlarmAreas(data.alarmAreas || []);
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            this.showError('Lỗi tìm kiếm: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    applyFilters() {
        const floorFilter = document.getElementById('floorFilter').value;
        const colorFilter = document.getElementById('colorFilter').value;

        let filteredAlarmAreas = this.alarmAreas;

        if (floorFilter) {
            filteredAlarmAreas = filteredAlarmAreas.filter(
                (area) => area.Floor === floorFilter,
            );
        }

        if (colorFilter) {
            filteredAlarmAreas = filteredAlarmAreas.filter(
                (area) => area.color === colorFilter,
            );
        }

        this.displayAlarmAreas(filteredAlarmAreas);
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('floorFilter').value = '';
        document.getElementById('colorFilter').value = '';
        this.displayAlarmAreas(this.alarmAreas);
    }

    updateStatistics() {
        const totalAlarmAreas = this.alarmAreas.length;
        const totalFloors = new Set(this.alarmAreas.map((area) => area.Floor))
            .size;

        document.getElementById('totalAlarmAreas').textContent =
            totalAlarmAreas;
        document.getElementById('totalFloors').textContent = totalFloors;
    }

    updateFilters() {
        const floors = [
            ...new Set(
                this.alarmAreas.map((area) => area.Floor).filter(Boolean),
            ),
        ];
        const colors = [
            ...new Set(
                this.alarmAreas.map((area) => area.color).filter(Boolean),
            ),
        ];

        const floorFilter = document.getElementById('floorFilter');
        const colorFilter = document.getElementById('colorFilter');

        // Update floor filter
        floorFilter.innerHTML =
            '<option value="">Tất cả các tầng</option>' +
            floors
                .map(
                    (floor) =>
                        `<option value="${this.escapeHtml(floor)}">${this.escapeHtml(floor)}</option>`,
                )
                .join('');

        // Update color filter
        colorFilter.innerHTML =
            '<option value="">Tất cả màu sắc</option>' +
            colors
                .map(
                    (color) =>
                        `<option value="${this.escapeHtml(color)}">${this.escapeHtml(color)}</option>`,
                )
                .join('');
    }

    showDeleteModal() {
        document.getElementById('deleteModal').style.display = 'block';
        document.getElementById('confirmDelete').onclick = () =>
            this.performDelete();
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('noData').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showNoData() {
        document.getElementById('noData').style.display = 'block';
        document.getElementById('alarmAreasTableBody').innerHTML = '';
    }

    hideNoData() {
        document.getElementById('noData').style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            ${message}
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Thêm CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .form-control {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s;
    }

    .form-control:focus {
        outline: none;
        border-color: #3498db;
    }
`;
document.head.appendChild(style);

// Khởi tạo ứng dụng
const alarmAreaManager = new AlarmAreaManager();

function onChangeTrackerPageClicked() {
    window.location.href = '/tracker.html';
}

function onChangeMainPageClicked() {
    window.location.href = '/index.html';
}

function onChangeBeaconPageClicked() {
    window.location.href = '/beacon.html';
}
