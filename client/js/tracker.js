const API_BASE_URL = 'http://localhost:3000/api';

class TrackerManager {
    constructor() {
        this.trackers = [];
        this.usersWithTrackers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // Tìm kiếm
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

        // Xóa tìm kiếm
        document.getElementById('clearSearch').addEventListener('click', () => {
            this.clearSearch();
        });

        // Bộ lọc
        document
            .getElementById('statusFilter')
            .addEventListener('change', () => {
                this.applyFilters();
            });

        // Modal
        document
            .getElementById('cancelUnlink')
            .addEventListener('click', () => {
                this.hideUnlinkModal();
            });
    }

    async loadData() {
        this.showLoading();
        try {
            // Load trackers và users song song
            const [trackersResponse, usersResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/trackers`),
                fetch(`${API_BASE_URL}/users/with-trackers`),
            ]);

            const trackersData = await trackersResponse.json();
            const usersData = await usersResponse.json();

            if (trackersResponse.ok && usersResponse.ok) {
                this.trackers = trackersData || [];
                this.usersWithTrackers = usersData || [];
                console.log(this.trackers);
                console.log(this.usersWithTrackers);
                this.displayTrackers(this.trackers);
                this.updateStatistics();
            } else {
                throw new Error('Failed to load data');
            }
        } catch (error) {
            console.log(error);
            this.showError('Lỗi tải dữ liệu: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayTrackers(trackers) {
        const tbody = document.getElementById('trackersTableBody');

        if (trackers.length === 0) {
            this.showNoData();
            return;
        }

        this.hideNoData();

        tbody.innerHTML = trackers
            .map((tracker) => {
                const user = this.findUserByTrackerId(tracker.TrackerId);
                const isConnected = !!user;

                return `
                <tr>
                    <td>${this.escapeHtml(tracker.TrackerId)}</td>
                    <td>${this.escapeHtml(tracker.DeviceId)}</td>
                    <td>
                        <span class="${
                            isConnected
                                ? 'status-connected'
                                : 'status-available'
                        }">
                            <i class="fas ${
                                isConnected ? 'fa-link' : 'fa-unlink'
                            }"></i>
                            ${isConnected ? 'Đã liên kết' : 'Chưa liên kết'}
                        </span>
                    </td>
                    <td>
                        ${
                            isConnected
                                ? `
                            <div class="user-info">
                                <div class="user-name">${this.escapeHtml(
                                    user.Name,
                                )}</div>
                                <div class="user-email">${this.escapeHtml(
                                    user.email || '',
                                )}</div>
                            </div>
                        `
                                : '<span style="color: #7f8c8d;">Chưa có liên kết</span>'
                        }
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${
                                isConnected
                                    ? `
                                <button class="action-btn btn-danger" onclick="trackerManager.confirmUnlink('${
                                    user._id
                                }', '${this.escapeHtml(
                                    user.Name,
                                )}', '${this.escapeHtml(tracker.TrackerId)}')">
                                    <i class="fas fa-unlink"></i> Hủy liên kết
                                </button>
                            `
                                    : `
                                <span style="color: #7f8c8d; font-size: 0.9em;">Không có thao tác</span>
                            `
                            }
                        </div>
                    </td>
                </tr>
            `;
            })
            .join('');
    }

    findUserByTrackerId(trackerId) {
        return this.usersWithTrackers.find(
            (user) => user.TrackerId === trackerId,
        );
    }

    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();

        if (!query) {
            this.displayTrackers(this.trackers);
            return;
        }

        const filteredTrackers = this.trackers.filter(
            (tracker) =>
                tracker.TrackerId.toLowerCase().includes(query.toLowerCase()) ||
                tracker.DeviceId.toLowerCase().includes(query.toLowerCase()),
        );

        this.displayTrackers(filteredTrackers);
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredTrackers = this.trackers;

        if (statusFilter === 'connected') {
            filteredTrackers = filteredTrackers.filter((tracker) =>
                this.findUserByTrackerId(tracker.TrackerId),
            );
        } else if (statusFilter === 'available') {
            filteredTrackers = filteredTrackers.filter(
                (tracker) => !this.findUserByTrackerId(tracker.TrackerId),
            );
        }

        this.displayTrackers(filteredTrackers);
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        this.displayTrackers(this.trackers);
    }

    confirmUnlink(userId, userName, trackerId) {
        this.userToUnlink = userId;
        this.trackerToUnlink = trackerId;

        document.getElementById('unlinkMessage').textContent =
            `Bạn có chắc chắn muốn hủy liên kết tracker "${trackerId}" khỏi người dùng "${userName}"?`;

        this.showUnlinkModal();
    }

    async performUnlink() {
        if (!this.userToUnlink) return;

        console.log(this.userToUnlink);

        try {
            const response = await fetch(
                `${API_BASE_URL}/users/${this.userToUnlink}/tracker`,
                {
                    method: 'DELETE',
                },
            );

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Hủy liên kết tracker thành công!');
                this.loadData(); // Reload data to reflect changes
            } else {
                throw new Error(result.error || 'Hủy liên kết thất bại');
            }
        } catch (error) {
            this.showError('Lỗi hủy liên kết: ' + error.message);
        } finally {
            this.hideUnlinkModal();
            this.userToUnlink = null;
            this.trackerToUnlink = null;
        }
    }

    updateStatistics() {
        const totalTrackers = this.trackers.length;
        const connectedTrackers = this.trackers.filter((tracker) =>
            this.findUserByTrackerId(tracker.TrackerId),
        ).length;
        const availableTrackers = totalTrackers - connectedTrackers;

        document.getElementById('totalTrackers').textContent = totalTrackers;
        document.getElementById('connectedTrackers').textContent =
            connectedTrackers;
        document.getElementById('availableTrackers').textContent =
            availableTrackers;
    }

    showUnlinkModal() {
        document.getElementById('unlinkModal').style.display = 'block';
        document.getElementById('confirmUnlink').onclick = () =>
            this.performUnlink();
    }

    hideUnlinkModal() {
        document.getElementById('unlinkModal').style.display = 'none';
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
        document.getElementById('trackersTableBody').innerHTML = '';
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
            <i class="fas fa-${
                type === 'success' ? 'check' : 'exclamation'
            }-circle"></i>
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
`;
document.head.appendChild(style);

// Khởi tạo ứng dụng
const trackerManager = new TrackerManager();

function onChangeBeaconPageClicked() {
    window.location.href = '/beacon.html';
}

function onChangeMainPageClicked() {
    window.location.href = '/index.html';
}

function onChangeAlarmAreaPageClicked() {
    window.location.href = '/alarmArea.html';
}
