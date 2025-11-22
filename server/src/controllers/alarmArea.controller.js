const { ObjectId } = require("mongodb");
const alarmAreaModel = require("../models/alarmArea.model");

class AlarmAreaController {
  // Create a new alarm area
  async createAlarmArea(req, res) {
    try {
      const { Name, Floor, x_min, y_min, x_max, y_max, color } = req.body;

      // Validation
      if (!Name || !Floor) {
        return res.status(400).json({
          error: "Name and Floor are required fields",
        });
      }

      // Check if alarm area with same name already exists
      const existingAlarmArea = await alarmAreaModel.getAlarmAreaByName(Name);
      if (existingAlarmArea) {
        return res.status(409).json({
          error: "Alarm area with this name already exists",
        });
      }

      const alarmAreaData = {
        Name,
        Floor,
        x_min: x_min !== undefined ? parseFloat(x_min) : null,
        y_min: y_min !== undefined ? parseFloat(y_min) : null,
        x_max: x_max !== undefined ? parseFloat(x_max) : null,
        y_max: y_max !== undefined ? parseFloat(y_max) : null,
        color: color || "#FF0000",
      };

      const result = await alarmAreaModel.createAlarmArea(alarmAreaData);

      res.status(200).json({
        message: "Alarm area created successfully",
        alarmAreaId: result.insertedId,
        ...alarmAreaData,
      });
    } catch (error) {
      console.error("Create alarm area error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get all alarm areas
  async getAllAlarmAreas(req, res) {
    try {
      const alarmAreas = await alarmAreaModel.getAllAlarmAreas();

      res.json(alarmAreas);
    } catch (error) {
      console.error("Get alarm areas error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarm area by ID
  async getAlarmAreaById(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid alarm area ID format",
        });
      }

      const alarmArea = await alarmAreaModel.getAlarmAreaById(id);

      if (!alarmArea) {
        return res.status(404).json({
          error: "Alarm area not found",
        });
      }

      res.json(alarmArea);
    } catch (error) {
      console.error("Get alarm area error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarm areas by floor
  async getAlarmAreasByFloor(req, res) {
    try {
      const { floor } = req.params;

      const alarmAreas = await alarmAreaModel.getAlarmAreasByFloor(floor);
      res.json(alarmAreas);
    } catch (error) {
      console.error("Get alarm areas by floor error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarm area by name
  async getAlarmAreaByName(req, res) {
    try {
      const { name } = req.params;

      const alarmArea = await alarmAreaModel.getAlarmAreaByName(name);

      if (!alarmArea) {
        return res.status(404).json({
          error: "Alarm area not found",
        });
      }

      res.json(alarmArea);
    } catch (error) {
      console.error("Get alarm area by name error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarm areas by coordinates
  async getAlarmAreasByCoordinates(req, res) {
    try {
      const { x, y } = req.query;

      if (!x || !y) {
        return res.status(400).json({
          error: "x and y coordinates are required",
        });
      }

      const xCoord = parseFloat(x);
      const yCoord = parseFloat(y);

      if (isNaN(xCoord) || isNaN(yCoord)) {
        return res.status(400).json({
          error: "Coordinates must be valid numbers",
        });
      }

      const alarmAreas = await alarmAreaModel.getAlarmAreasByCoordinates(
        xCoord,
        yCoord
      );

      res.json(alarmAreas);
    } catch (error) {
      console.error("Get alarm areas by coordinates error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Update alarm area
  async updateAlarmArea(req, res) {
    try {
      const { id } = req.params;
      const { Name, Floor, x_min, y_min, x_max, y_max, color } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid alarm area ID format",
        });
      }

      // Check if alarm area exists
      const existingAlarmArea = await alarmAreaModel.getAlarmAreaById(id);
      if (!existingAlarmArea) {
        return res.status(404).json({
          error: "Alarm area not found",
        });
      }

      const updateData = {};
      if (Name) {
        // Check if new name is unique
        const alarmAreaWithSameName = await alarmAreaModel.getAlarmAreaByName(
          Name
        );
        if (
          alarmAreaWithSameName &&
          alarmAreaWithSameName._id.toString() !== id
        ) {
          return res.status(409).json({
            error: "Alarm area with this name already exists",
          });
        }
        updateData.Name = Name;
      }
      if (Floor) updateData.Floor = Floor;
      if (x_min !== undefined) updateData.x_min = parseFloat(x_min);
      if (y_min !== undefined) updateData.y_min = parseFloat(y_min);
      if (x_max !== undefined) updateData.x_max = parseFloat(x_max);
      if (y_max !== undefined) updateData.y_max = parseFloat(y_max);
      if (color) {
        updateData.color = color;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: "No fields to update",
        });
      }

      const result = await alarmAreaModel.updateAlarmArea(id, updateData);

      res.json({
        message: "Alarm area updated successfully",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Update alarm area error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Delete alarm area
  async deleteAlarmArea(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid alarm area ID format",
        });
      }

      const result = await alarmAreaModel.deleteAlarmArea(id);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          error: "Alarm area not found",
        });
      }

      res.json({
        message: "Alarm area deleted successfully",
      });
    } catch (error) {
      console.error("Delete alarm area error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Search alarm areas
  async searchAlarmAreas(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          error: "Search query must be at least 2 characters long",
        });
      }

      const alarmAreas = await alarmAreaModel.searchAlarmAreas(q);

      res.json({
        alarmAreas,
        count: alarmAreas.length,
        query: q,
      });
    } catch (error) {
      console.error("Search alarm areas error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}

module.exports = new AlarmAreaController();
