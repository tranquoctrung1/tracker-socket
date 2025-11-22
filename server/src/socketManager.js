// websocketManager.js
const dataSocket = require('./dataSocket');
//
class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Store clients with IDs
    }

    initialize(wss) {
        this.wss = wss;

        this.wss.on('connection', async (ws) => {
            console.log('New WebSocket connection');

            // Generate unique ID for client
            const clientId = this.generateClientId();
            ws.id = clientId;
            this.clients.set(clientId, ws);

            // Send welcome message with client ID
            ws.send(
                JSON.stringify({
                    type: 'DATA',
                    message: await dataSocket.init(),
                    clientId,
                }),
            );

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(clientId, message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            ws.on('close', () => {
                console.log(`Client ${clientId} disconnected`);
                this.clients.delete(clientId);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
                this.clients.delete(clientId);
            });
        });
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    handleMessage(clientId, message) {
        console.log(`Message from ${clientId}:`, message);

        // Handle different message types
        switch (message.type) {
            case 'PING':
                this.sendToClient(clientId, {
                    type: 'PONG',
                    timestamp: Date.now(),
                });
                break;
            case 'BROADCAST':
                this.broadcast({
                    type: 'BROADCAST_MESSAGE',
                    from: clientId,
                    data: message.data,
                });
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    // Broadcast to all connected clients
    broadcast(message) {
        if (!this.wss) return;

        const messageString = JSON.stringify(message);

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    }

    // Send to specific client
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // Send to multiple clients
    sendToClients(message) {
        const messageString = JSON.stringify(message);
        let sentCount = 0;

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });

        return sentCount;
    }

    // Get all connected client IDs
    getConnectedClients() {
        return Array.from(this.clients.keys());
    }

    // Get number of connected clients
    getClientCount() {
        return this.clients.size;
    }

    // Check if client is connected
    isClientConnected(clientId) {
        const client = this.clients.get(clientId);
        return client && client.readyState === WebSocket.OPEN;
    }
}

// Create singleton instance
const websocketManager = new WebSocketManager();
module.exports = websocketManager;
