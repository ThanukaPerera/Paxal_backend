const mongoose = require("mongoose");
const Parcel = require("../models/parcelModel");
const sampleParcels = require("./testParcels");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/parcel-management", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Insert sample parcel data
const insertSampleData = async () => {
  try {
    await connectDB();
    
    // Clear existing test data (optional)
    console.log("Clearing existing test parcels...");
    await Parcel.deleteMany({
      parcelId: { $in: ["PARCEL001", "PARCEL002", "PARCEL003", "PARCEL004", "PARCEL005", "PARCEL006"] }
    });
    
    // Insert sample parcels
    console.log("Inserting sample parcels...");
    await Parcel.insertMany(sampleParcels);
    
    console.log("Sample data inserted successfully!");
    console.log("Sample parcels created:");
    console.log("- PARCEL001: ArrivedAtCollectionCenter on July 12, 2025");
    console.log("- PARCEL002: Delivered on July 12, 2025");
    console.log("- PARCEL003: WrongAddress (failed delivery) on July 12, 2025");
    console.log("- PARCEL004: DeliveryDispatched on July 12, 2025");
    console.log("- PARCEL005: ArrivedAtCollectionCenter on July 13, 2025");
    console.log("- PARCEL006: Delivered on July 13, 2025");
    
    // Display expected dashboard results
    console.log("\nExpected Dashboard Results:");
    console.log("Overall Stats:");
    console.log("- Total Parcels: 6 (all with status ArrivedAtCollectionCenter or Delivered)");
    console.log("- Arrived Parcels: 2 (PARCEL001, PARCEL005)");
    console.log("- Delivered Parcels: 4 (PARCEL002, PARCEL006)");
    
    console.log("\nJuly 12, 2025 Stats:");
    console.log("- Total Processed: 2 (PARCEL001 arrived, PARCEL002 delivered)");
    console.log("- Arrived: 1 (PARCEL001)");
    console.log("- Delivered: 1 (PARCEL002)");
    console.log("- Failed Delivery: 1 (PARCEL003 - WrongAddress)");
    console.log("- Dispatched: 2 (PARCEL002, PARCEL004)");
    
    console.log("\nJuly 13, 2025 Stats:");
    console.log("- Total Processed: 2 (PARCEL005 arrived, PARCEL006 delivered)");
    console.log("- Arrived: 1 (PARCEL005)");
    console.log("- Delivered: 1 (PARCEL006)");
    console.log("- Failed Delivery: 0");
    console.log("- Dispatched: 1 (PARCEL006)");
    
    process.exit(0);
  } catch (error) {
    console.error("Error inserting sample data:", error);
    process.exit(1);
  }
};

// Run the script
insertSampleData();
