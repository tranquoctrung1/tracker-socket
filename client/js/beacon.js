const API_BASE_URL = hostname;

class BeaconManager {
    constructor() {
        this.currentEditId = null;
        this.beacons = [];
        this.rooms = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadBeacons();
        this.loadFloors();
        this.loadRooms();
        this.loadFilters();
    }

    bindEvents() {
        // Form submission
        document
            .getElementById('beaconForm')
            .addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });

        // Cancel edit
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

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

        // // Filters
        // document
        //     .getElementById('floorFilter')
        //     .addEventListener('change', () => {
        //         this.applyFilters();
        //     });

        // document.getElementById('roomFilter').addEventListener('change', () => {
        //     this.applyFilters();
        // });

        // Modal
        document
            .getElementById('cancelDelete')
            .addEventListener('click', () => {
                this.hideModal();
            });
    }

    async loadFloors() {
        this.showLoading();
        try {
            document.getElementById('Floor').value = 'Tầng Trệt';
            document.getElementById('Floor').setAttribute('disabled', true);

            this.updateStatisticsFloor();
        } catch (err) {
            this.showError('Failed to load floors: ' + err.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadRooms() {
        this.showLoading();
        try {
            const response = await fetch(
                `${API_BASE_URL}/rooms/floor/${document.getElementById('Floor').value || 'Tầng Trệt'}`,
            );
            const data = await response.json();

            if (response.ok) {
                this.rooms = data || [];
                this.displayRoomSelect(this.rooms);
                this.updateStatisticsRoom();
            } else {
                throw new Error(data.error || 'Failed to load beacons');
            }
        } catch (err) {
            this.showError('Failed to load rooms: ' + err.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadBeacons() {
        this.showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}/beacons`);
            const data = await response.json();

            if (response.ok) {
                this.beacons = data || [];
                this.displayBeacons(this.beacons);
                this.updateStatistics();
                //this.updateFilters();
            } else {
                throw new Error(data.error || 'Failed to load beacons');
            }
        } catch (error) {
            this.showError('Failed to load beacons: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayRoomSelect(rooms) {
        const select = document.getElementById('Room');
        select.innerHTML = `<option value="">Chọn phòng</option>`;
        rooms.forEach((room) => {
            const option = document.createElement('option');
            option.value = room.Name;
            option.textContent = room.Name;
            select.appendChild(option);
        });
    }

    displayBeacons(beacons) {
        const tbody = document.getElementById('beaconsTableBody');

        if (beacons.length === 0) {
            this.showNoData();
            return;
        }

        this.hideNoData();

        tbody.innerHTML = beacons
            .map(
                (beacon) => `
            <tr>
                <td>${this.escapeHtml(beacon.beaconId)}</td>
                <td>${this.escapeHtml(beacon.Floor)}</td>
                <td>${beacon.x !== null ? beacon.x : 'N/A'}</td>
                <td>${beacon.y !== null ? beacon.y : 'N/A'}</td>
                <td>${this.escapeHtml(beacon.Room || 'N/A')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-warning" onclick="beaconManager.editBeacon('${
                            beacon._id
                        }')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-danger" onclick="beaconManager.confirmDelete('${
                            beacon._id
                        }')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `,
            )
            .join('');
    }

    async handleFormSubmit() {
        const beaconData = {
            beaconId: document.getElementById('beaconId').value,
            Floor: document.getElementById('Floor').value,
            x: document.getElementById('x').value || null,
            y: document.getElementById('y').value || null,
            Room: document.getElementById('Room').value || null,
        };

        console.log(beaconData);

        // Validation
        if (!beaconData.beaconId || !beaconData.Floor) {
            this.showError('Beacon ID and Floor are required');
            return;
        }

        try {
            let response;
            if (this.currentEditId) {
                // Update existing beacon
                response = await fetch(
                    `${API_BASE_URL}/beacons/${this.currentEditId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(beaconData),
                    },
                );
            } else {
                // Create new beacon
                response = await fetch(`${API_BASE_URL}/beacons`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(beaconData),
                });
            }

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(
                    this.currentEditId
                        ? 'Beacon updated successfully!'
                        : 'Beacon created successfully!',
                );
                this.resetForm();
                this.loadBeacons();
            } else {
                throw new Error(result.error || 'Operation failed');
            }
        } catch (error) {
            this.showError('Operation failed: ' + error.message);
        }
    }

    async editBeacon(beaconId) {
        const beacon = this.beacons.find((b) => b._id === beaconId);
        if (!beacon) return;

        // Fill form with beacon data
        document.getElementById('beaconId').value = beacon.beaconId;
        document.getElementById('Floor').value = beacon.Floor;
        document.getElementById('x').value = beacon.x || '';
        document.getElementById('y').value = beacon.y || '';
        document.getElementById('Room').value = beacon.Room || '';

        // Change form to edit mode
        this.currentEditId = beaconId;
        document.querySelector('.form-section h2').innerHTML =
            '<i class="fas fa-edit"></i> Cập nhật';
        document.querySelector('button[type="submit"]').innerHTML =
            '<i class="fas fa-save"></i> Cập nhật';
        document.getElementById('cancelEdit').style.display = 'inline-flex';

        // Scroll to form
        document
            .querySelector('.form-section')
            .scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        document.getElementById('beaconForm').reset();
        this.currentEditId = null;
        document.querySelector('.form-section h2').innerHTML =
            '<i class="fas fa-plus-circle"></i> Thêm mới';
        document.querySelector('button[type="submit"]').innerHTML =
            '<i class="fas fa-save"></i> Thêm mới';
        document.getElementById('cancelEdit').style.display = 'none';
    }

    confirmDelete(beaconId) {
        this.beaconToDelete = beaconId;
        this.showModal();
    }

    async deleteBeacon() {
        if (!this.beaconToDelete) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/beacons/${this.beaconToDelete}`,
                {
                    method: 'DELETE',
                },
            );

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Beacon deleted successfully!');
                this.loadBeacons();
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            this.showError('Delete failed: ' + error.message);
        } finally {
            this.hideModal();
            this.beaconToDelete = null;
        }
    }

    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();

        if (!query) {
            this.loadBeacons();
            return;
        }

        this.showLoading();
        try {
            const response = await fetch(
                `${API_BASE_URL}/beacons/search?q=${encodeURIComponent(query)}`,
            );
            const data = await response.json();

            if (response.ok) {
                this.displayBeacons(data.beacons || []);
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            this.showError('Search failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('floorFilter').value = '';
        document.getElementById('roomFilter').value = '';
        this.loadBeacons();
    }

    // applyFilters() {
    //     const floorFilter = document.getElementById('floorFilter').value;
    //     const roomFilter = document.getElementById('roomFilter').value;

    //     let filteredBeacons = this.beacons;

    //     if (floorFilter) {
    //         filteredBeacons = filteredBeacons.filter(
    //             (beacon) => beacon.Floor === floorFilter,
    //         );
    //     }

    //     if (roomFilter) {
    //         filteredBeacons = filteredBeacons.filter(
    //             (beacon) => beacon.Room === roomFilter,
    //         );
    //     }

    //     this.displayBeacons(filteredBeacons);
    // }

    updateFilters() {
        const floors = [
            ...new Set(this.beacons.map((b) => b.Floor).filter(Boolean)),
        ];
        const rooms = [
            ...new Set(this.beacons.map((b) => b.Room).filter(Boolean)),
        ];

        // const floorFilter = document.getElementById('floorFilter');
        // const roomFilter = document.getElementById('roomFilter');

        // // Update floor filter
        // floorFilter.innerHTML =
        //     '<option value="">All Floors</option>' +
        //     floors
        //         .map(
        //             (floor) =>
        //                 `<option value="${this.escapeHtml(
        //                     floor,
        //                 )}">${this.escapeHtml(floor)}</option>`,
        //         )
        //         .join('');

        // // Update room filter
        // roomFilter.innerHTML =
        //     '<option value="">All Rooms</option>' +
        //     rooms
        //         .map(
        //             (room) =>
        //                 `<option value="${this.escapeHtml(
        //                     room,
        //                 )}">${this.escapeHtml(room)}</option>`,
        //         )
        //         .join('');
    }

    loadFilters() {
        // This will be populated when beacons are loaded
    }

    updateStatisticsFloor() {
        const totalFloors = 1;

        document.getElementById('totalFloors').textContent = totalFloors;
    }

    updateStatisticsRoom() {
        const totalRooms = this.rooms.length;

        document.getElementById('totalRooms').textContent = totalRooms;
    }

    updateStatistics() {
        const totalBeacons = this.beacons.length;

        document.getElementById('totalBeacons').textContent = totalBeacons;
    }

    showModal() {
        document.getElementById('confirmationModal').style.display = 'block';
        document.getElementById('confirmDelete').onclick = () =>
            this.deleteBeacon();
    }

    hideModal() {
        document.getElementById('confirmationModal').style.display = 'none';
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
        document.getElementById('beaconsTableBody').innerHTML = '';
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
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${
                type === 'success' ? 'check' : 'exclamation'
            }-circle"></i>
            ${message}
        `;

        // Add styles
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

        // Remove after 3 seconds
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
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Add CSS animations
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
`;
document.head.appendChild(style);

// Initialize the application
const beaconManager = new BeaconManager();

function onChangeTrackerPageClicked() {
    window.location.href = '/tracker.html';
}

function onChangeMainPageClicked() {
    window.location.href = '/index.html';
}

function onChangeAlarmAreaPageClicked() {
    window.location.href = '/alarmArea.html';
}

function onRoomChange(selectElement) {
    const selectedRoom = selectElement.value;

    const find = beaconManager.rooms.find((el) => el.Name === selectedRoom);

    if (find !== undefined) {
        document.getElementById('x').value = find.x;
        document.getElementById('y').value = find.y;
    }
}
