const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  pickupDate: { type: Date, required: true },
  pickupTime: {
    type: String,
    enum: ["8:00 - 12:00", "1:00 - 5:00"],
    required: true,
  },
  address: { type: String, required: true },
  City: { type: String, required: true },
  district: { type: String, required: true },
  province: { type: String, required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Reference to Staff
});

const deliverySchema = new mongoose.Schema({
  deliveryAddress: { type: String, required: true },
  deliveryCity: { type: String, required: true },
  deliveryDistrict: { type: String, required: true },
  deliveryProvince: { type: String, required: true },
  postalCode: { type: String, required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // Reference to Staff
});

const parcelSchema = new mongoose.Schema(
  {
    parcelId: { type: String, required: true, unique: true },
    trackingNo: { type: String, required: false, unique: true },
    qrCodeNo: { type: String, required: false, unique: true },
    itemType: { type: String, required: true },
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
      ref: "Customer",
      required: true,
    }, // Reference to Customer
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receiver",
      required: true,
    }, // Reference to Receiver
    paymentId: { type: mongoose.Schema.Types.ObjectId,
      ref: "Payment", required: true }, // Reference to Payment
    orderPlacedTime: { type: Date, required: true },
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
    arrivedToCollectionCenterTime: { type: Date, required: false },
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
      ],
      required: true,
    },
    pickupInformation: pickupSchema,
    deliveryInformation: deliverySchema,
  },
  { timestamps: true }
);

module.exports = {
  Parcel: mongoose.model("Parcel", parcelSchema),
};
