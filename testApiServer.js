const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const parcelRoutes = require('./routes/parcelRoutes');
const driverRoutes = require('./routes/driverRoutes');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Routes
app.use('/parcels', parcelRoutes);
app.use('/drivers', driverRoutes);

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Test server is running!' });
});

app.listen(port, () => {
    console.log(`Test server running on port ${port}`);
    console.log(`Test the API at: http://localhost:${port}/test`);
    console.log(`Dashboard stats: http://localhost:${port}/parcels/dashboard/stats/682e1059ce33c2a891c9b168/2025-07-18`);
    console.log(`Driver stats: http://localhost:${port}/drivers/stats/682e1059ce33c2a891c9b168/2025-07-18`);
});
