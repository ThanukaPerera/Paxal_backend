const mongoose=require('mongoose');


const paymentSchema = new mongoose.Schema(

    {
      paymentId: { type: String, required: true, unique: true },
      paymentMethod: { type: String, enum: ["online","physicalPayment", "COD"], required: true }, // Enum for payment method
      paidBy:{type:String,enum:["sender","receiver"], default:"receiver",required:true},
      amount: { type: Number, required: true },
      paymentStatus: { type: String, enum: ["paid", "pending"], default:"pending",required: true }, // Enum for payment status
      paymentDate: { type: Date, required: true },
      transactionId: { type: String, required: false }, // For online payments
    },
    { timestamps: true }
  );

module.exports=mongoose.model("Payment",paymentSchema);