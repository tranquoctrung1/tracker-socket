const { ObjectId } = require("mongodb");
const alarmModel = require("../models/alarm.model");

class AlarmController {
  // Create a new alarm
  async createAlarm(req, res) {
    try {
      const {
        DateAlarm,
        Name,
        CCCD,
        TrackerId,
        DeviceId,
        BeaconId,
        Floor,
        Location,
        Type,
      } = req.body;

      const alarmData = {
        DateAlarm: new Date(DateAlarm),
        Name,
        CCCD: CCCD || null,
        TrackerId: TrackerId || null,
        DeviceId: DeviceId || null,
        BeaconId: BeaconId || null,
        Floor: Floor || null,
        Location: Location || null,
        Type: Type || null,
      };

      const result = await alarmModel.createAlarm(alarmData);

      res.status(201).json({
        message: "Alarm created successfully",
        alarmId: result.insertedId,
        ...alarmData,
      });
    } catch (error) {
      console.error("Create alarm error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get all alarms
  async getAllAlarms(req, res) {
    try {
      const alarms = await alarmModel.getAllAlarms();

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get recent alarms
  async getRecentAlarms(req, res) {
    try {
      const { limit } = req.query;
      const alarms = await alarmModel.getRecentAlarms(limit || 50);

      res.json(alarms);
    } catch (error) {
      console.error("Get recent alarms error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarm by ID
  async getAlarmById(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid alarm ID format",
        });
      }

      const alarm = await alarmModel.getAlarmById(id);

      if (!alarm) {
        return res.status(404).json({
          error: "Alarm not found",
        });
      }

      res.json(alarm);
    } catch (error) {
      console.error("Get alarm error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarms by date range
  async getAlarmsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: "startDate and endDate are required",
        });
      }

      const alarms = await alarmModel.getAlarmsByDateRange(startDate, endDate);

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms by date range error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarms by tracker ID
  async getAlarmsByTrackerId(req, res) {
    try {
      const { trackerId } = req.params;

      const alarms = await alarmModel.getAlarmsByTrackerId(trackerId);

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms by tracker ID error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarms by device ID
  async getAlarmsByDeviceId(req, res) {
    try {
      const { deviceId } = req.params;

      const alarms = await alarmModel.getAlarmsByDeviceId(deviceId);

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms by device ID error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarms by beacon ID
  async getAlarmsByBeaconId(req, res) {
    try {
      const { beaconId } = req.params;

      const alarms = await alarmModel.getAlarmsByBeaconId(beaconId);

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms by beacon ID error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarms by floor
  async getAlarmsByFloor(req, res) {
    try {
      const { floor } = req.params;

      const alarms = await alarmModel.getAlarmsByFloor(floor);

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms by floor error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Get alarms by CCCD
  async getAlarmsByCCCD(req, res) {
    try {
      const { cccd } = req.params;

      const alarms = await alarmModel.getAlarmsByCCCD(cccd);

      res.json(alarms);
    } catch (error) {
      console.error("Get alarms by CCCD error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Update alarm
  async updateAlarm(req, res) {
    try {
      const { id } = req.params;
      const {
        DateAlarm,
        Name,
        CCCD,
        TrackerId,
        DeviceId,
        BeaconId,
        Floor,
        Location,
      } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid alarm ID format",
        });
      }

      // Check if alarm exists
      const existingAlarm = await alarmModel.getAlarmById(id);
      if (!existingAlarm) {
        return res.status(404).json({
          error: "Alarm not found",
        });
      }

      const updateData = {};
      if (DateAlarm) updateData.DateAlarm = new Date(DateAlarm);
      if (Name) updateData.Name = Name;
      if (CCCD !== undefined) updateData.CCCD = CCCD;
      if (TrackerId !== undefined) updateData.TrackerId = TrackerId;
      if (DeviceId !== undefined) updateData.DeviceId = DeviceId;
      if (BeaconId !== undefined) updateData.BeaconId = BeaconId;
      if (Floor !== undefined) updateData.Floor = Floor;
      if (Location !== undefined) updateData.Location = Location;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: "No fields to update",
        });
      }

      const result = await alarmModel.updateAlarm(id, updateData);

      res.json({
        message: "Alarm updated successfully",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Update alarm error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Delete alarm
  async deleteAlarm(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid alarm ID format",
        });
      }

      const result = await alarmModel.deleteAlarm(id);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          error: "Alarm not found",
        });
      }

      res.json({
        message: "Alarm deleted successfully",
      });
    } catch (error) {
      console.error("Delete alarm error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  // Search alarms
  async searchAlarms(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          error: "Search query must be at least 2 characters long",
        });
      }

      const alarms = await alarmModel.searchAlarms(q);

      res.json({
        alarms,
        count: alarms.length,
        query: q,
      });
    } catch (error) {
      console.error("Search alarms error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}

module.exports = new AlarmController();
