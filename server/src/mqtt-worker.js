const mqtt = require('mqtt');
const { MongoClient } = require('mongodb');

class MQTTWorker {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.options = {
            host: process.env.MQTT_HOST || 'mqtt://localhost',
            port: process.env.MQTT_PORT || 1883,
            username: process.env.MQTT_USERNAME || '',
            password: process.env.MQTT_PASSWORD || '',
            clientId: 'mqtt_worker_' + Math.random().toString(16).substr(2, 8),
        };

        this.mongoClient = null;
        this.db = null;

        // Initialize database connection
        this.initDatabase();

        // Handle parent messages
        process.on('message', this.handleParentMessage.bind(this));
    }

    async initDatabase() {
        try {
            this.mongoClient = new MongoClient(
                process.env.MONGODB_URI || 'mongodb://localhost:27017',
            );
            await this.mongoClient.connect();
            this.db = this.mongoClient.db();
            console.log('✅ MQTT Worker connected to database');
        } catch (err) {
            console.error('❌ MQTT Worker database connection failed:', err);
        }
    }

    connect() {
        console.log('🔌 MQTT Worker trying to connect...');

        try {
            this.client = mqtt.connect(this.options.host, {
                port: this.options.port,
                username: this.options.username,
                password: this.options.password,
                clientId: this.options.clientId,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 0,
            });
        } catch (err) {
            console.error('❌ MQTT Worker connect error:', err);
            this.retryConnect();
            return;
        }

        this.client.on('connect', () => {
            console.log('✅ MQTT Worker Connected!');
            this.isConnected = true;
            process.send({ type: 'mqtt_connected' });
        });

        this.client.on('message', async (topic, message) => {
            await this.handleMessage(topic, message);
        });

        this.client.on('error', (err) => {
            console.error('❌ MQTT Worker Error:', err.message);
            process.send({ type: 'mqtt_error', error: err.message });
            this.retryConnect();
        });

        this.client.on('close', () => {
            console.log('🔌 MQTT Worker Connection closed');
            this.isConnected = false;
            process.send({ type: 'mqtt_disconnected' });
            this.retryConnect();
        });

        this.client.on('offline', () => {
            console.log('📴 MQTT Worker offline');
            this.isConnected = false;
            process.send({ type: 'mqtt_offline' });
        });
    }

    async handleMessage(topic, message) {
        try {
            const payload = message.toString();
            let data;

            try {
                data = JSON.parse(payload);
            } catch {
                data = payload;
            }

            // Process the message (your existing logic)
            const deviceId = data.deviceInfo.devEui;
            const beaconId = data.object.ID;

            if (beaconId && this.db) {
                // Get beacon
                const beacon = await this.db
                    .collection('beacons')
                    .findOne({ beaconId: beaconId });
                if (beacon) {
                    // Get tracker
                    const tracker = await this.db
                        .collection('trackers')
                        .findOne({ deviceId: deviceId });
                    if (tracker && tracker.TrackerId) {
                        // Get user
                        const user = await this.db
                            .collection('users')
                            .findOne({ TrackerId: tracker.TrackerId });
                        if (user && user.CCCD) {
                            // Process history and alarms
                            const now = new Date();

                            // Check history
                            const histories = await this.db
                                .collection('histories')
                                .find({
                                    CCCD: user.CCCD,
                                    DeviceId: deviceId,
                                    TimeStamp: { $gte: user.DateCheckIn },
                                })
                                .sort({ TimeStamp: -1 })
                                .toArray();

                            if (histories.length > 0) {
                                const latest = histories[0];
                                if (
                                    latest.Floor !== beacon.Floor ||
                                    latest.Location !== beacon.Room
                                ) {
                                    await this.createHistory(
                                        user,
                                        deviceId,
                                        beacon,
                                    );
                                }
                            } else {
                                await this.createHistory(
                                    user,
                                    deviceId,
                                    beacon,
                                );
                            }

                            // Check alarm areas
                            const alarmAreas = await this.db
                                .collection('alarmAreas')
                                .find()
                                .toArray();
                            for (const area of alarmAreas) {
                                if (beacon.Floor === area.Floor) {
                                    if (
                                        beacon.x >= area.x_min &&
                                        beacon.x <= area.x_max &&
                                        beacon.y >= area.y_min &&
                                        beacon.y <= area.y_max
                                    ) {
                                        await this.createAlarm(
                                            user,
                                            tracker,
                                            beaconId,
                                            beacon,
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Send data to parent process
            process.send({
                type: 'mqtt_message',
                topic: topic,
                data: data,
            });
        } catch (error) {
            console.error('Error processing MQTT message:', error);
        }
    }

    async createHistory(user, deviceId, beacon) {
        const randomx = Math.floor(Math.random() * 21) - 10;
        const randomy = Math.floor(Math.random() * 21) - 10;

        const historyObj = {
            CCCD: user.CCCD,
            Name: user.Name,
            DeviceId: deviceId,
            TimeStamp: new Date(),
            Floor: beacon.Floor,
            Location: beacon.Room,
            x: beacon.x + randomx,
            y: beacon.y + randomy,
        };

        const result = await this.db
            .collection('histories')
            .insertOne(historyObj);

        if (result.insertedId) {
            process.send({
                type: 'history_created',
                data: historyObj,
            });
        }
    }

    async createAlarm(user, tracker, beaconId, beacon) {
        const alarmObj = {
            CCCD: user.CCCD,
            Name: user.Name,
            DateAlarm: new Date(),
            TrackerId: user.TrackerId,
            DeviceId: tracker.DeviceId,
            BeaconId: beaconId,
            Floor: beacon.Floor,
            Location: beacon.Room,
            Type: 'XÂM NHẬP',
        };

        const result = await this.db.collection('alarms').insertOne(alarmObj);

        if (result.insertedId) {
            process.send({
                type: 'alarm_created',
                data: alarmObj,
            });
        }
    }

    retryConnect() {
        console.log('⏳ MQTT Worker retrying in 5 seconds...');
        setTimeout(() => {
            this.connect();
        }, 5000);
    }

    handleParentMessage(message) {
        if (!this.client || !this.isConnected) return;

        switch (message.type) {
            case 'subscribe':
                this.client.subscribe(
                    message.topic,
                    message.options || { qos: 0 },
                    (err) => {
                        if (err) {
                            console.error(
                                `❌ Failed to subscribe to ${message.topic}:`,
                                err,
                            );
                        } else {
                            console.log(
                                `✅ Subscribed to topic: ${message.topic}`,
                            );
                        }
                    },
                );
                break;

            case 'publish':
                const payload =
                    typeof message.message === 'object'
                        ? JSON.stringify(message.message)
                        : message.message;

                this.client.publish(
                    message.topic,
                    payload,
                    message.options || { qos: 0, retain: false },
                    (err) => {
                        if (err) {
                            console.error(
                                `❌ Failed to publish to ${message.topic}:`,
                                err,
                            );
                        } else {
                            console.log(
                                `✅ Published to ${message.topic}:`,
                                message.message,
                            );
                        }
                    },
                );
                break;

            case 'unsubscribe':
                this.client.unsubscribe(message.topic, (err) => {
                    if (err) {
                        console.error(
                            `❌ Failed to unsubscribe from ${message.topic}:`,
                            err,
                        );
                    } else {
                        console.log(
                            `✅ Unsubscribed from topic: ${message.topic}`,
                        );
                    }
                });
                break;

            case 'disconnect':
                if (this.client) {
                    this.client.end();
                }
                if (this.mongoClient) {
                    this.mongoClient.close();
                }
                process.exit(0);
                break;
        }
    }
}

// Start the worker
const worker = new MQTTWorker();
worker.connect();

// Handle cleanup
process.on('disconnect', () => {
    if (worker.client) {
        worker.client.end();
    }
    if (worker.mongoClient) {
        worker.mongoClient.close();
    }
});
