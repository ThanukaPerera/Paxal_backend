const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true },
    nic: { type: String, required: true, unique: true },
    fName: { type: String, required: true },
    lName: { type: String, required: true },
    customerFullName: { type: String, required: true },
    customerContact: { type: [String], required: true, max: 3 }, // Array of up to 3 contact numbers
    customerEmail: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // AWS token
    // profilePicLink: { type: String, required: true },
    customerAddress: { type: String, required: true },
    province:{ type: String, required: true },
    district:{ type: String, required: true },
    city:{ type: String, required: true },
    
  },
  { timestamps: true }
);

const receiverSchema = new mongoose.Schema(
  {
    receiverId: { type: String, required: true, unique: true },
    receiverFullName: { type: String, required: true },
    receiverContact: { type: [String], required: true, max: 3 }, // Array of up to 3 contact numbers
    receiverEmail: { type: String, required: true },
    
  },
  { timestamps: true }
);

module.exports={
    Customer:mongoose.model("Customer", customerSchema),
    Receiver:mongoose.model("Receiver", receiverSchema),
}