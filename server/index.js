require('dotenv').config();
const { fork } = require('child_process');
const path = require('path');

const app = require('./src/app');
const database = require('./src/config/database');
const socketManager = require('./src/socketManager'); // Updated manager

const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Biến toàn cục để lưu trạng thái
let mqttWorker = null;
let server = null;
let wss = null;

async function startServer() {
    try {
        await database.connect();

        server = app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });

        // Start WebSocket Server
        wss = new WebSocket.Server({ server });

        // Create MQTT worker
        mqttWorker = fork(path.join(__dirname, './src/mqtt-worker.js'));

        console.log('🚀 MQTT Worker started with PID:', mqttWorker.pid);

        // Khởi tạo socket manager với MQTT worker
        socketManager.initialize(wss, mqttWorker);

        // Store in app for routes
        app.set('wss', wss);
        app.set('mqttWorker', mqttWorker);
        app.set('socketManager', socketManager);

        // Xử lý messages từ MQTT worker
        mqttWorker.on('message', (msg) => {
            // Forward message to socket manager
            socketManager.handleMqttMessage(msg);

            // Xử lý một số message cụ thể
            handleMqttWorkerMessage(msg);
        });

        mqttWorker.on('error', (error) => {
            socketManager.broadcast({
                type: 'mqtt_status',
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        });

        mqttWorker.on('exit', (code, signal) => {
            socketManager.broadcast({
                type: 'mqtt_status',
                status: 'disconnected',
                code: code,
                signal: signal,
                timestamp: new Date().toISOString(),
            });

            // Tự động restart worker sau 5 giây
            if (code !== 0 && signal !== 'SIGINT') {
                setTimeout(() => {
                    restartMqttWorker();
                }, 5000);
            }
        });

        mqttWorker.on('disconnect', () => {
            console.log('🔌 MQTT worker disconnected');
        });

        // Gửi lệnh subscribe đến worker sau khi khởi động
        setTimeout(() => {
            subscribeToTopics();
        }, 2000);

        // REST endpoints cho MQTT
        setupMqttEndpoints();

        // Broadcast server status
        socketManager.broadcast({
            type: 'server_status',
            status: 'running',
            port: PORT,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

function handleMqttWorkerMessage(msg) {
    switch (msg.type) {
        case 'worker_ready':
            break;

        case 'mqtt_connected':
            socketManager.broadcast({
                type: 'mqtt_status',
                status: 'connected',
                timestamp: new Date().toISOString(),
            });
            break;

        case 'mqtt_disconnected':
            socketManager.broadcast({
                type: 'mqtt_status',
                status: 'disconnected',
                timestamp: new Date().toISOString(),
            });
            break;

        case 'mqtt_error':
            socketManager.broadcast({
                type: 'mqtt_status',
                status: 'error',
                error: msg.error,
                timestamp: new Date().toISOString(),
            });
            break;

        case 'mqtt_message':
            // Log số lượng message nhận được
            break;

        case 'history_created':
            break;

        case 'alarm_created':
            break;

        case 'subscribed':
            break;

        case 'published':
            break;
    }
}

function subscribeToTopics() {
    if (!mqttWorker || !mqttWorker.connected) {
        return;
    }

    // Các topics cần subscribe
    const topics = [process.env.TOPIC];

    topics.forEach((topic) => {
        mqttWorker.send({
            type: 'subscribe',
            topic: topic,
            options: { qos: 0 },
        });
    });
}

function setupMqttEndpoints() {
    // REST endpoint để check MQTT status
    app.get('/api/mqtt/status', (req, res) => {
        res.json({
            status: mqttWorker ? 'active' : 'inactive',
            pid: mqttWorker ? mqttWorker.pid : null,
            connected: mqttWorker ? mqttWorker.connected : false,
            socketClients: socketManager.getClientCount(),
            timestamp: new Date().toISOString(),
        });
    });

    // REST endpoint để publish message
    app.post('/api/mqtt/publish', (req, res) => {
        const { topic, message, qos = 0, retain = false } = req.body;

        if (!topic || !message) {
            return res.status(400).json({
                error: 'Topic and message are required',
            });
        }

        if (!mqttWorker || !mqttWorker.connected) {
            return res.status(503).json({
                error: 'MQTT worker not available',
            });
        }

        mqttWorker.send({
            type: 'publish',
            topic: topic,
            message: message,
            options: { qos: qos, retain: retain },
        });

        res.json({
            success: true,
            message: 'Publish request sent',
            topic: topic,
        });
    });

    // REST endpoint để subscribe topic
    app.post('/api/mqtt/subscribe', (req, res) => {
        const { topic, qos = 0 } = req.body;

        if (!topic) {
            return res.status(400).json({
                error: 'Topic is required',
            });
        }

        if (!mqttWorker || !mqttWorker.connected) {
            return res.status(503).json({
                error: 'MQTT worker not available',
            });
        }

        mqttWorker.send({
            type: 'subscribe',
            topic: topic,
            options: { qos: qos },
        });

        res.json({
            success: true,
            message: 'Subscribe request sent',
            topic: topic,
        });
    });

    // REST endpoint để unsubscribe topic
    app.post('/api/mqtt/unsubscribe', (req, res) => {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({
                error: 'Topic is required',
            });
        }

        if (!mqttWorker || !mqttWorker.connected) {
            return res.status(503).json({
                error: 'MQTT worker not available',
            });
        }

        mqttWorker.send({
            type: 'unsubscribe',
            topic: topic,
        });

        res.json({
            success: true,
            message: 'Unsubscribe request sent',
            topic: topic,
        });
    });

    // REST endpoint để restart MQTT worker
    app.post('/api/mqtt/restart', (req, res) => {
        if (!mqttWorker) {
            return res.status(400).json({
                error: 'MQTT worker not running',
            });
        }

        restartMqttWorker();

        res.json({
            success: true,
            message: 'MQTT worker restart initiated',
        });
    });

    // REST endpoint để test publish
    app.get('/api/mqtt/test', (req, res) => {
        if (!mqttWorker || !mqttWorker.connected) {
            return res.status(503).json({
                error: 'MQTT worker not available',
            });
        }

        const testMessage = {
            type: 'test',
            message: 'This is a test message from REST API',
            timestamp: new Date().toISOString(),
            server: 'Node.js Server',
        };

        mqttWorker.send({
            type: 'publish',
            topic: 'test/topic',
            message: testMessage,
            options: { qos: 0, retain: false },
        });

        res.json({
            success: true,
            message: 'Test message published',
            data: testMessage,
        });
    });

    // WebSocket endpoint để real-time MQTT data
    app.get('/api/mqtt/stream', (req, res) => {
        // Đây là endpoint cho WebSocket, nhưng có thể dùng cho SSE (Server-Sent Events)
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });

        // Gửi initial status
        res.write(
            `data: ${JSON.stringify({
                type: 'status',
                status: 'connected',
                timestamp: new Date().toISOString(),
            })}\n\n`,
        );

        // Listen for MQTT messages và gửi qua SSE
        const messageHandler = (msg) => {
            if (msg.type === 'mqtt_message') {
                res.write(`data: ${JSON.stringify(msg)}\n\n`);
            }
        };

        mqttWorker.on('message', messageHandler);

        // Cleanup khi client disconnect
        req.on('close', () => {
            mqttWorker.removeListener('message', messageHandler);
            console.log('SSE client disconnected');
        });
    });
}

function restartMqttWorker() {
    console.log('🔄 Restarting MQTT worker...');

    if (mqttWorker) {
        // Gửi lệnh disconnect
        mqttWorker.send({ type: 'disconnect' });

        // Đợi một chút rồi kill process cũ
        setTimeout(() => {
            if (mqttWorker) {
                mqttWorker.kill('SIGTERM');
            }

            // Tạo worker mới
            mqttWorker = fork(path.join(__dirname, './src/mqtt-worker.js'));

            console.log('✅ New MQTT worker started with PID:', mqttWorker.pid);

            // Thiết lập lại event listeners
            setupMqttWorkerListeners();
        }, 1000);
    }
}

function setupMqttWorkerListeners() {
    if (!mqttWorker) return;

    // Xử lý messages từ MQTT worker
    mqttWorker.on('message', (msg) => {
        console.log(`📨 Received from MQTT worker: ${msg.type}`);
        socketManager.handleMqttMessage(msg);
        handleMqttWorkerMessage(msg);
    });

    mqttWorker.on('error', (error) => {
        console.error('❌ MQTT Worker error:', error);
    });

    mqttWorker.on('exit', (code, signal) => {
        socketManager.broadcast({
            type: 'mqtt_status',
            status: 'disconnected',
            timestamp: new Date().toISOString(),
        });
    });

    // Subscribe lại các topics sau khi restart
    setTimeout(() => {
        subscribeToTopics();
    }, 3000);
}

// Graceful shutdown
async function gracefulShutdown() {
    // Thông báo cho clients
    socketManager.broadcast({
        type: 'server_status',
        status: 'shutting_down',
        timestamp: new Date().toISOString(),
    });

    // Tắt MQTT worker
    if (mqttWorker && mqttWorker.connected) {
        mqttWorker.send({ type: 'disconnect' });

        setTimeout(() => {
            if (mqttWorker) {
                mqttWorker.kill('SIGTERM');
            }
        }, 1000);
    }

    // Đóng database
    try {
        await database.close();
    } catch (error) {
        console.error('Error closing database:', error);
    }

    // Đóng WebSocket server
    if (wss) {
        wss.close();
    }

    // Đóng HTTP server
    if (server) {
        server.close(() => {
            process.exit(0);
        });

        // Force shutdown sau 10 giây
        setTimeout(() => {
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();
