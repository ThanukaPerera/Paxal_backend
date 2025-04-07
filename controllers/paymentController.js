const { Payment } = require("../models/paymentModel");
const { deleteParcel } = require("./parcelControllers");
const { deleteCustomer, deleteReceiver } = require("./customerControllers");

const savePayment = async (req, res, next) => {
  try {
    
    
    // Find last payment ID and generate the next one
    const lastPayment = await Payment.findOne().sort({ paymentId: -1 }).lean();
    let nextPaymentId = "PAYMENT001"; // Default ID if no payment exist

    if (lastPayment) {
      const lastIdNumber = parseInt(
        lastPayment.paymentId.replace("PAYMENT", ""),
        10
      );
      nextPaymentId = `PAYMENT${String(lastIdNumber + 1).padStart(3, "0")}`;
    }
    
    const PaymentData = {
      ...req.updatedData.originalData,
      paymentId: nextPaymentId,
      paymentMethod: "physical",
      paymentDate: new Date().setHours(0, 0, 0, 0),
    };
  

    const payment = new Payment(PaymentData);
    const savedPayment = await payment.save();

    console.log("------Payment saved------");
    const paymentReference =  savedPayment._id;

    
    req.updatedData = {
        ...req.updatedData,
        paymentRef: paymentReference,
      };
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Error saving payment", error });
  }
};

module.exports = {
  savePayment,
};
