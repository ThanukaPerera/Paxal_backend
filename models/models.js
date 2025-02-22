const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true },
    nic: { type: String, required: true, unique: true },
    fName: { type: String, required: true },
    lName: { type: String, required: true },
    fullName: { type: String, required: true },
    contact: { type: [String], required: true, max: 3 }, // Array of up to 3 contact numbers
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // AWS token
    profilePicLink: { type: String, required: true },
    address: { type: String, required: true },
    landmark: { type: String, required: false },
    type: { type: String, enum: ["office", "home"], required: true }, // Enum for address type
    city: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    zone: { type: String, required: true },
  },
  { timestamps: true }
);


const parcelSchema = new mongoose.Schema(
  {
    parcelId: { type: String, required: true, unique: true },
    trackingNo: { type: String, required: true, unique: true },
    qrCodeNo: { type: String, required: true, unique: true },
    itemType: { type: String, required: true },
    itemSize: { type: String, enum: ["small", "medium", "large"], required: true }, // Enum for size
    specialInstructions: { type: String, required: false },
    submittingType: { type: String, enum: ["pickup", "branch"], required: true }, // Enum for submission type
    receivingType: { type: String, enum: ["doorstep", "collection_center"], required: true }, // Enum for receiving type
    shippingMethod: { type: String, enum: ["standard", "express"], required: true }, // Enum for shipping method
    latestLocation: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true }, // Reference to Customer
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Receiver", required: true }, // Reference to Receiver
    orderPlacedTime: { type: Date, required: true },
    orderPlacedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: false }, // Reference to Staff
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "B2BShipment", required: false }, // Reference to B2B Shipment
    arrivedToCollectionCenterTime: { type: Date, required: false },
  },
  { timestamps: true }
);



const shippingSchema = new mongoose.Schema(
  {
    shippingId: { type: String, required: true, unique: true },
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true }, // Reference to Parcel
    shippingMethod: { type: String, enum: ["standard", "express"], required: true }, // Enum for shipping method
    arrivedToDistributionCenterTime: { type: Date, required: false },
    arrivedToCollectionCenterTime: { type: Date, required: false },
  },
  { timestamps: true }
);



const pickupSchema = new mongoose.Schema(
  {
    pickupId: { type: String, required: true, unique: true },
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true }, // Reference to Parcel
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true }, // Reference to Driver
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true }, // Reference to Staff
    pickupAddress: { type: String, required: true },
    pickedUpTime: { type: Date, required: false },
  },
  { timestamps: true }
);

const parcelAssignedToB2BShipmentSchema = new mongoose.Schema({
  parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  shipmentId:{type:mongoose.Schema.Types.ObjectId,ref:"Shipment",required:true},
})



const deliverSchema = new mongoose.Schema(
  {
    deliverId: { type: String, required: true, unique: true },
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true }, // Reference to Parcel
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true }, // Reference to Driver
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true }, // Reference to Staff
    deliveryConfirmation: { type: String, required: false }, // Signature/Image proof
    deliveryAddress: { type: String, required: true },
    deliveryRemarks: { type: String, required: false },
    deliveredTime: { type: Date, required: false },
    deliveryDispatchedTime: { type: Date, required: false },
  },
  { timestamps: true }
);



const receiverSchema = new mongoose.Schema(
  {
    receiverId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    contact: { type: [String], required: true, max: 3 }, // Array of up to 3 contact numbers
    email: { type: String, required: true },
    address: { type: String, required: true },
    landmark: { type: String, required: false },
    type: { type: String, enum: ["office", "home"], required: true }, // Enum for address type
    city: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    zone: { type: String, required: true },
  },
  { timestamps: true }
);




const staffSchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    profilePicLink: { type: String, required: false },
    joinedDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive"], required: true }, // Enum for status
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // Reference to Admin
    password: { type: String, required: true }, // AWS token
  },
  { timestamps: true }
);



const b2bShipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true },
    shipmentType: { type: String, enum: ["B2B", "bulk"], required: true }, // Enum for shipment type
    distributionBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
    collectionBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
    assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true }, // Reference to Staff
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true }, // Reference to Driver
  },
  { timestamps: true }
);



const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true }, // Reference to Parcel
    paymentMethod: { type: String, enum: ["online", "COD"], required: true }, // Enum for payment method
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["paid", "pending"], required: true }, // Enum for payment status
    paymentDate: { type: Date, required: true },
    transactionId: { type: String, required: false }, // For online payments
  },
  { timestamps: true }
);



const driverSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // AWS token
    contact: { type: [String], required: true, max: 3 }, // Array of up to 3 contact numbers
    licenceId: { type: String, required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
  },
  { timestamps: true }
);


const adminSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // AWS token
    profilePicLink: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    // contactNo: { type: [String], required: true, max: 3 }, // Array of up to 3 contact numbers
    contactNo:{type:String,required:true}
  },
  { timestamps: true }
);



const inquirySchema = new mongoose.Schema(
  {
    inquiryId: { type: String, required: true, unique: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["replied", "solved", "not"], required: true }, // Enum for inquiry status
    parcelTrackingNo: { type: String, required: true }, // Links to Parcel schema
    inquiryTime: { type: Date, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true }, // Reference to Customer
    reply: { type: [Object], required: false }, // Array of reply objects
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: false }, // Reference to Staff
  },
  { timestamps: true }
);

const branchSchema=new mongoose.Schema({
  branchId:{type:String,required:true,unique:true},
  location:{type:String,required:true},
  contact:{type:[String],required:true,max:3}
})


module.exports={
    Customer:mongoose.model("Customer", customerSchema),
    Parcel:mongoose.model("Parcel", parcelSchema),
    Shipping:mongoose.model("Shipping", shippingSchema),
    Pickup:mongoose.model("Pickup", pickupSchema),
    ParcelAssignedToB2BShipment:mongoose.model("parcelAssignedToB2BShipment",parcelAssignedToB2BShipmentSchema),
    Deliver:mongoose.model("Deliver", deliverSchema),
    Receiver:mongoose.model("Receiver", receiverSchema),
    Staff:mongoose.model("Staff", staffSchema),
    B2BShipment:mongoose.model("B2BShipment", b2bShipmentSchema),
    Payment:mongoose.model("Payment", paymentSchema),
    Driver:mongoose.model("Driver", driverSchema),
    Admin:mongoose.model("Admin", adminSchema),
    Inquiry:mongoose.model("Inquiry", inquirySchema),
    Branch:mongoose.model("Branch",branchSchema)
}













