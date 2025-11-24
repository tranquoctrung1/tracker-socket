const { ObjectId } = require('mongodb');
const trackerModel = require('../models/tracker.model.js');
const userModel = require('../models/user.model.js');
const historyModel = require('../models/history.model.js');

class TrackerController {
    // Create a new tracker
    async createTracker(req, res) {
        try {
            const data = req.body;

            // Validation
            if (!data.TrackerId) {
                return res.status(400).json({
                    error: 'TrackerId and DeviceId are required',
                });
            }

            // Check if TrackerId already exists
            const existingTracker = await trackerModel.getTrackerByTrackerId(
                data.TrackerId,
            );
            if (existingTracker) {
                return res.status(409).json({
                    error: 'Tracker with this TrackerId already exists',
                });
            }

            const result = await trackerModel.createTracker({
                TrackerId: data.TrackerId,
                DeviceId: data.DeviceId,
            });

            res.status(200).json({
                message: 'Tracker created successfully',
                trackerId: result.insertedId,
            });
        } catch (error) {
            console.error('Create tracker error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get all trackers
    async getAllTrackers(req, res) {
        try {
            const trackers = await trackerModel.getAllTrackers();

            res.json(trackers);
        } catch (error) {
            console.error('Get trackers error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get tracker by ID
    async getTrackerById(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid tracker ID format',
                });
            }

            const tracker = await trackerModel.getTrackerById(id);

            if (!tracker) {
                return res.status(404).json({
                    error: 'Tracker not found',
                });
            }

            res.json(tracker);
        } catch (error) {
            console.error('Get tracker error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get tracker by TrackerId
    async getTrackerByTrackerId(req, res) {
        try {
            const { trackerId } = req.params;

            const tracker = await trackerModel.getTrackerByTrackerId(trackerId);

            if (!tracker) {
                return res.status(404).json({
                    error: 'Tracker not found',
                });
            }

            res.json(tracker);
        } catch (error) {
            console.error('Get tracker by TrackerId error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get tracker by DeviceId
    async getTrackerByDeviceId(req, res) {
        try {
            const { deviceId } = req.params;

            const tracker = await trackerModel.getTrackerByDeviceId(deviceId);

            if (!tracker) {
                return res.status(404).json({
                    error: 'Tracker not found',
                });
            }

            res.json(tracker);
        } catch (error) {
            console.error('Get tracker by DeviceId error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Update tracker
    async updateTracker(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid tracker ID format',
                });
            }

            // Check if tracker exists
            const existingTracker = await trackerModel.getTrackerById(id);
            if (!existingTracker) {
                return res.status(404).json({
                    error: 'Tracker not found',
                });
            }

            if (Object.keys(data).length === 0) {
                return res.status(400).json({
                    error: 'No fields to update',
                });
            }

            const result = await trackerModel.updateTracker(id, data);

            res.json({
                message: 'Tracker updated successfully',
                modifiedCount: result.modifiedCount,
            });
        } catch (error) {
            console.error('Update tracker error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Delete tracker
    async deleteTracker(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid tracker ID format',
                });
            }

            const result = await trackerModel.deleteTracker(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    error: 'Tracker not found',
                });
            }

            res.json({
                message: 'Tracker deleted successfully',
            });
        } catch (error) {
            console.error('Delete tracker error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async getTrackerAndUser(req, res) {
        try {
            let result = [];

            const users = await userModel.getAllUsers();
            const trackers = await trackerModel.getAllTrackers();

            for (const user of users) {
                if (
                    user.TrackerId !== null &&
                    user.TrackerId !== undefined &&
                    user.TrackerId !== ''
                ) {
                    const find = trackers.find(
                        (tracker) => tracker.TrackerId === user.TrackerId,
                    );

                    if (find) {
                        const histories =
                            await historyModel.getHistoriesByCCCDAndDeviceId(
                                user.CCCD,
                                find.DeviceId,
                            );

                        const obj = {
                            ...user,
                            ...find,
                            history: [...histories],
                        };

                        result.push(obj);
                    }
                }
            }

            res.status(200).json(result);
        } catch (err) {
            console.log(err);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
}

module.exports = new TrackerController();
