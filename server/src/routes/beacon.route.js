const express = require("express");
const beaconController = require("../controllers/beacon.controller");

const router = express.Router();

// CRUD routes
router.post("/beacons", beaconController.createBeacon);
router.get("/beacons", beaconController.getAllBeacons);
router.get("/beacons/:id", beaconController.getBeaconById);
router.put("/beacons/:id", beaconController.updateBeacon);
router.delete("/beacons/:id", beaconController.deleteBeacon);

// Specialized routes
router.get(
  "/beacons/beacon-id/:beaconId",
  beaconController.getBeaconByBeaconId
);
router.get("/beacons/floor/:floor", beaconController.getBeaconsByFloor);
router.get("/beacons/room/:room", beaconController.getBeaconsByRoom);
router.get("/beacons/coordinates", beaconController.getBeaconsByCoordinates);
router.get("/beacons/search", beaconController.searchBeacons);

module.exports = router;
