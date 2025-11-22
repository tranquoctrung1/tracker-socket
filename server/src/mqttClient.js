// mqttClient.js
const mqtt = require('mqtt');
const { EventEmitter } = require('events');

const socketManager = require('./socketManager');

const userModel = require('./models/user.model');
const alarmModel = require('./models/alarm.model');
const alarmAreaModel = require('./models/alarmArea.model');
const beaconModel = require('./models/beacon.model');
const trackerModel = require('./models/tracker.model');
const historyModel = require('./models/history.model');

class MQTTClient extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.isConnected = false;
        this.options = {
            host: process.env.MQTT_HOST || 'mqtt://localhost',
            port: process.env.MQTT_PORT || 1883,
            username: process.env.MQTT_USERNAME || '',
            password: process.env.MQTT_PASSWORD || '',
            clientId:
                'express_server_' + Math.random().toString(16).substr(2, 8),
        };
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.client = mqtt.connect(this.options.host, {
                    port: this.options.port,
                    username: this.options.username,
                    password: this.options.password,
                    clientId: this.options.clientId,
                    clean: true,
                    connectTimeout: 4000,
                    reconnectPeriod: 1000,
                });

                this.client.on('connect', () => {
                    console.log('✅ MQTT Connected to', this.options.host);
                    this.isConnected = true;
                    this.emit('connected');
                    resolve(this.client);
                });

                this.client.on('message', async (topic, message) => {
                    try {
                        const payload = message.toString();
                        let data;

                        // Try to parse as JSON, otherwise use as string
                        try {
                            data = JSON.parse(payload);
                        } catch {
                            data = payload;
                        }

                        // insert to history
                        const deviceId = data.deviceInfo.devEui;
                        const beaconId = data.object.ID;

                        if (
                            beaconId !== null &&
                            beaconId !== undefined &&
                            beaconId !== ''
                        ) {
                            const beacon =
                                await beaconModel.getBeaconByBeaconId(beaconId);
                            if (beacon !== null && beacon !== undefined) {
                                const tracker =
                                    await trackerModel.getTrackerByDeviceId(
                                        deviceId,
                                    );
                                if (tracker !== null && tracker !== undefined) {
                                    if (
                                        tracker.TrackerId !== null &&
                                        tracker.TrackerId !== undefined &&
                                        tracker.TrackerId !== ''
                                    ) {
                                        const user =
                                            await userModel.getUserByTrackerId(
                                                tracker.TrackerId,
                                            );

                                        if (
                                            user !== null &&
                                            user !== undefined
                                        ) {
                                            if (
                                                user.CCCD !== null &&
                                                user.CCCD !== undefined &&
                                                user.CCCD !== ''
                                            ) {
                                                const history =
                                                    await historyModel.getHistoriesByCCCDAndDeviceId(
                                                        user.CCCD,
                                                        deviceId,
                                                        user.DateCheckIn,
                                                    );
                                                if (history.length > 0) {
                                                    const latest =
                                                        history[
                                                            history.length - 1
                                                        ];
                                                    if (
                                                        latest.Floor !==
                                                            beacon.Floor ||
                                                        latest.Location !==
                                                            beacon.Room
                                                    ) {
                                                        const randomx =
                                                            Math.floor(
                                                                Math.random() *
                                                                    21,
                                                            ) - 10;
                                                        const randomy =
                                                            Math.floor(
                                                                Math.random() *
                                                                    21,
                                                            ) - 10;
                                                        const obj = {
                                                            CCCD: user.CCCD,
                                                            Name: user.Name,
                                                            DeviceId: deviceId,
                                                            TimeStamp: new Date(
                                                                Date.now(),
                                                            ),
                                                            Floor: beacon.Floor,
                                                            Location:
                                                                beacon.Room,
                                                            x:
                                                                beacon.x +
                                                                randomx,
                                                            y:
                                                                beacon.y +
                                                                randomy,
                                                        };

                                                        console.log(
                                                            `insert a history for ${user.Name}`,
                                                        );

                                                        const result =
                                                            await historyModel.createHistory(
                                                                obj,
                                                            );

                                                        if (
                                                            result !== null &&
                                                            result !== undefined
                                                        ) {
                                                            if (
                                                                result.insertedId !==
                                                                    null &&
                                                                result.insertedId !==
                                                                    undefined
                                                            ) {
                                                                socketManager.sendToClients(
                                                                    {
                                                                        type: 'DATA_UPDATE_HISTORY',
                                                                        message:
                                                                            obj,
                                                                    },
                                                                );
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    const randomx =
                                                        Math.floor(
                                                            Math.random() * 21,
                                                        ) - 10;
                                                    const randomy =
                                                        Math.floor(
                                                            Math.random() * 21,
                                                        ) - 10;
                                                    const obj = {
                                                        CCCD: user.CCCD,
                                                        Name: user.Name,
                                                        DeviceId: deviceId,
                                                        TimeStamp: new Date(
                                                            Date.now(),
                                                        ),
                                                        Floor: beacon.Floor,
                                                        Location: beacon.Room,
                                                        x: beacon.x + randomx,
                                                        y: beacon.y + randomy,
                                                    };

                                                    console.log(
                                                        `insert a history for ${user.Name}`,
                                                    );

                                                    const result =
                                                        await historyModel.createHistory(
                                                            obj,
                                                        );

                                                    if (
                                                        result !== null &&
                                                        result !== undefined
                                                    ) {
                                                        if (
                                                            result.insertedId !==
                                                                null &&
                                                            result.insertedId !==
                                                                undefined
                                                        ) {
                                                            socketManager.sendToClients(
                                                                {
                                                                    type: 'DATA_UPDATE_HISTORY',
                                                                    message:
                                                                        obj,
                                                                },
                                                            );
                                                        }
                                                    }
                                                }

                                                // alarm
                                                const alarmArea =
                                                    await alarmAreaModel.getAllAlarmAreas();
                                                if (alarmArea.length > 0) {
                                                    for (const area of alarmArea) {
                                                        if (
                                                            beacon.Floor ===
                                                            area.Floor
                                                        ) {
                                                            if (
                                                                beacon.x >=
                                                                    area.x_min &&
                                                                beacon.x <=
                                                                    area.x_max &&
                                                                beacon.y >=
                                                                    area.y_min &&
                                                                beacon.y <=
                                                                    area.y_max
                                                            ) {
                                                                const obj = {
                                                                    CCCD: user.CCCD,
                                                                    Name: user.Name,
                                                                    DateAlarm:
                                                                        new Date(
                                                                            Date.now(),
                                                                        ),
                                                                    TrackerId:
                                                                        user.TrackerId,
                                                                    DeviceId:
                                                                        tracker.DeviceId,
                                                                    BeaconId:
                                                                        beaconId,
                                                                    Floor: beacon.Floor,
                                                                    Location:
                                                                        beacon.Room,
                                                                    Type: 'XÂM NHẬP',
                                                                };

                                                                console.log(
                                                                    `insert alarm for ${user.Name}`,
                                                                );

                                                                const result =
                                                                    await alarmModel.createAlarm(
                                                                        obj,
                                                                    );

                                                                if (
                                                                    result !==
                                                                    null
                                                                ) {
                                                                    if (
                                                                        result.insertedId !==
                                                                            null &&
                                                                        result.insertedId !==
                                                                            undefined
                                                                    ) {
                                                                        socketManager.sendToClients(
                                                                            {
                                                                                type: 'DATA_UPDATE_ALARM',
                                                                                message:
                                                                                    obj,
                                                                            },
                                                                        );
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // console.log(
                        //     `📨 MQTT Message received on ${topic}:`,
                        //     data,
                        // );
                        this.emit('message', { topic, data });
                    } catch (error) {
                        console.error('Error processing MQTT message:', error);
                    }
                });

                this.client.on('error', (error) => {
                    console.error('❌ MQTT Error:', error);
                    this.emit('error', error);
                    reject(error);
                });

                this.client.on('close', () => {
                    console.log('🔌 MQTT Connection closed');
                    this.isConnected = false;
                    this.emit('disconnected');
                });

                this.client.on('offline', () => {
                    console.log('📴 MQTT Client offline');
                    this.isConnected = false;
                    this.emit('offline');
                });

                this.client.on('reconnect', () => {
                    console.log('🔄 MQTT Reconnecting...');
                    this.emit('reconnecting');
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    subscribe(topic, options = { qos: 0 }) {
        if (!this.isConnected) {
            console.error('MQTT client not connected');
        }

        return new Promise((resolve, reject) => {
            this.client.subscribe(topic, options, (err) => {
                if (err) {
                    console.error(`❌ Failed to subscribe to ${topic}:`, err);
                    reject(err);
                } else {
                    console.log(`✅ Subscribed to topic: ${topic}`);
                    resolve();
                }
            });
        });
    }

    unsubscribe(topic) {
        if (!this.isConnected) {
            console.error('MQTT client not connected');
        }

        return new Promise((resolve, reject) => {
            this.client.unsubscribe(topic, (err) => {
                if (err) {
                    console.error(
                        `❌ Failed to unsubscribe from ${topic}:`,
                        err,
                    );
                    reject(err);
                } else {
                    console.log(`✅ Unsubscribed from topic: ${topic}`);
                    resolve();
                }
            });
        });
    }

    publish(topic, message, options = { qos: 0, retain: false }) {
        if (!this.isConnected) {
            console.error('MQTT client not connected');
        }

        const payload =
            typeof message === 'object' ? JSON.stringify(message) : message;

        return new Promise((resolve, reject) => {
            this.client.publish(topic, payload, options, (err) => {
                if (err) {
                    console.error(`❌ Failed to publish to ${topic}:`, err);
                    reject(err);
                } else {
                    console.log(`✅ Published to ${topic}:`, message);
                    resolve();
                }
            });
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end();
            this.isConnected = false;
            console.log('🔌 MQTT Disconnected');
        }
    }

    getClient() {
        return this.client;
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create singleton instance
const mqttClient = new MQTTClient();
module.exports = mqttClient;
