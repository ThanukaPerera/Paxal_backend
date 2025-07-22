// const mongoose = require('mongoose');
// const db_URL = process.env.DB_URL;

// const connectDB = async () => {
//   try {
//     const conn=await mongoose.connect(db_URL);
//     console.log("MongoDB connected ");
//     return conn;
//   } catch (error) {
//     console.error("DB connection error:", error.message);
//     throw error; // Propagate the error for global handling
//   }
// };

// // Handle runtime DB events (post-connection)
// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB Connection Lost!');
// });

// mongoose.connection.on('error', (err) => {
//   console.error(` MongoDB Runtime Error: ${err.message}`);
// });


// module.exports = connectDB;


const mongoose = require('mongoose');

let connection = null;

const connectDB = async () => {
  if (connection && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return connection;
  }

  try {
    connection = await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log('MongoDB connected');
    return connection;
  } catch (error) {
    console.error('DB connection error:', error.message);
    throw error; // Propagate the error for global handling
  }
};

// Handle runtime DB events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Connection Lost!');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB Runtime Error: ${err.message}`);
});

module.exports = connectDB;