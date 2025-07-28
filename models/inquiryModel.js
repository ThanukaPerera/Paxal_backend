const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    inquiryId: { type: String, required: true, unique: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["solved", "new"],
      default: "new",
      required: true,
    }, // Enum for inquiry status
    name: { type: String, required: true },
    email: { type: String, required: true },
    parcelTrackingNo: { type: String, required: false }, // Links to Parcel schema
    reply: { type: String, required: false },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: false,
    }, // Reference to Staff
  },
  { timestamps: true },
);

module.exports = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
