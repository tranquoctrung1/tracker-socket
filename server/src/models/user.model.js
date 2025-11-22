const database = require('../config/database');
const { ObjectId } = require('mongodb');

class UserModel {
    constructor() {
        this.collectionName = 'user';
    }

    async getCollection() {
        const db = database.getDatabase();
        return db.collection(this.collectionName);
    }

    async createUser(userData) {
        try {
            userData.DateCheckIn = new Date(userData.DateCheckIn);
            userData.DateCheckOut = new Date(userData.DateCheckOut);

            const collection = await this.getCollection();
            const result = await collection.insertOne({
                ...userData,
            });
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const collection = await this.getCollection();
            const users = await collection.find({}).toArray();
            return users;
        } catch (error) {
            throw error;
        }
    }

    async getUserById(id) {
        try {
            const collection = await this.getCollection();
            const user = await collection.findOne({ _id: id });
            return user;
        } catch (error) {
            throw error;
        }
    }

    async updateUser(id, updateData) {
        try {
            const collection = await this.getCollection();
            const result = await collection.updateOne(
                { _id: id },
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

    async deleteUser(id) {
        try {
            const collection = await this.getCollection();
            const result = await collection.deleteOne({ _id: id });
            return result;
        } catch (error) {
            throw error;
        }
    }

    async findUserByCCCD(cccd) {
        try {
            const collection = await this.getCollection();
            const user = await collection.findOne({ CCCD: cccd });
            return user;
        } catch (error) {
            throw error;
        }
    }

    async getUserByTrackerId(trackerId) {
        try {
            const collection = await this.getCollection();
            const user = await collection.findOne({ TrackerId: trackerId });
            return user;
        } catch (error) {
            throw error;
        }
    }

    async updateUserTrackerId(userId, trackerId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        TrackerId: trackerId,
                    },
                },
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async removeTrackerId(userId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        TrackerId: '',
                    },
                },
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getAllUsersWithTrackers() {
        try {
            const collection = await this.getCollection();
            const users = await collection
                .find({
                    TrackerId: { $exists: true, $ne: '' },
                })
                .toArray();
            return users;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserModel();
