const Payment = require("../../models/PaymentModel");

// save payment details of the parcel
const savePayment = async (paymentData, session) => {
  try {

    // Find last payment ID and generate the next one.
    const lastPayment = await Payment.findOne().sort({ paymentId: -1 }).lean();
    let nextPaymentId = "PAYMENT001"; // Default ID if no payment exists.

    if (lastPayment) {
      const lastIdNumber = parseInt(lastPayment.paymentId.replace("PAYMENT", ""),10);
      nextPaymentId = `PAYMENT${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    const {paymentMethod} = paymentData;
    let paidBy, paymentStatus, paymentDate;

    if (paymentMethod == "physicalPayment") {
      paidBy = "sender"
      paymentStatus = "paid"
      paymentDate = new Date().setHours(0, 0, 0, 0)
    }else if(paymentMethod == "COD") {
      paidBy = "receiver"
      paymentStatus = "pending"
    }else {
      throw new Error("Invalid payment method");
    }
    
    // create the payment.
    const newPayment = {
      ...paymentData,
      paymentId: nextPaymentId,
      paidBy,
      paymentStatus,
      paymentDate,
    };
  
    const payment = new Payment(newPayment);
    const savedPayment = await payment.save({session});
    console.log("------Payment saved------");
    
    return savedPayment._id;  
   
  } catch (error) {
    console.error("Error in saving payment:", error);
    throw error;  }
};

module.exports = {
  savePayment,
};
