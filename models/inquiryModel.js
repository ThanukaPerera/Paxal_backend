const mongoose = require("mongoose");

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

module.exports =  {
    Inquiry:mongoose.model("Inquiry", inquirySchema)
}