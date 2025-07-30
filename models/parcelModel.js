


const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
    pickupDate: { type: Date, required: true },
    pickupTime: {
        type: String,
        enum: ["08:00 - 12:00", "13:00 - 17:00"],
        required: true,
    },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Reference to Staff
}, { timestamps: true });

const deliverySchema = new mongoose.Schema({
    deliveryAddress: { type: String, required: true },
    deliveryCity: { type: String, required: true },
    deliveryDistrict: { type: String, required: true },
    deliveryProvince: { type: String, required: true },
    postalCode: { type: String, required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Reference to Staff
}, { timestamps: true });

const parcelSchema = new mongoose.Schema(
  {
    parcelId: { type: String, required: true },
    trackingNo: { type: String, required: false },
    qrCodeNo: { type: String, required: false },
    itemType: {
      type: String,
      enum: [
        "Glass",
        "Flowers",
        "Document",
        "Clothing",
        "Electronics",
        "Food",
        "Other",
      ],
      required: true,
    },
    itemSize: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    }, // Enum for size
    specialInstructions: { type: String, required: false },
    submittingType: {
      type: String,
      enum: ["pickup", "drop-off", "branch"],
      required: true,
    }, // Enum for submission type
    receivingType: {
      type: String,
      enum: ["doorstep", "collection_center"],
      required: true,
    }, // Enum for receiving type
    shippingMethod: {
      type: String,
      enum: ["standard", "express"],
      required: true,
    }, // Enum for shipping method
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Reference to User
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receiver",
      required: true,
    }, // Reference to Receiver
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    }, // Reference to Payment
    orderPlacedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: false,
    }, // Reference to Staff
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "B2BShipment",
      required: false,
    }, // Reference to B2B Shipment
    parcelPickedUpDate: { type: Date, required: false },
    arrivedToDistributionCenterTime: { type: Date, required: false },
    shipmentAssignedTime: { type: Date, required: false },
    intransitedDate: { type: Date, required: false },
    arrivedToCollectionCenterTime: { type: Date, required: false },
    parcelDispatchedDate: { type: Date, required: false },
    parcelDeliveredDate: { type: Date, required: false },
    arrivedAtReturningBranchDate: { type: Date, required: false },

    status: {
      type: String,
      enum: [
        "OrderPlaced",
        "PendingPickup",
        "PickedUp",
        "ArrivedAtDistributionCenter",
        "ShipmentAssigned",
        "InTransit",
        "ArrivedAtCollectionCenter",
        "DeliveryDispatched",
        "Delivered",
        "NotAccepted",
        "WrongAddress",
        "Return",
        "ArrivedAtReturningBranch"
      ],
      default: "OrderPlaced",
      required: true,
    },
    pickupInformation: pickupSchema,
    deliveryInformation: deliverySchema,
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
    },
  },

    { timestamps: true }
);

module.exports = mongoose.models.Parcel || mongoose.model("Parcel", parcelSchema)