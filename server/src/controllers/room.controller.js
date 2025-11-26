const { ObjectId } = require('mongodb');
const roomModel = require('../models/room.model');

class RoomController {
    // Create a new room
    async createRoom(req, res) {
        try {
            const { Name, Floor, x_min, y_min, x_max, y_max, x, y } = req.body;

            // Validation
            if (!Name || !Floor) {
                return res.status(400).json({
                    error: 'Name and Floor are required fields',
                });
            }

            // Check if room with same name already exists
            const existingRoom = await roomModel.getRoomByName(Name);
            if (existingRoom) {
                return res.status(409).json({
                    error: 'Room with this name already exists',
                });
            }

            const roomData = {
                Name,
                Floor,
                x_min: x_min !== undefined ? parseFloat(x_min) : null,
                y_min: y_min !== undefined ? parseFloat(y_min) : null,
                x_max: x_max !== undefined ? parseFloat(x_max) : null,
                y_max: y_max !== undefined ? parseFloat(y_max) : null,
                x: x !== undefined ? parseFloat(x) : null,
                y: y !== undefined ? parseFloat(y) : null,
            };

            const result = await roomModel.createRoom(roomData);

            res.status(200).json({
                message: 'Room created successfully',
                roomId: result.insertedId,
                ...roomData,
            });
        } catch (error) {
            console.error('Create room error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get all rooms
    async getAllRooms(req, res) {
        try {
            const rooms = await roomModel.getAllRooms();

            res.json(rooms);
        } catch (error) {
            console.error('Get rooms error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get rooms has xy max
    async getRoomsHasXYMax(req, res) {
        try {
            const rooms = await roomModel.getRoomHasXYMax();

            res.json(rooms);
        } catch (error) {
            console.error('Get rooms error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get room by ID
    async getRoomById(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid room ID format',
                });
            }

            const room = await roomModel.getRoomById(id);

            if (!room) {
                return res.status(404).json({
                    error: 'Room not found',
                });
            }

            res.json(room);
        } catch (error) {
            console.error('Get room error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get rooms by floor
    async getRoomsByFloor(req, res) {
        try {
            const { floor } = req.params;

            const rooms = await roomModel.getRoomsByFloor(floor);

            res.json(rooms);
        } catch (error) {
            console.error('Get rooms by floor error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get room by name
    async getRoomByName(req, res) {
        try {
            const { name } = req.params;

            const room = await roomModel.getRoomByName(name);

            if (!room) {
                return res.status(404).json({
                    error: 'Room not found',
                });
            }

            res.json(room);
        } catch (error) {
            console.error('Get room by name error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get rooms by coordinates
    async getRoomsByCoordinates(req, res) {
        try {
            const { x, y } = req.query;

            if (!x || !y) {
                return res.status(400).json({
                    error: 'x and y coordinates are required',
                });
            }

            const xCoord = parseFloat(x);
            const yCoord = parseFloat(y);

            if (isNaN(xCoord) || isNaN(yCoord)) {
                return res.status(400).json({
                    error: 'Coordinates must be valid numbers',
                });
            }

            const rooms = await roomModel.getRoomsByCoordinates(xCoord, yCoord);

            res.json(rooms);
        } catch (error) {
            console.error('Get rooms by coordinates error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get rooms by area range
    async getRoomsByArea(req, res) {
        try {
            const { minArea, maxArea } = req.query;

            if (!minArea || !maxArea) {
                return res.status(400).json({
                    error: 'minArea and maxArea are required',
                });
            }

            const minAreaNum = parseFloat(minArea);
            const maxAreaNum = parseFloat(maxArea);

            if (
                isNaN(minAreaNum) ||
                isNaN(maxAreaNum) ||
                minAreaNum < 0 ||
                maxAreaNum < 0
            ) {
                return res.status(400).json({
                    error: 'Area values must be positive numbers',
                });
            }

            if (minAreaNum > maxAreaNum) {
                return res.status(400).json({
                    error: 'minArea must be less than or equal to maxArea',
                });
            }

            const rooms = await roomModel.getRoomsByArea(
                minAreaNum,
                maxAreaNum,
            );

            res.json(rooms);
        } catch (error) {
            console.error('Get rooms by area error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Update room
    async updateRoom(req, res) {
        try {
            const { id } = req.params;
            const { Name, Floor, x_min, y_min, x_max, y_max, x, y } = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid room ID format',
                });
            }

            // Check if room exists
            const existingRoom = await roomModel.getRoomById(id);
            if (!existingRoom) {
                return res.status(404).json({
                    error: 'Room not found',
                });
            }

            const updateData = {};
            if (Name) {
                // Check if new name is unique
                const roomWithSameName = await roomModel.getRoomByName(Name);
                if (
                    roomWithSameName &&
                    roomWithSameName._id.toString() !== id
                ) {
                    return res.status(409).json({
                        error: 'Room with this name already exists',
                    });
                }
                updateData.Name = Name;
            }
            if (Floor) updateData.Floor = Floor;
            if (x_min !== undefined) updateData.x_min = parseFloat(x_min);
            if (y_min !== undefined) updateData.y_min = parseFloat(y_min);
            if (x_max !== undefined) updateData.x_max = parseFloat(x_max);
            if (y_max !== undefined) updateData.y_max = parseFloat(y_max);
            if (x !== undefined) updateData.x = parseFloat(x);
            if (y !== undefined) updateData.y = parseFloat(y);

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    error: 'No fields to update',
                });
            }

            const result = await roomModel.updateRoom(id, updateData);

            res.json({
                message: 'Room updated successfully',
                modifiedCount: result.modifiedCount,
            });
        } catch (error) {
            console.error('Update room error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Delete room
    async deleteRoom(req, res) {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    error: 'Invalid room ID format',
                });
            }

            const result = await roomModel.deleteRoom(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    error: 'Room not found',
                });
            }

            res.json({
                message: 'Room deleted successfully',
            });
        } catch (error) {
            console.error('Delete room error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Search rooms
    async searchRooms(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.status(400).json({
                    error: 'Search query must be at least 2 characters long',
                });
            }

            const rooms = await roomModel.searchRooms(q);

            const roomsWithArea = rooms.map((room) => ({
                ...room,
                area:
                    room.x_min !== null &&
                    room.x_max !== null &&
                    room.y_min !== null &&
                    room.y_max !== null
                        ? (room.x_max - room.x_min) * (room.y_max - room.y_min)
                        : null,
            }));

            res.json({
                rooms: roomsWithArea,
                count: rooms.length,
                query: q,
            });
        } catch (error) {
            console.error('Search rooms error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }

    // Get room statistics
    async getRoomStatistics(req, res) {
        try {
            const rooms = await roomModel.getAllRooms();

            const totalRooms = rooms.length;
            const floors = [...new Set(rooms.map((room) => room.Floor))];
            const roomsWithArea = rooms.filter(
                (room) =>
                    room.x_min !== null &&
                    room.x_max !== null &&
                    room.y_min !== null &&
                    room.y_max !== null,
            );

            const totalArea = roomsWithArea.reduce((sum, room) => {
                const area =
                    (room.x_max - room.x_min) * (room.y_max - room.y_min);
                return sum + area;
            }, 0);

            const averageArea =
                roomsWithArea.length > 0 ? totalArea / roomsWithArea.length : 0;

            res.json({
                totalRooms,
                totalFloors: floors.length,
                floors,
                totalArea: parseFloat(totalArea.toFixed(2)),
                averageArea: parseFloat(averageArea.toFixed(2)),
                roomsWithCoordinates: roomsWithArea.length,
            });
        } catch (error) {
            console.error('Get room statistics error:', error);
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
}

module.exports = new RoomController();
