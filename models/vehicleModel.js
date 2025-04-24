const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  registrationNo:{type:String,required:true,unique:true},
  vehicleType: {
    type: String,
    enum: ["shipment", "pickupDelivery"], 
    required: true,
  },
  assignedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch", // Reference to the branch to which this vehicle is assigned
    required: true,
  },
  currentBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch", // Reference to the current branch of the vehicle
    required: true,
  },
  capableVolume: { type: Number, required: true }, // Maximum volume capacity of the vehicle
  capableWeight: { type: Number, required: true }, // Maximum weight capacity of the vehicle
  available: {type: Boolean, default:true}
});

module.exports = mongoose.models.Vehicle||mongoose.model("Vehicle", vehicleSchema);
