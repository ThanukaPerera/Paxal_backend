// const mongoose = require('mongoose');

// const shipmentSchema = new mongoose.Schema({
//     id: { type: String, required: true, unique:true }, 
//    totalWeight: { type: Number, required: true },
//    totalVolume: { type: Number, required: true },
//    totalDistance: { type: Number, required: true },
//    totalTime: { type: Number, required: true },
//    route: { type: [String], required: true },
//    deliveryType: { type: String, required: true }
// });
// module.exports = mongoose.model('Shipment', shipmentSchema); 

const mongoose = require('mongoose');
const { sourceMapsEnabled } = require('process');

const shipmentSchema = new mongoose.Schema({
    shipmentId: { type: String, required: true, unique: true }, 
    deliveryType: { type: String, enum: ['Express', 'Standard'], required: true },
    sourceCenter: { type: String, required: true },
    route: { type: [String], required: true },
    currentLocation: { type: String, default: '' },
    totalTime: { type: Number, required: true }, 
    arrivalTimes: [{ center: String, time: Number }],
    totalDistance: { type: Number, required: true},
    totalWeight: { type: Number, required: true }, 
    totalVolume: { type: Number, required: true },
    parcelCount: { type: Number, required: true },
    assignedVehicle: {type: mongoose.Schema.Types.ObjectId,ref: "Vehicle",required: true},
    assignedDriver: {type: mongoose.Schema.Types.ObjectId,ref: "Vehicle",required: true},
    status: { type: String, enum: ['Pending', 'Verified', 'In Transit', 'Completed'], default: 'Pending' },
    parcels: [{
        parcelId:{type: mongoose.Schema.Types.ObjectId,ref: "Parcel",required: true},
        destination: String,
        source: String,
        weight: Number,
        volume: Number,
        deliveryType: String,
        shipmentId: String
    }],
},{ timestamps: true });

module.exports = mongoose.model('B2BShipment', shipmentSchema);