const mongoose = require("mongoose");

// Sample parcel data for testing dashboard logic
const sampleParcels = [
  // Parcels that arrived at collection center on July 12, 2025
  {
    parcelId: "PARCEL001",
    trackingNo: "TRK001",
    qrCodeNo: "QR001",
    itemType: "Document",
    itemSize: "small",
    specialInstructions: "Handle with care",
    submittingType: "drop-off",
    receivingType: "collection_center",
    shippingMethod: "standard",
    senderId: new mongoose.Types.ObjectId(), // Replace with actual User ID
    receiverId: new mongoose.Types.ObjectId(), // Replace with actual Receiver ID
    paymentId: new mongoose.Types.ObjectId(), // Replace with actual Payment ID
    orderPlacedStaffId: new mongoose.Types.ObjectId(), // Replace with actual Staff ID
    shipmentId: new mongoose.Types.ObjectId(), // Replace with actual Shipment ID
    arrivedToCollectionCenterTime: new Date("2025-07-12T10:00:00Z"),
    parcelArrivedDate: new Date("2025-07-12T10:00:00Z"),
    parcelDeliveredDate: null,
    parcelDispatchedDate: null,
    status: "ArrivedAtCollectionCenter",
    pickupInformation: {
      pickupDate: new Date("2025-07-11T09:00:00Z"),
      pickupTime: "08:00 - 12:00",
      address: "123 Main St",
      city: "Colombo",
      district: "Colombo",
      province: "Western",
      staffId: new mongoose.Types.ObjectId()
    },
    deliveryInformation: {
      deliveryAddress: "456 Oak Ave",
      deliveryCity: "Kandy",
      deliveryDistrict: "Kandy",
      deliveryProvince: "Central",
      postalCode: "20000",
      staffId: new mongoose.Types.ObjectId()
    },
    from: new mongoose.Types.ObjectId(), // Replace with actual Branch ID
    to: new mongoose.Types.ObjectId()    // Replace with actual Branch ID
  },

  // Parcel delivered on July 12, 2025
  {
    parcelId: "PARCEL002",
    trackingNo: "TRK002",
    qrCodeNo: "QR002",
    itemType: "Electronics",
    itemSize: "medium",
    specialInstructions: "Fragile item",
    submittingType: "pickup",
    receivingType: "doorstep",
    shippingMethod: "express",
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    paymentId: new mongoose.Types.ObjectId(),
    orderPlacedStaffId: new mongoose.Types.ObjectId(),
    shipmentId: new mongoose.Types.ObjectId(),
    arrivedToCollectionCenterTime: new Date("2025-07-11T14:00:00Z"),
    parcelArrivedDate: new Date("2025-07-11T14:00:00Z"),
    parcelDeliveredDate: new Date("2025-07-12T16:30:00Z"),
    parcelDispatchedDate: new Date("2025-07-12T09:00:00Z"),
    status: "Delivered",
    pickupInformation: {
      pickupDate: new Date("2025-07-10T10:00:00Z"),
      pickupTime: "13:00 - 17:00",
      address: "789 Pine St",
      city: "Galle",
      district: "Galle",
      province: "Southern",
      staffId: new mongoose.Types.ObjectId()
    },
    deliveryInformation: {
      deliveryAddress: "321 Elm St",
      deliveryCity: "Matara",
      deliveryDistrict: "Matara",
      deliveryProvince: "Southern",
      postalCode: "81000",
      staffId: new mongoose.Types.ObjectId()
    },
    from: new mongoose.Types.ObjectId(),
    to: new mongoose.Types.ObjectId()
  },

  // Parcel dispatched but failed delivery on July 12, 2025
  {
    parcelId: "PARCEL003",
    trackingNo: "TRK003",
    qrCodeNo: "QR003",
    itemType: "Clothing",
    itemSize: "large",
    specialInstructions: "Keep dry",
    submittingType: "branch",
    receivingType: "doorstep",
    shippingMethod: "standard",
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    paymentId: new mongoose.Types.ObjectId(),
    orderPlacedStaffId: new mongoose.Types.ObjectId(),
    shipmentId: new mongoose.Types.ObjectId(),
    arrivedToCollectionCenterTime: new Date("2025-07-10T11:00:00Z"),
    parcelArrivedDate: new Date("2025-07-10T11:00:00Z"),
    parcelDeliveredDate: null,
    parcelDispatchedDate: new Date("2025-07-12T08:00:00Z"),
    status: "WrongAddress",
    pickupInformation: {
      pickupDate: new Date("2025-07-09T14:00:00Z"),
      pickupTime: "13:00 - 17:00",
      address: "654 Maple Ave",
      city: "Negombo",
      district: "Gampaha",
      province: "Western",
      staffId: new mongoose.Types.ObjectId()
    },
    deliveryInformation: {
      deliveryAddress: "987 Cedar Rd",
      deliveryCity: "Kalutara",
      deliveryDistrict: "Kalutara",
      deliveryProvince: "Western",
      postalCode: "12000",
      staffId: new mongoose.Types.ObjectId()
    },
    from: new mongoose.Types.ObjectId(),
    to: new mongoose.Types.ObjectId()
  },

  // Parcel dispatched on July 12, 2025 (still in DeliveryDispatched status)
  {
    parcelId: "PARCEL004",
    trackingNo: "TRK004",
    qrCodeNo: "QR004",
    itemType: "Food",
    itemSize: "small",
    specialInstructions: "Refrigerate upon arrival",
    submittingType: "pickup",
    receivingType: "doorstep",
    shippingMethod: "express",
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    paymentId: new mongoose.Types.ObjectId(),
    orderPlacedStaffId: new mongoose.Types.ObjectId(),
    shipmentId: new mongoose.Types.ObjectId(),
    arrivedToCollectionCenterTime: new Date("2025-07-11T16:00:00Z"),
    parcelArrivedDate: new Date("2025-07-11T16:00:00Z"),
    parcelDeliveredDate: null,
    parcelDispatchedDate: new Date("2025-07-12T10:30:00Z"),
    status: "DeliveryDispatched",
    pickupInformation: {
      pickupDate: new Date("2025-07-10T15:00:00Z"),
      pickupTime: "13:00 - 17:00",
      address: "147 Birch Lane",
      city: "Jaffna",
      district: "Jaffna",
      province: "Northern",
      staffId: new mongoose.Types.ObjectId()
    },
    deliveryInformation: {
      deliveryAddress: "258 Spruce St",
      deliveryCity: "Mannar",
      deliveryDistrict: "Mannar",
      deliveryProvince: "Northern",
      postalCode: "41000",
      staffId: new mongoose.Types.ObjectId()
    },
    from: new mongoose.Types.ObjectId(),
    to: new mongoose.Types.ObjectId()
  },

  // Another parcel arrived on July 13, 2025
  {
    parcelId: "PARCEL005",
    trackingNo: "TRK005",
    qrCodeNo: "QR005",
    itemType: "Glass",
    itemSize: "medium",
    specialInstructions: "Extremely fragile",
    submittingType: "drop-off",
    receivingType: "collection_center",
    shippingMethod: "standard",
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    paymentId: new mongoose.Types.ObjectId(),
    orderPlacedStaffId: new mongoose.Types.ObjectId(),
    shipmentId: new mongoose.Types.ObjectId(),
    arrivedToCollectionCenterTime: new Date("2025-07-13T09:30:00Z"),
    parcelArrivedDate: new Date("2025-07-13T09:30:00Z"),
    parcelDeliveredDate: null,
    parcelDispatchedDate: null,
    status: "ArrivedAtCollectionCenter",
    pickupInformation: {
      pickupDate: new Date("2025-07-12T11:00:00Z"),
      pickupTime: "08:00 - 12:00",
      address: "369 Willow Dr",
      city: "Batticaloa",
      district: "Batticaloa",
      province: "Eastern",
      staffId: new mongoose.Types.ObjectId()
    },
    deliveryInformation: {
      deliveryAddress: "741 Poplar Ave",
      deliveryCity: "Trincomalee",
      deliveryDistrict: "Trincomalee",
      deliveryProvince: "Eastern",
      postalCode: "31000",
      staffId: new mongoose.Types.ObjectId()
    },
    from: new mongoose.Types.ObjectId(),
    to: new mongoose.Types.ObjectId()
  },

  // Parcel delivered on July 13, 2025
  {
    parcelId: "PARCEL006",
    trackingNo: "TRK006",
    qrCodeNo: "QR006",
    itemType: "Flowers",
    itemSize: "small",
    specialInstructions: "Keep fresh",
    submittingType: "branch",
    receivingType: "doorstep",
    shippingMethod: "express",
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    paymentId: new mongoose.Types.ObjectId(),
    orderPlacedStaffId: new mongoose.Types.ObjectId(),
    shipmentId: new mongoose.Types.ObjectId(),
    arrivedToCollectionCenterTime: new Date("2025-07-12T13:00:00Z"),
    parcelArrivedDate: new Date("2025-07-12T13:00:00Z"),
    parcelDeliveredDate: new Date("2025-07-13T15:45:00Z"),
    parcelDispatchedDate: new Date("2025-07-13T08:30:00Z"),
    status: "Delivered",
    pickupInformation: {
      pickupDate: new Date("2025-07-11T16:30:00Z"),
      pickupTime: "13:00 - 17:00",
      address: "852 Ash St",
      city: "Anuradhapura",
      district: "Anuradhapura",
      province: "North Central",
      staffId: new mongoose.Types.ObjectId()
    },
    deliveryInformation: {
      deliveryAddress: "963 Beech Rd",
      deliveryCity: "Polonnaruwa",
      deliveryDistrict: "Polonnaruwa",
      deliveryProvince: "North Central",
      postalCode: "51000",
      staffId: new mongoose.Types.ObjectId()
    },
    from: new mongoose.Types.ObjectId(),
    to: new mongoose.Types.ObjectId()
  }
];

module.exports = sampleParcels;
