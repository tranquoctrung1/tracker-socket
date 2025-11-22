const { ObjectId } = require("mongodb");
const beaconModel = require("../models/beacon.model");

class BeaconController {
  // Create a new beacon
  async createBeacon(req, res) {
    try {
      const { beaconId, Floor, x, y, Room } = req.body;

      // Validation
      if (!beaconId || !Floor) {
        return res.status(400).json({
          error: "beaconId and Floor are required fields",
        });
      }

      // Check if beacon with same beaconId already exists
      const existingBeacon = await beaconModel.getBeaconByBeaconId(beaconId);
      if (existingBeacon) {
        return res.status(409).json({
          error: "Beacon with this beaconId already exists",
        });
      }

      const beaconData = {
        beaconId,
        Floor,
        x: x !== undefined ? parseFloat(x) : null,
        y: y !== undefined ? parseFloat(y) : null,
        Room: Room || null,
      };

      const result = await beaconModel.createBeacon(beaconData);

      res.status(200).json({
        message: "Beacon created successfully",
        beaconId: result.insertedId,
        ...beaconData,
      });
    } catch (error) {
      console.error("Create beacon error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get all beacons
  async getAllBeacons(req, res) {
    try {
      const beacons = await beaconModel.getAllBeacons();

      res.json(beacons);
    } catch (error) {
      console.error("Get beacons error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get beacon by ID
  async getBeaconById(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid beacon ID format",
        });
      }

      const beacon = await beaconModel.getBeaconById(id);

      if (!beacon) {
        return res.status(404).json({
          error: "Beacon not found",
        });
      }

      res.json(beacon);
    } catch (error) {
      console.error("Get beacon error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get beacon by beaconId
  async getBeaconByBeaconId(req, res) {
    try {
      const { beaconId } = req.params;

      const beacon = await beaconModel.getBeaconByBeaconId(beaconId);

      if (!beacon) {
        return res.status(404).json({
          error: "Beacon not found",
        });
      }

      res.json(beacon);
    } catch (error) {
      console.error("Get beacon by beaconId error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get beacons by floor
  async getBeaconsByFloor(req, res) {
    try {
      const { floor } = req.params;

      const beacons = await beaconModel.getBeaconsByFloor(floor);

      res.json(beacons);
    } catch (error) {
      console.error("Get beacons by floor error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get beacons by room
  async getBeaconsByRoom(req, res) {
    try {
      const { room } = req.params;

      const beacons = await beaconModel.getBeaconsByRoom(room);

      res.json(beacons);
    } catch (error) {
      console.error("Get beacons by room error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get beacons by coordinates
  async getBeaconsByCoordinates(req, res) {
    try {
      const { x, y } = req.query;

      if (!x || !y) {
        return res.status(400).json({
          error: "x and y coordinates are required",
        });
      }

      const xCoord = parseFloat(x);
      const yCoord = parseFloat(y);

      if (isNaN(xCoord) || isNaN(yCoord) || isNaN(searchRadius)) {
        return res.status(400).json({
          error: "Coordinates and radius must be valid numbers",
        });
      }

      const beacons = await beaconModel.getBeaconsByCoordinates(xCoord, yCoord);

      res.json(beacons);
    } catch (error) {
      console.error("Get beacons by coordinates error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Update beacon
  async updateBeacon(req, res) {
    try {
      const { id } = req.params;
      const { beaconId, Floor, x, y, Room } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid beacon ID format",
        });
      }

      // Check if beacon exists
      const existingBeacon = await beaconModel.getBeaconById(id);
      if (!existingBeacon) {
        return res.status(404).json({
          error: "Beacon not found",
        });
      }

      const updateData = {};
      if (beaconId) {
        // Check if new beaconId is unique
        const beaconWithSameId = await beaconModel.getBeaconByBeaconId(
          beaconId
        );
        if (beaconWithSameId && beaconWithSameId._id.toString() !== id) {
          return res.status(409).json({
            error: "Beacon with this beaconId already exists",
          });
        }
        updateData.beaconId = beaconId;
      }
      if (Floor) updateData.Floor = Floor;
      if (x !== undefined) {
        if (isNaN(x) || x < 0) {
          return res.status(400).json({
            error: "x coordinate must be a positive number",
          });
        }
        updateData.x = parseFloat(x);
      }
      if (y !== undefined) {
        if (isNaN(y) || y < 0) {
          return res.status(400).json({
            error: "y coordinate must be a positive number",
          });
        }
        updateData.y = parseFloat(y);
      }
      if (Room !== undefined) updateData.Room = Room;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: "No fields to update",
        });
      }

      const result = await beaconModel.updateBeacon(id, updateData);

      res.json({
        message: "Beacon updated successfully",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Update beacon error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Delete beacon
  async deleteBeacon(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid beacon ID format",
        });
      }

      const result = await beaconModel.deleteBeacon(id);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          error: "Beacon not found",
        });
      }

      res.json({
        message: "Beacon deleted successfully",
      });
    } catch (error) {
      console.error("Delete beacon error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Search beacons
  async searchBeacons(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          error: "Search query must be at least 2 characters long",
        });
      }

      const beacons = await beaconModel.searchBeacons(q);

      res.json({
        beacons,
        count: beacons.length,
        query: q,
      });
    } catch (error) {
      console.error("Search beacons error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}

module.exports = new BeaconController();
