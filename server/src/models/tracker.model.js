const database = require("../config/database");
const { ObjectId } = require("mongodb");

class TrackerModel {
  constructor() {
    this.collectionName = "tracker";
  }

  async getCollection() {
    const db = database.getDatabase();
    return db.collection(this.collectionName);
  }

  async createTracker(trackerData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne({
        ...trackerData,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllTrackers() {
    try {
      const collection = await this.getCollection();
      const trackers = await collection.find({}).toArray();
      return trackers;
    } catch (error) {
      throw error;
    }
  }

  async getTrackerById(id) {
    try {
      const collection = await this.getCollection();
      const tracker = await collection.findOne({ _id: new ObjectId(id) });
      return tracker;
    } catch (error) {
      throw error;
    }
  }

  async getTrackerByTrackerId(trackerId) {
    try {
      const collection = await this.getCollection();
      const tracker = await collection.findOne({ TrackerId: trackerId });
      return tracker;
    } catch (error) {
      throw error;
    }
  }

  async getTrackerByDeviceId(deviceId) {
    try {
      const collection = await this.getCollection();
      const tracker = await collection.findOne({ DeviceId: deviceId });
      return tracker;
    } catch (error) {
      throw error;
    }
  }

  async updateTracker(id, updateData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
          },
        }
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteTracker(id) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TrackerModel();
