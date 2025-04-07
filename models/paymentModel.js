const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    paymentMethod: {
      type: String,
      enum: ["online", "physical"],
      required: true,
    }, // Enum for payment method
    paymentAmount: { type: Number, required: true },
    paidBy: { type: String, required: true },
    paymentStatus: { type: String, enum: ["paid", "pending"], required: true }, // Enum for payment status
    paymentDate: { type: Date, required: true },
    transactionId: { type: String, required: false }, // For online payments
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema)

