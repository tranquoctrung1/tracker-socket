// main.js
class WebSocketWorkerManager {
    constructor() {
        this.worker = new Worker('./js/webworker.js');
        this.setupMessageHandling();
        this.initializeWebSocket();
    }

    setupMessageHandling() {
        this.worker.onmessage = (event) => {
            const { type, payload, status, error } = event.data;

            switch (type) {
                case 'WS_MESSAGE':
                    this.handleWebSocketMessage(payload);
                    break;

                case 'WS_STATUS':
                    if (status === 'connected') {
                        statusElement.innerHTML = 'Đã kết nối';
                    }
                    break;

                case 'WS_ERROR':
                    console.error('WebSocket error:', error);
                    statusElement.innerHTML = 'Mất kết nối';

                    this.handleError(error);
                    break;

                default:
                    console.log('Unknown message from worker:', type);
            }
        };

        this.worker.onerror = (error) => {
            console.error('Web Worker error:', error);
        };
    }

    initializeWebSocket() {
        // Send initialization message to worker
        this.worker.postMessage({ type: 'INIT_WS' });
    }

    handleWebSocketMessage(message) {
        // Handle different message types from server
        switch (message.type) {
            case 'INFO':
                // Update UI or perform actions based on INFO message
                break;

            case 'DATA':
                // Handle data updates
                this.updateData(message);
                break;
            case 'DATA_UPDATE_HISTORY':
                // Handle data updates
                this.updateHistory(message);
                break;
            case `DATA_UPDATE_ALARM`:
                // Handle data updates
                this.updateAlarm(message);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    handleError(error) {
        // Handle errors appropriately
        console.error('WebSocket error occurred:', error);
    }

    updateAlarm(data) {
        updateTrackerAlarm(data.message);
    }

    updateHistory(data) {
        if (data.message !== null && data.message !== undefined) {
            const findIndex = trackers_users.findIndex(
                (el) => el.DeviceId === data.message.DeviceId,
            );

            if (findIndex !== -1) {
                trackers_users[findIndex].history.push(data.message);

                updateDataTrackerAndUsersForUpdateHistory(data.message);
            }
        }
    }

    updateData(data) {
        beaconId = [...data.message.beacons];
        FORBIDDEN_AREAS = [...data.message.alarmAreas];
        trackers_users = [...data.message.trackersAndUsers];

        drawForbiddenAreas();
        updateDataTrackerAndUsers();
    }

    sendMessage(message) {
        // Send message to server via worker
        this.worker.postMessage({
            type: 'SEND_MESSAGE',
            payload: message,
        });
    }

    closeConnection() {
        // Close WebSocket connection
        this.worker.postMessage({ type: 'CLOSE_WS' });
    }
}
