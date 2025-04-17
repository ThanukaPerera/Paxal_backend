const mongoose = require("mongoose");

const vehicleScheduleSchema = new mongoose.Schema({
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    scheduleDate: { type: Date, required: true },
    timeSlot: { type: String, enum: ["08:00 - 12:00", "13:00 - 17:00"], required: true },
    type: { type: String, enum: ["pickup", "delivery"], required: true },
    assignedParcels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parcel" }],
    totalVolume: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    
  });
module.exports = mongoose.model("VehicleSchedule", vehicleScheduleSchema);
