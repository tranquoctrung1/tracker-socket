const express = require('express');
const historyController = require('../controllers/history.controller');

const router = express.Router();

// CRUD routes
router.post('/histories', historyController.createHistory);
router.get('/histories', historyController.getAllHistories);
router.get('/histories/date-range', historyController.getHistoriesByDateRange);
router.get('/histories/recent', historyController.getRecentHistories);
router.get('/histories/:id', historyController.getHistoryById);
router.put('/histories/:id', historyController.updateHistory);
router.delete('/histories/:id', historyController.deleteHistory);

// Specialized routes
router.get('/histories/search', historyController.searchHistories);
router.get('/histories/cccd/:cccd', historyController.getHistoriesByCCCD);
router.get(
    '/histories/device/:deviceId',
    historyController.getHistoriesByDeviceId,
);
router.get('/histories/floor/:floor', historyController.getHistoriesByFloor);
router.get(
    '/histories/location/:location',
    historyController.getHistoriesByLocation,
);
router.get('/histories/person/:cccd', historyController.getHistoriesByPerson);
router.get(
    '/histories/device-tracking/:deviceId',
    historyController.getHistoriesByDevice,
);

module.exports = router;
