const express = require("express");
const alarmController = require("../controllers/alarm.controller");

const router = express.Router();

// CRUD routes
router.post("/alarms", alarmController.createAlarm);
router.get("/alarms", alarmController.getAllAlarms);
router.get("/alarms/date-range", alarmController.getAlarmsByDateRange);
router.get("/alarms/recent", alarmController.getRecentAlarms);
router.get("/alarms/:id", alarmController.getAlarmById);
router.put("/alarms/:id", alarmController.updateAlarm);
router.delete("/alarms/:id", alarmController.deleteAlarm);

// Specialized routes
router.get("/alarms/search", alarmController.searchAlarms);
router.get("/alarms/tracker/:trackerId", alarmController.getAlarmsByTrackerId);
router.get("/alarms/device/:deviceId", alarmController.getAlarmsByDeviceId);
router.get("/alarms/beacon/:beaconId", alarmController.getAlarmsByBeaconId);
router.get("/alarms/floor/:floor", alarmController.getAlarmsByFloor);
router.get("/alarms/cccd/:cccd", alarmController.getAlarmsByCCCD);

module.exports = router;
