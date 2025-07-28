

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String },
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      required: function () {
        return this.paymentMethod === "online";
      },
    },
    paymentMethod: {
      type: String,
      enum: ["online", "physicalPayment", "COD"],
      required: true,
    },
    paidBy: {
      type: String,
      enum: ["sender", "receiver"],
      default: function () {
        return this.paymentMethod === "online" ? "sender" : "receiver";
      },
      required: true,
    },
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    transactionId: { type: String, required: false },
    stripeSessionId: { type: String, required: false },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

