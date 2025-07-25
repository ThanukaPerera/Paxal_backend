const Payment = require("../../models/PaymentModel");
const Branch = require("../../models/BranchesModel");
const branchDistances = require("../../utils/BranchDistances");

// Calculate distance between two branches
const getBranchDistance = (fromBranchId, toBranchId) => {
  if (!fromBranchId || !toBranchId) {
    throw new Error("Both from and to branches are required");
  }

  
  const distance = branchDistances[fromBranchId]?.[toBranchId];
  if (distance === undefined) {
    throw new Error(
      `Distance not found between ${fromBranchId} and ${toBranchId}`,
    );
  }
  return distance;
};

// Price per km based on item size
const getBasePricePerKm = (itemSize) => {
  const prices = {
    small: 10,
    medium: 15,
    large: 20,
  };
  return prices[itemSize.toLowerCase()] || 15;
};


// calculate the Payment
const calculatePayment = async(req, res) => {
  const { itemSize, from, to, shippingMethod } = req.query;

  const fromBranch = await Branch.findById(from.toString());
  const toBranch = await Branch.findById(to.toString());
  
  console.log('Item Size:', itemSize);
  console.log('From:', fromBranch.branchId);
  console.log('To:', toBranch.branchId);
  console.log('Shipping Method:', shippingMethod);

  // Calculate distance between branches
  const distance = getBranchDistance(fromBranch.branchId, toBranch.branchId);

  // Calculate amount
  const basePricePerKm = getBasePricePerKm(itemSize);
  let amount = basePricePerKm * distance;

  // Apply express surcharge
  if (shippingMethod === "express") {
    amount *= 1.5; // 50% surcharge for express
  }

  amount = Math.round(amount);

  console.log('Calculated Amount:', amount);
  res.json({ paymentAmount: amount });
}

// save payment details of the parcel
const savePayment = async (paymentData, session) => {
  try {

  

    const {paymentMethod} = paymentData;
    let paidBy, paymentStatus, paymentDate;

    
    if (paymentMethod === "physicalPayment") {
      paidBy = "sender"
      paymentStatus = "paid"
      paymentDate = new Date().setHours(0, 0, 0, 0)
    }else if(paymentMethod === "COD") {
      paidBy = "receiver"
      paymentStatus = "pending"
    }else {
      throw new Error("Invalid payment method");
    }
    
    // create the payment.
    const newPayment = {
      ...paymentData,
      paidBy,
      paymentStatus,
      paymentDate,
    };
  console.log("------Payment data to be saved------");
    const payment = new Payment(newPayment);
    const savedPayment = await payment.save({session});
    console.log("------Payment saved------");
    
    return savedPayment._id;  
   
  } catch (error) {
    console.error("Error in saving payment:", error);
    throw error;  }
};

module.exports = {
  calculatePayment,
  savePayment,
};
