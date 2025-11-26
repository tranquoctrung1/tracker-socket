const database = require('../config/database');
const { ObjectId } = require('mongodb');

class RoomModel {
    constructor() {
        this.collectionName = 'room';
    }

    async getCollection() {
        const db = database.getDatabase();
        return db.collection(this.collectionName);
    }

    async createRoom(roomData) {
        try {
            const collection = await this.getCollection();
            const result = await collection.insertOne({
                ...roomData,
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllRooms() {
        try {
            const collection = await this.getCollection();
            const rooms = await collection.find({}).toArray();
            return rooms;
        } catch (error) {
            throw error;
        }
    }

    async getRoomHasXYMax() {
        try {
            const collection = await this.getCollection();
            const rooms = await collection
                .find({
                    x_max: { $ne: null },
                    y_max: { $ne: null },
                    x_min: { $ne: null },
                    y_min: { $ne: null },
                })
                .toArray();
            return rooms;
        } catch (error) {
            throw error;
        }
    }

    async getRoomById(id) {
        try {
            const collection = await this.getCollection();
            const room = await collection.findOne({ _id: new ObjectId(id) });
            return room;
        } catch (error) {
            throw error;
        }
    }

    async getRoomByName(name) {
        try {
            const collection = await this.getCollection();
            const room = await collection.findOne({ Name: name });
            return room;
        } catch (error) {
            throw error;
        }
    }

    async getRoomsByFloor(floor) {
        try {
            const collection = await this.getCollection();
            const rooms = await collection.find({ Floor: floor }).toArray();
            return rooms;
        } catch (error) {
            throw error;
        }
    }

    async updateRoom(id, updateData) {
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

    async deleteRoom(id) {
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

    async searchRooms(query) {
        try {
            const collection = await this.getCollection();
            const rooms = await collection
                .find({
                    $or: [
                        { Name: { $regex: query, $options: 'i' } },
                        { Floor: { $regex: query, $options: 'i' } },
                    ],
                })
                .toArray();
            return rooms;
        } catch (error) {
            throw error;
        }
    }

    async getRoomsByCoordinates(x, y) {
        try {
            const collection = await this.getCollection();
            const rooms = await collection
                .find({
                    x_min: { $lte: x },
                    x_max: { $gte: x },
                    y_min: { $lte: y },
                    y_max: { $gte: y },
                })
                .toArray();
            return rooms;
        } catch (error) {
            throw error;
        }
    }

    async getRoomsByArea(minArea, maxArea) {
        try {
            const collection = await this.getCollection();
            const rooms = await collection
                .find({
                    $expr: {
                        $and: [
                            {
                                $gte: [
                                    {
                                        $multiply: [
                                            { $subtract: ['$x_max', '$x_min'] },
                                            { $subtract: ['$y_max', '$y_min'] },
                                        ],
                                    },
                                    minArea,
                                ],
                            },
                            {
                                $lte: [
                                    {
                                        $multiply: [
                                            { $subtract: ['$x_max', '$x_min'] },
                                            { $subtract: ['$y_max', '$y_min'] },
                                        ],
                                    },
                                    maxArea,
                                ],
                            },
                        ],
                    },
                })
                .toArray();
            return rooms;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new RoomModel();
