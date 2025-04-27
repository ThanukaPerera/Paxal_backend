const mongoose = require('mongoose');
const db_URL = process.env.DB_URL;

const connectDB = async () => {
  try {
    const conn=await mongoose.connect(db_URL);
    console.log("✅ MongoDB connected ");
    return conn;
  } catch (error) {
    console.error("❌ DB connection error:", error.message);
    throw error; // Propagate the error for global handling
  }
};

// Handle runtime DB events (post-connection)
mongoose.connection.on('disconnected', () => {
  console.log('🔴 MongoDB Connection Lost!');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Runtime Error: ${err.message}`);
});


module.exports = connectDB;