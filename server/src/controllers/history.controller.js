const { ObjectId } = require('mongodb');
const historyModel = require('../models/history.model');

class HistoryController {
    // Create a new history record
    async createHistory(req, res) {
        try {
            const { CCCD, Name, DeviceId, TimeStamp, Floor, Location, x, y } =
                req.body;

            // Validation
            if (!CCCD || !Name || !DeviceId || !TimeStamp) {
                return res.status(400).json({
                    error: 'CCCD, Name, DeviceId, and TimeStamp are required fields',
                });
            }

            const historyData = {
                CCCD,
                Name,
                DeviceId,
                TimeStamp: new Date(TimeStamp),
                Floor: Floor || null,
                Location: Location || null,
                x: x || null,
                y: y || null,
            };

            const result = await historyModel.createHistory(historyData);

            res.status(200).json({
                message: 'History record created successfully',
                historyId: result.insertedId,
                ...historyData,
            });
        } catch (error) {
            console.error('Create history error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get all histories
    async getAllHistories(req, res) {
        try {
            const histories = await historyModel.getAllHistories();

            res.json(histories);
        } catch (error) {
            console.error('Get histories error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get recent histories
    async getRecentHistories(req, res) {
        try {
            const { limit } = req.query;
            const histories = await historyModel.getRecentHistories(
                limit || 100,
            );

            res.json(histories);
        } catch (error) {
            console.error('Get recent histories error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get history by ID
    async getHistoryById(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid history ID format',
                });
            }

            const history = await historyModel.getHistoryById(id);

            if (!history) {
                return res.status(404).json({
                    error: 'History record not found',
                });
            }

            res.json(history);
        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by CCCD
    async getHistoriesByCCCD(req, res) {
        try {
            const { cccd } = req.params;

            const histories = await historyModel.getHistoriesByCCCD(cccd);

            res.json(histories);
        } catch (error) {
            console.error('Get histories by CCCD error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by device ID
    async getHistoriesByDeviceId(req, res) {
        try {
            const { deviceId } = req.params;

            const histories = await historyModel.getHistoriesByDeviceId(
                deviceId,
            );

            res.json(histories);
        } catch (error) {
            console.error('Get histories by device ID error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by floor
    async getHistoriesByFloor(req, res) {
        try {
            const { floor } = req.params;

            const histories = await historyModel.getHistoriesByFloor(floor);

            res.json(histories);
        } catch (error) {
            console.error('Get histories by floor error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by location
    async getHistoriesByLocation(req, res) {
        try {
            const { location } = req.params;

            const histories = await historyModel.getHistoriesByLocation(
                location,
            );

            res.json(histories);
        } catch (error) {
            console.error('Get histories by location error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by date range
    async getHistoriesByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: 'startDate and endDate are required',
                });
            }

            const histories = await historyModel.getHistoriesByDateRange(
                startDate,
                endDate,
            );

            res.json(histories);
        } catch (error) {
            console.error('Get histories by date range error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by person with optional date range
    async getHistoriesByPerson(req, res) {
        try {
            const { cccd } = req.params;
            const { startDate, endDate } = req.query;

            const histories = await historyModel.getHistoriesByPerson(
                cccd,
                startDate,
                endDate,
            );

            res.json(histories);
        } catch (error) {
            console.error('Get histories by person error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get histories by device with optional date range
    async getHistoriesByDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const { startDate, endDate } = req.query;

            const histories = await historyModel.getHistoriesByDevice(
                deviceId,
                startDate,
                endDate,
            );

            res.json(histories);
        } catch (error) {
            console.error('Get histories by device error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Update history
    async updateHistory(req, res) {
        try {
            const { id } = req.params;
            const { CCCD, Name, DeviceId, TimeStamp, Floor, Location } =
                req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid history ID format',
                });
            }

            // Check if history exists
            const existingHistory = await historyModel.getHistoryById(id);
            if (!existingHistory) {
                return res.status(404).json({
                    error: 'History record not found',
                });
            }

            const updateData = {};
            if (CCCD) updateData.CCCD = CCCD;
            if (Name) updateData.Name = Name;
            if (DeviceId) updateData.DeviceId = DeviceId;
            if (TimeStamp) updateData.TimeStamp = new Date(TimeStamp);
            if (Floor !== undefined) updateData.Floor = Floor;
            if (Location !== undefined) updateData.Location = Location;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    error: 'No fields to update',
                });
            }

            const result = await historyModel.updateHistory(id, updateData);

            res.json({
                message: 'History record updated successfully',
                modifiedCount: result.modifiedCount,
            });
        } catch (error) {
            console.error('Update history error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Delete history
    async deleteHistory(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid history ID format',
                });
            }

            const result = await historyModel.deleteHistory(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    error: 'History record not found',
                });
            }

            res.json({
                message: 'History record deleted successfully',
            });
        } catch (error) {
            console.error('Delete history error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Search histories
    async searchHistories(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.status(400).json({
                    error: 'Search query must be at least 2 characters long',
                });
            }

            const histories = await historyModel.searchHistories(q);

            res.json({
                histories,
                count: histories.length,
                query: q,
            });
        } catch (error) {
            console.error('Search histories error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async getHistoriesByCCCDAndDeviceId(req, res) {
        try {
            const { cccd, deviceId } = req.query;
            const histories = await historyModel.getHistoriesByCCCDAndDeviceId(
                cccd,
                deviceId,
            );
            res.json(histories);
        } catch (error) {
            console.error('Get histories by CCCD and device ID error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
}

module.exports = new HistoryController();
