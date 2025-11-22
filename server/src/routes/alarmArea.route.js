const express = require("express");
const alarmAreaController = require("../controllers/alarmArea.controller");

const router = express.Router();

// CRUD routes
router.post("/alarm-areas", alarmAreaController.createAlarmArea);
router.get("/alarm-areas", alarmAreaController.getAllAlarmAreas);
router.get("/alarm-areas/:id", alarmAreaController.getAlarmAreaById);
router.put("/alarm-areas/:id", alarmAreaController.updateAlarmArea);
router.delete("/alarm-areas/:id", alarmAreaController.deleteAlarmArea);

// Specialized routes
router.get(
  "/alarm-areas/floor/:floor",
  alarmAreaController.getAlarmAreasByFloor
);
router.get("/alarm-areas/name/:name", alarmAreaController.getAlarmAreaByName);
router.get(
  "/alarm-areas/coordinates",
  alarmAreaController.getAlarmAreasByCoordinates
);
router.get("/alarm-areas/search", alarmAreaController.searchAlarmAreas);

module.exports = router;
