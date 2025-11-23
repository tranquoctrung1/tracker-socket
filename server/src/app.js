const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route');
const trackerRoutes = require('./routes/tracker.route');
const beaconRoutes = require('./routes/beacon.route');
const alarmRoutes = require('./routes/alarm.route');
const alarmAreaRoutes = require('./routes/alarmArea.route');
const historyRoutes = require('./routes/history.route');
const roomRoutes = require('./routes/room.route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', userRoutes);
app.use('/api', trackerRoutes);
app.use('/api', beaconRoutes);
app.use('/api', alarmRoutes);
app.use('/api', alarmAreaRoutes);
app.use('/api', historyRoutes);
app.use('/api', roomRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
    });
});

module.exports = app;
