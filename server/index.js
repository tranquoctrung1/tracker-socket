// In your main server file (index.js/server.js)
require('dotenv').config();
const { fork } = require('child_process');
const path = require('path');

const app = require('./src/app');
const database = require('./src/config/database');
const socketManager = require('./src/socketManager'); // Updated manager

const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Create MQTT worker
const mqttWorker = fork(path.join(__dirname, './src/mqtt-worker.js'));

async function startServer() {
    try {
        await database.connect();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // Start WebSocket Server
        const wss = new WebSocket.Server({ server });

        // Initialize socket manager with MQTT worker
        socketManager.initialize(wss, mqttWorker);

        // Store in app for routes
        app.set('wss', wss);
        app.set('mqttWorker', mqttWorker);
        app.set('socketManager', socketManager);

        // Handle messages from MQTT worker and forward to socket manager
        mqttWorker.on('message', (msg) => {
            socketManager.handleMqttMessage(msg);
        });

        // Restart worker if it crashes
        mqttWorker.on('exit', (code) => {
            console.log(`MQTT worker exited with code ${code}`);
            socketManager.broadcast({
                type: 'mqtt_status',
                status: 'disconnected',
                timestamp: new Date().toISOString(),
            });
        });

        // Optional: Add REST endpoint to check MQTT status
        app.get('/mqtt-status', (req, res) => {
            res.json({
                connected: mqttWorker.connected,
                socketClients: socketManager.getClientCount(),
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');

    if (mqttWorker && mqttWorker.connected) {
        mqttWorker.send({ type: 'disconnect' });
    }

    await database.close();

    setTimeout(() => {
        console.log('Server shutdown complete');
        process.exit(0);
    }, 1000);
});

startServer();
