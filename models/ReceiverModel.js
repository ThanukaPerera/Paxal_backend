const mongoose = require("mongoose");

const receiverSchema = new mongoose.Schema(
  {
    receiverId: { type: String, required: false },
    receiverFullName: { type: String, required: true },
    receiverContact: { type: String, required: true },
    receiverEmail: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Receiver || mongoose.model("Receiver", receiverSchema);
