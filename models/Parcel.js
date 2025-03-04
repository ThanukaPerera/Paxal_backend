const mongoose = require("mongoose");

const parcelSchema = new mongoose.Schema(
  {
    parcelId: { type: String, required: true }, // Unique parcel identifier
    trackingNumber: { type: String, required: true, unique: true }, // Unique tracking number
    status: {
      type: String,
      enum: ["Lodged", "In Transit", "Arrived", "Delivered"],
      default: "Lodged",
    },
    assignedShipment: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", default: null },

    shipmentId: { type: String },
    arrivedTime: { type: Date }, // When the parcel arrived at the destination
    createdAt: { type: Date, default: Date.now }, // When the parcel was created
    deliveredTime: { type: Date }, // When the parcel was delivered
    deliveryMethod: { type: String, required: true }, // Pickup, Home Delivery, etc.
    parcelType: { type: String, required: true }, // Type of parcel (e.g., Fragile, Document, etc.)

    height: { type: Number, required: true }, // Parcel height
    length: { type: Number, required: true }, // Parcel length
    width: { type: Number, required: true }, // Parcel width
    weight: { type: Number, required: true }, // Parcel weight
    
    lodgedTime: { type: Date, default: Date.now }, // When the parcel was lodged
    pickedUpTime: { type: Date }, // When the parcel was picked up
    pickupId: { type: String }, // Associated pickup ID
    qrCode: { type: String, required: true, unique: true }, // Unique QR code for the parcel

    receiverName: { type: String, required: true },
    receiverAddress: { type: String, required: true },
    receiverEmail: { type: String, required: true },
    receiverNIC: { type: String, required: true },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Parcel", parcelSchema);
