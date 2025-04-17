// const mongoose = require("mongoose");

// const bookedTripSchema = new mongoose.Schema({
//   tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   startTime: { type: String, required: true },
//   endTime: { type: String, required: true },
// });

// const vehicleSchema = new mongoose.Schema({
//   vehicleId: { type: String, required: true, unique: true },
//   vehicleType: {
//     type: String,
//     enum: ["shipment", "pickupDelivery"],
//     required: true,
//   },
//   assignedBranch: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Branch",
//     required: true,
//   },
//   currentBranch: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Branch",
//     required: true,
//   },
//   capableVolume: { type: Number, required: true },
//   capableWeight: { type: Number, required: true },
//   bookedTimes: {
//     type: Map,
//     of: new mongoose.Schema({
//       trips: [bookedTripSchema],
//     }),
//   },
// });

// module.exports = mongoose.model("Vehicle", vehicleSchema);


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

module.exports = mongoose.model("Vehicle", vehicleSchema);