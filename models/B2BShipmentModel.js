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
        enum: ['express', 'standard', 'Express', 'Standard'],
        required: true
    },
    // Normalized delivery type for compatibility
    normalizedDeliveryType: {
        type: String,
        enum: ['Express', 'Standard'],
        default: function() {
            if (this.deliveryType) {
                return this.deliveryType.charAt(0).toUpperCase() + this.deliveryType.slice(1).toLowerCase();
            }
            return 'Express';
        }
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
        enum: ['Pending', 'Verified', 'In Transit','Dispatched', 'Completed'],
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
        required: false
    },
    createdByStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    confirmed: {
        type: Boolean,
        default: false
    }
    
   
});

// Pre-save hook to normalize delivery type
shipmentSchema.pre('save', function(next) {
    if (this.deliveryType) {
        this.normalizedDeliveryType = this.deliveryType.charAt(0).toUpperCase() + this.deliveryType.slice(1).toLowerCase();
    }
    next();
});

// Static method to normalize delivery type
shipmentSchema.statics.normalizeDeliveryType = function(deliveryType) {
    if (!deliveryType) return 'Express';
    return deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1).toLowerCase();
};

// Static method to get buffer time configuration
shipmentSchema.statics.getBufferTimeConfig = function() {
    return {
        Express: {
            first: 2,
            intermediate: 1,
            last: 2
        },
        Standard: {
            first: 2,
            intermediate: 2,
            last: 2
        }
    };
};

module.exports = mongoose.model('B2BShipment', shipmentSchema);