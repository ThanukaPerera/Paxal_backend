const mongoose =require("mongoose");

const driverSchema = new mongoose.Schema(
    {
      driverId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      nic: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true }, // AWS token
      contactNo: { type: String, required: true}, 
      licenseId: { type: String, required: true },
      branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // Reference to Admin
      vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    },
    { timestamps: true }
  );

  module.exports=mongoose.model("Driver",driverSchema);