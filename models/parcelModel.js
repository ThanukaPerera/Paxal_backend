// const mongoose = require("mongoose");

// const parcelSchema = new mongoose.Schema(
//   {
//     parcelId: { type: String, unique: true }, // Auto-incremented ID like PARCEL0, PARCEL1...
//     senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Receiver", required: true },
//     trackingNo:{type:String, required:false},
//     parcelSize: { type: String, required: true },
//     itemType: { type: String, required: true },
//     shipmentMethod: { type: String, enum: ["Standard", "Express"], required: true },
//     submittingMethod: { type: String, enum: ["Drop-Off", "Pickup"], required: false },
//     collectionMethod: { type: String, enum: ["Collection Center", "Deliver to Doorstep"], required: false },
//     paymentMethod: { type: String, enum: ["Online", "COD"], required: true },
//    specialInstructions: { type: String, required: false },
    
//     status: {
//       type: String,
//       enum: ["Pending", "In Transit", "Delivered", "Cancelled"],
//       default: "Pending",
//     },

//     parcelId: { type: String, required: true, unique: true },

//     // qrCodeNo: { type: String, required: false, unique: false },
// receivingType: { type: String, enum: ["doorstep", "collection_center"], required: false}, // Enum for receiving type

//     latestLocation: { type: String, required: false },
    
//      receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Receiver", required: true }, // Reference to Receiver
//      orderPlacedTime: { type: Date, required: false },
//     orderPlacedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: false }, // Reference to Staff
//     shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "B2BShipment", required: false }, // Reference to B2B Shipment
//     arrivedToCollectionCenterTime: { type: Date, required: false },
//   },
//   { timestamps: true }
// );







// const Parcel = mongoose.model("Parcel", parcelSchema);
// module.exports = Parcel;



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
    itemType: { type: String, enum:["Glass","Flowers",'Document', 'Clothing', 'Electronics', 'Food', 'Other'],required: true },
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
    paymentId: { type: mongoose.Schema.Types.ObjectId,
      ref: "Payment", required: false }, // Reference to Payment
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
      default:"OrderPlaced",
      required: true,
    },
    pickupInformation: pickupSchema,
    deliveryInformation: deliverySchema,
    from:{type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: false
    },
    to:{type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: false
    }
  },
  
  { timestamps: true }
);

module.exports =mongoose.model("Parcel", parcelSchema)
