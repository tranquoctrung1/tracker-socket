const database = require('../config/database');
const { ObjectId } = require('mongodb');

class HistoryModel {
    constructor() {
        this.collectionName = 'history';
    }

    async getCollection() {
        const db = database.getDatabase();
        return db.collection(this.collectionName);
    }

    async createHistory(historyData) {
        try {
            const collection = await this.getCollection();
            const result = await collection.insertOne({
                ...historyData,
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllHistories() {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({})
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoryById(id) {
        try {
            const collection = await this.getCollection();
            const history = await collection.findOne({ _id: new ObjectId(id) });
            return history;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByCCCD(cccd) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({ CCCD: cccd })
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByDeviceId(deviceId) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({ DeviceId: deviceId })
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByFloor(floor) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({ Floor: floor })
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByCCCDAndDeviceId(cccd, deviceId, startDate) {
        try {
            const collection = await this.getCollection();

            const histories = await collection
                .find({
                    TimeStamp: {
                        $gte: startDate,
                    },
                    CCCD: cccd,
                    DeviceId: deviceId,
                })
                .sort({ TimeStamp: 1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByDateRange(startDate, endDate) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({
                    TimeStamp: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                })
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByLocation(location) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({ Location: location })
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async updateHistory(id, updateData) {
        try {
            const collection = await this.getCollection();
            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        ...updateData,
                    },
                },
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async deleteHistory(id) {
        try {
            const collection = await this.getCollection();
            const result = await collection.deleteOne({
                _id: new ObjectId(id),
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    async searchHistories(query) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({
                    $or: [
                        { CCCD: { $regex: query, $options: 'i' } },
                        { Name: { $regex: query, $options: 'i' } },
                        { DeviceId: { $regex: query, $options: 'i' } },
                        { Floor: { $regex: query, $options: 'i' } },
                        { Location: { $regex: query, $options: 'i' } },
                    ],
                })
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getRecentHistories(limit = 100) {
        try {
            const collection = await this.getCollection();
            const histories = await collection
                .find({})
                .sort({ TimeStamp: -1 })
                .limit(parseInt(limit))
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByPerson(cccd, startDate, endDate) {
        try {
            const collection = await this.getCollection();
            const query = { CCCD: cccd };

            if (startDate && endDate) {
                query.TimeStamp = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }

            const histories = await collection
                .find(query)
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }

    async getHistoriesByDevice(deviceId, startDate, endDate) {
        try {
            const collection = await this.getCollection();
            const query = { DeviceId: deviceId };

            if (startDate && endDate) {
                query.TimeStamp = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }

            const histories = await collection
                .find(query)
                .sort({ TimeStamp: -1 })
                .toArray();
            return histories;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new HistoryModel();
