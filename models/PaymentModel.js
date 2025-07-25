// const mongoose=require('mongoose');


// const paymentSchema = new mongoose.Schema(

//     {
//       paymentId: { type: String, required: true, unique: true },
//       parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true }, // Reference to Parcel
//       paymentMethod: { type: String, enum: ["online","physicalPayment", "COD"], required: true }, // Enum for payment method
//       paidBy:{type:String,enum:["sender","receiver"], default:"receiver",required:true},
//       amount: { type: Number, required: true },
//       paymentStatus: { type: String, enum: ["paid", "pending"], default:"pending",required: true }, // Enum for payment status
//       paymentDate: { type: Date, required: true },
//       transactionId: { type: String, required: false }, // For online payments
//     },
//     { timestamps: true }
//   );

// module.exports=mongoose.model("Payment",paymentSchema);

const mongoose=require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: false },
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