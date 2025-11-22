const database = require("../config/database");
const { ObjectId } = require("mongodb");

class AlarmAreaModel {
  constructor() {
    this.collectionName = "alarmArea";
  }

  async getCollection() {
    const db = database.getDatabase();
    return db.collection(this.collectionName);
  }

  async createAlarmArea(alarmAreaData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne({
        ...alarmAreaData,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllAlarmAreas() {
    try {
      const collection = await this.getCollection();
      const alarmAreas = await collection.find({}).toArray();
      return alarmAreas;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmAreaById(id) {
    try {
      const collection = await this.getCollection();
      const alarmArea = await collection.findOne({ _id: new ObjectId(id) });
      return alarmArea;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmAreasByFloor(floor) {
    try {
      const collection = await this.getCollection();
      const alarmAreas = await collection.find({ Floor: floor }).toArray();
      return alarmAreas;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmAreaByName(name) {
    try {
      const collection = await this.getCollection();
      const alarmArea = await collection.findOne({ Name: name });
      return alarmArea;
    } catch (error) {
      throw error;
    }
  }

  async updateAlarmArea(id, updateData) {
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

  async deleteAlarmArea(id) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async searchAlarmAreas(query) {
    try {
      const collection = await this.getCollection();
      const alarmAreas = await collection
        .find({
          $or: [
            { Name: { $regex: query, $options: "i" } },
            { Floor: { $regex: query, $options: "i" } },
            { color: { $regex: query, $options: "i" } },
          ],
        })
        .toArray();
      return alarmAreas;
    } catch (error) {
      throw error;
    }
  }

  async getAlarmAreasByCoordinates(x, y) {
    try {
      const collection = await this.getCollection();
      const alarmAreas = await collection
        .find({
          x_min: { $lte: x },
          x_max: { $gte: x },
          y_min: { $lte: y },
          y_max: { $gte: y },
        })
        .toArray();
      return alarmAreas;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AlarmAreaModel();
