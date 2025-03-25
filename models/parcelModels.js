const mongoose = require("mongoose");

const parcelSchema = new mongoose.Schema(
  {
    parcelId: { type: String, required: true, unique: true },
    trackingNo: { type: String, required: true, unique: true },
    qrCodeNo: { type: String, required: true, unique: true },
    itemType: { type: String, required: true },
    itemSize: { type: String, enum: ["small", "medium", "large"], required: true }, // Enum for size
    specialInstructions: { type: String, required: false },
    submittingType: { type: String, enum: ["pickup", "drop-off","branch"], required: true }, // Enum for submission type
    receivingType: { type: String, enum: ["doorstep", "collection_center"], required: true }, // Enum for receiving type
    shippingMethod: { type: String, enum: ["standard", "express"], required: true }, // Enum for shipping method
    latestLocation: { type: String, required: true },
    senderId: { type: String, ref: "Customer", required: true }, // Reference to Customer
    receiverId: { type: String, ref: "Receiver", required: true }, // Reference to Receiver
    orderPlacedTime: { type: Date, required: true },
    orderPlacedStaffId: { type: String, ref: "Staff", required: true }, // Reference to Staff
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "B2BShipment", required: false }, // Reference to B2B Shipment
    arrivedToCollectionCenterTime: { type: Date, required: false },
  },
  { timestamps: true }
);

module.exports = {
    Parcel:mongoose.model("Parcel", parcelSchema)
}