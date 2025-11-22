const userModel = require('./models/user.model');
const alarmModel = require('./models/alarm.model');
const alarmAreaModel = require('./models/alarmArea.model');
const beaconModel = require('./models/beacon.model');
const trackerModel = require('./models/tracker.model');
const historyModel = require('./models/history.model');

class DataSocket {
    data = {};

    constructor() {
        this.data = {
            beacons: [],
            alarmAreas: [],
            trackersAndUsers: [],
            alarms: [],
        };
    }

    async init() {
        this.data.beacons = await this.getBeacons();
        this.data.alarmAreas = await this.getAlarmAreas();
        this.data.trackersAndUsers = await this.getTrackersAndUsers();
        this.data.alarms = await this.getAlarmsByDateRange();

        return this.data;
    }

    async getBeacons() {
        return await beaconModel.getAllBeacons();
    }

    async getAlarmAreas() {
        return await alarmAreaModel.getAllAlarmAreas();
    }

    async getTrackersAndUsers() {
        let result = [];
        try {
            const users = await userModel.getAllUsers();
            const trackers = await trackerModel.getAllTrackers();

            for (const user of users) {
                if (
                    user.TrackerId !== null &&
                    user.TrackerId !== undefined &&
                    user.TrackerId !== ''
                ) {
                    const find = trackers.find(
                        (tracker) => tracker.TrackerId === user.TrackerId,
                    );

                    if (find) {
                        const histories =
                            await historyModel.getHistoriesByCCCDAndDeviceId(
                                user.CCCD,
                                find.DeviceId,
                                user.DateCheckIn,
                            );

                        const obj = {
                            ...user,
                            ...find,
                            history: [...histories],
                        };

                        result.push(obj);
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }

        return result;
    }

    async getAlarmsByDateRange() {
        return await alarmModel.getAllAlarms();
    }
}

module.exports = new DataSocket();
