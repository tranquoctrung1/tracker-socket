require('dotenv').config();

const app = require('./src/app');
const database = require('./src/config/database');
const mqttClient = require('./src/mqttClient');

const socketManager = require('./src/socketManager');

const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
    try {
        // Connect to database first
        await database.connect();

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // 2. Start WebSocket Server
        const wss = new WebSocket.Server({ server });

        // 3. VITAL: Attach 'wss' to the Express app so routes can access it
        app.set('wss', wss);
        app.set('mqttClient', mqttClient);

        mqttClient.connect().then((_) => {
            mqttClient.subscribe(process.env.TOPIC);
        });

        socketManager.initialize(wss);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    await database.close();
    process.exit(0);
});

// Start the application
startServer();
