const database = require("../config/database");
const { ObjectId } = require("mongodb");

class BeaconModel {
  constructor() {
    this.collectionName = "beacon";
  }

  async getCollection() {
    const db = database.getDatabase();
    return db.collection(this.collectionName);
  }

  async createBeacon(beaconData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.insertOne({
        ...beaconData,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAllBeacons() {
    try {
      const collection = await this.getCollection();
      const beacons = await collection.find({}).toArray();
      return beacons;
    } catch (error) {
      throw error;
    }
  }

  async getBeaconById(id) {
    try {
      const collection = await this.getCollection();
      const beacon = await collection.findOne({ _id: new ObjectId(id) });
      return beacon;
    } catch (error) {
      throw error;
    }
  }

  async getBeaconByBeaconId(beaconId) {
    try {
      const collection = await this.getCollection();
      const beacon = await collection.findOne({ beaconId: beaconId });
      return beacon;
    } catch (error) {
      throw error;
    }
  }

  async getBeaconsByFloor(floor) {
    try {
      const collection = await this.getCollection();
      const beacons = await collection.find({ Floor: floor }).toArray();
      return beacons;
    } catch (error) {
      throw error;
    }
  }

  async getBeaconsByRoom(room) {
    try {
      const collection = await this.getCollection();
      const beacons = await collection.find({ Room: room }).toArray();
      return beacons;
    } catch (error) {
      throw error;
    }
  }

  async updateBeacon(id, updateData) {
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

  async deleteBeacon(id) {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async searchBeacons(query) {
    try {
      const collection = await this.getCollection();
      const beacons = await collection
        .find({
          $or: [
            { beaconId: { $regex: query, $options: "i" } },
            { Floor: { $regex: query, $options: "i" } },
            { Room: { $regex: query, $options: "i" } },
          ],
        })
        .toArray();
      return beacons;
    } catch (error) {
      throw error;
    }
  }

  async getBeaconsByCoordinates(x, y, radius = 10) {
    try {
      const collection = await this.getCollection();
      const beacons = await collection
        .find({
          x: { $gte: x - radius, $lte: x + radius },
          y: { $gte: y - radius, $lte: y + radius },
        })
        .toArray();
      return beacons;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BeaconModel();
