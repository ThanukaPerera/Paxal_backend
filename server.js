const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import routes
const shipmentRoutes = require("./routes/shipmentRoutes");
const parcelRoutes = require("./routes/parcelRoutes");
const driverRoutes = require("./routes/driverRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const customerRoutes = require("./routes/customer");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = 8000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json());

// MongoDB connection
const db_URL = process.env.DB_URL;
mongoose
  .connect(db_URL)
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.log("❌ DB connection error", err);
  });

// Route mounting
app.use("/shipments", shipmentRoutes);
app.use("/parcels", parcelRoutes);
app.use("/drivers", driverRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/standard-shipments", notificationRoutes);
app.use("/admin", adminRoutes);
app.use("/", customerRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});



// // Import dependencies
// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const bodyParser = require("body-parser");

// // Import DB connection
// const connectDB = require("./config/db");

// // Import route files
// const shipmentRoutes = require('./routes/shipmentRoutes');
// const parcelRoutes = require("./routes/parcelRoutes");
// const driverRoutes = require("./routes/driverRoutes");
// const vehicleRoutes = require("./routes/vehicleRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const customerRoutes = require("./routes/customer");
// const adminRoutes = require("./routes/adminRoutes");

// // Load environment variables from .env file
// dotenv.config();

// // Connect to MongoDB
// connectDB();

// // Initialize express app
// const app = express();

// // Set server port
// const PORT = process.env.PORT || 8000;

// // ===== Middleware ===== //

// // Parse JSON request bodies
// app.use(express.json());

// // Parse URL-encoded data (optional but useful for forms)
// app.use(bodyParser.urlencoded({ extended: true }));

// // Parse JSON data via body-parser (can use express.json instead)
// app.use(bodyParser.json());

// // Enable Cross-Origin Resource Sharing (CORS) for frontend access
// app.use(cors({
//   origin: "http://localhost:5173", // Frontend origin
//   credentials: true               // Allow sending cookies
// }));

// // Enable parsing cookies from requests
// app.use(cookieParser());

// // ===== Routes ===== //

// // Default test route
// app.get("/", (req, res) => {
//   res.send("Parcel Management System API is running...");
// });

// // Admin test route
// app.use("/gona", async (req, res) => {
//   console.log("Sehara");
//   res.json({ name: "Thanuka" });
// });

// // Attach all functional route modules
// app.use("/shipments", shipmentRoutes);
// app.use("/parcels", parcelRoutes);
// app.use("/drivers", driverRoutes);
// app.use("/vehicles", vehicleRoutes);
// app.use("/standard-shipments", notificationRoutes);
// app.use("/admin", adminRoutes);
// app.use("/", customerRoutes); // Generic user routes

// // ===== Start Server ===== //
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
