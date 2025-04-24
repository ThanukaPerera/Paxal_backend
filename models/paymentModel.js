const mongoose=require('mongoose');

const paymentSchema = new mongoose.Schema({
    
    parcelId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Parcel", 
      required: function() {
        return this.paymentMethod !== 'physicalPayment';
      } 
    },
    paymentMethod: { 
      type: String, 
      enum: ["online", "physicalPayment", "COD"], 
      required: true 
    },
    paidBy: {
      type: String,
      enum: ["sender", "receiver"],
      default: function() {
        return this.paymentMethod === 'online' ? 'sender' : 'receiver';
      },
      required: true
    },
    amount: { type: Number, required: true },
    paymentStatus: { 
      type: String, 
      enum: ["paid", "pending"], 
      default: "pending",
      required: true 
    },
    paymentDate: { 
      type: Date, 
      default: Date.now,
      required: true 
    },
    transactionId: { type: String, required: false },
    stripeSessionId: { type: String, required: false }
  }, { timestamps: true });

  module.exports=mongoose.model("Payment",paymentSchema);