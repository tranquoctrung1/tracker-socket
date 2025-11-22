const database = require("../config/database");
const { ObjectId } = require("mongodb");

class AlarmModel {
  constructor() {
    this.collectionName = "alarm";
  }

  async getCollection() {
    const db = database.getDatabase();
    return db.collection(this.collectionName);
  }

  async createAlarm(alarmData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne(alarmData);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllAlarms() {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({})
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmById(id) {
    try {
      const collection = await this.getCollection();
      const alarm = await collection.findOne({ _id: new ObjectId(id) });
      return alarm;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmsByDateRange(startDate, endDate) {
    try {
      const collection = await this.getCollection();

      const alarms = await collection
        .find({
          DateAlarm: {
            $gte: new Date(parseFloat(startDate)),
            $lte: new Date(parseFloat(endDate)),
          },
        })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmsByTrackerId(trackerId) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({ TrackerId: trackerId })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmsByDeviceId(deviceId) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({ DeviceId: deviceId })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmsByBeaconId(beaconId) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({ BeaconId: beaconId })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmsByFloor(floor) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({ Floor: floor })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmsByCCCD(cccd) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({ CCCD: cccd })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async updateAlarm(id, updateData) {
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

  async deleteAlarm(id) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async searchAlarms(query) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({
          $or: [
            { Name: { $regex: query, $options: "i" } },
            { CCCD: { $regex: query, $options: "i" } },
            { TrackerId: { $regex: query, $options: "i" } },
            { DeviceId: { $regex: query, $options: "i" } },
            { BeaconId: { $regex: query, $options: "i" } },
            { Floor: { $regex: query, $options: "i" } },
            { Location: { $regex: query, $options: "i" } },
          ],
        })
        .sort({ DateAlarm: -1 })
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }

  async getRecentAlarms(limit = 50) {
    try {
      const collection = await this.getCollection();
      const alarms = await collection
        .find({})
        .sort({ DateAlarm: -1 })
        .limit(parseInt(limit))
        .toArray();
      return alarms;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AlarmModel();
