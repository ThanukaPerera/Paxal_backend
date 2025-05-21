// models/ShipmentSchema.js
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    // System-generated unique ID
    shipmentId: {
        type: String,
        required: true,
        unique: true,
        default: () => `SH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    deliveryType: {
        type: String,
        enum: ['Express', 'Standard'],
        required: true
    },
    sourceCenter: {
        type: String,
        required: true,
        enum: ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 'Jaffna']
    },
    route: {
        type: [String],
        
        required: true,
    },
    currentLocation: {
        type: String,
        default: function () { return this.route[0]; }
    },
    totalTime: {
        type: Number,
        required: true,
       
    },
    arrivalTimes: [{
        center: {
            type: String,
            required: true
        },
        time: {
            type: Number,
            required: true
        }
    }],
    totalDistance: {
        type: Number,
        required: true,
       
    },
    totalWeight: {
        type: Number,
        required: true,
        
    },
    totalVolume: {
        type: Number,
        required: true,
       
    },
    parcelCount: {
        type: Number,
        required: true,
       
    },
    assignedVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle"
       
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver"
      
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'In Transit', 'Completed'],
        default: 'Pending'
    },
    parcels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parcel",
        required: true
    }],
    createdByCenter: {
        type: String,
        required: true,
        enum: ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 'Jaffna']
    },
    createdByStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
       
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},{timestamp:true});

module.exports = mongoose.model('B2BShipment', shipmentSchema);