const express = require('express');
const roomController = require('../controllers/room.controller');

const router = express.Router();

// CRUD routes
router.post('/rooms', roomController.createRoom);
router.get('/rooms', roomController.getAllRooms);
router.get('/rooms/xymax', roomController.getRoomsHasXYMax);
router.get('/rooms/floor/:floor', roomController.getRoomsByFloor);
router.get('/rooms/:id', roomController.getRoomById);
router.put('/rooms/:id', roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);

// Specialized routes
router.get('/rooms/name/:name', roomController.getRoomByName);
router.get('/rooms/coordinates', roomController.getRoomsByCoordinates);
router.get('/rooms/area', roomController.getRoomsByArea);
router.get('/rooms/search', roomController.searchRooms);
router.get('/rooms/statistics', roomController.getRoomStatistics);

module.exports = router;
