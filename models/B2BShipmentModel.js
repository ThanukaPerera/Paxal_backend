// models/B2BShipmentModel.js
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    // System-generated unique ID
    shipmentId: {
        type: String,
        required: true,
        unique: true
    },
    deliveryType: {
        type: String,
        enum: ['Express', 'Standard'],
        required: true
    },
    sourceCenter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    route: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    }],
    currentLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        default: function () { return this.route[0]; }
    },
    totalTime: {
        type: Number,
        required: true
    },
    arrivalTimes: [{
        center: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true
        },
        time: {
            type: Number,
            required: true
        }
    }],
    totalDistance: {
        type: Number,
        required: true
    },
    totalWeight: {
        type: Number,
        required: true
    },
    totalVolume: {
        type: Number,
        required: true
    },
    parcelCount: {
        type: Number,
        required: true
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true
    },
    createdByStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('B2BShipment', shipmentSchema);