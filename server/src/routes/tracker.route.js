const express = require("express");
const trackerController = require("../controllers/tracker.controller");

const router = express.Router();

// CRUD routes
router.post("/trackers", trackerController.createTracker);
router.get("/trackers", trackerController.getAllTrackers);
router.get("/trackers/:id", trackerController.getTrackerById);
router.put("/trackers/:id", trackerController.updateTracker);
router.delete("/trackers/:id", trackerController.deleteTracker);
router.get("/trackerandusers", trackerController.getTrackerAndUser);

// Specialized routes
router.get(
  "/trackers/tracker-id/:trackerId",
  trackerController.getTrackerByTrackerId
);
router.get(
  "/trackers/device-id/:deviceId",
  trackerController.getTrackerByDeviceId
);

module.exports = router;
