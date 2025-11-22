const { ObjectId } = require('mongodb');
const userModel = require('../models/user.model');

class UserController {
    async createUser(req, res) {
        try {
            const data = req.body;

            // Basic validation
            if (!data.CCCD) {
                return res.status(400).json({
                    error: 'CCCD is required',
                });
            }

            // Check if user already exists
            const existingUser = await userModel.findUserByCCCD(data.cccd);
            if (existingUser) {
                return res.status(409).json({
                    error: 'User with this email already exists',
                });
            }

            const result = await userModel.createUser(data);

            res.status(200).json({
                message: 'User created successfully',
                userId: result.insertedId,
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async getAllUsers(req, res) {
        try {
            const users = await userModel.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;

            // Validate ObjectId
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid user ID format',
                });
            }

            const user = await userModel.getUserById(new ObjectId(id));

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                });
            }

            res.json(user);
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid user ID format',
                });
            }

            if (Object.keys(data).length === 0) {
                return res.status(400).json({
                    error: 'No fields to update',
                });
            }

            const result = await userModel.updateUser(new ObjectId(id), data);

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    error: 'User not found',
                });
            }

            res.json({
                message: 'User updated successfully',
                modifiedCount: result.modifiedCount,
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid user ID format',
                });
            }

            const result = await userModel.deleteUser(new ObjectId(id));

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    error: 'User not found',
                });
            }

            res.json({
                message: 'User deleted successfully',
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    async removeTrackerFromUser(req, res) {
        try {
            const { userId } = req.params;

            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({
                    error: 'Invalid user ID format',
                });
            }

            const result = await userModel.removeTrackerId(userId);

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    error: 'User not found',
                });
            }

            res.json({
                message: 'Tracker unlinked successfully',
                modifiedCount: result.modifiedCount,
            });
        } catch (error) {
            console.error('Remove tracker from user error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Lấy tất cả users có tracker
    async getUsersWithTrackers(req, res) {
        try {
            const users = await userModel.getAllUsersWithTrackers();

            res.json(users);
        } catch (error) {
            console.error('Get users with trackers error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Lấy user theo trackerId
    async getUserByTrackerId(req, res) {
        try {
            const { trackerId } = req.params;

            const user = await userModel.getUserByTrackerId(trackerId);

            if (!user) {
                return res.status(404).json({
                    error: 'No user found with this tracker',
                });
            }

            res.json(user);
        } catch (error) {
            console.error('Get user by tracker ID error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
}

module.exports = new UserController();
