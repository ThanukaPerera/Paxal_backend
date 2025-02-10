const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const parcelRoutes = require('./routes/parcelRoutes');
const cors = require ('cors');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json()); // Parse incoming JSON requests (Body Parsing Middleware)
app.use(cors());
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Set up routes
app.use('/api/parcels', parcelRoutes);

app.get("/posts", (req, res) => {
  res.json([{ id: 1, title: "Sample Post" }]);
});


// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



//Loads the environment variables.
//Sets up the Express server.
//Connects to MongoDB using Mongoose.
//Routes requests to /api/parcels to the parcelRoutes.js file