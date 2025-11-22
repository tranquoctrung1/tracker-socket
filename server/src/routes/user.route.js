const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// User routes
router.post('/users', userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/users/with-trackers', userController.getUsersWithTrackers);
router.delete('/users/:userId/tracker', userController.removeTrackerFromUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

router.get('/users/tracker/:trackerId', userController.getUserByTrackerId);

module.exports = router;
