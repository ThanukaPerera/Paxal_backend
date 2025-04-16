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
        validate: {
            validator: function (v) {
                return v.length >= 2;
            },
            message: 'Route must contain at least source and destination'
        }
    },
    currentLocation: {
        type: String,
        default: function () { return this.route[0]; }
    },
    totalTime: {
        type: Number,
        required: true,
        min: [1, 'Total time must be at least 1 hour']
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
        min: [1, 'Distance must be at least 1 km']
    },
    totalWeight: {
        type: Number,
        required: true,
        min: [0.1, 'Weight must be at least 0.1 kg']
    },
    totalVolume: {
        type: Number,
        required: true,
        min: [0.01, 'Volume must be at least 0.01 m³']
    },
    parcelCount: {
        type: Number,
        required: true,
        min: [1, 'Must contain at least one parcel']
    },
    assignedVehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true
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
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false // Disable the version key (_v)
});

module.exports = mongoose.model('B2BShipment', shipmentSchema);