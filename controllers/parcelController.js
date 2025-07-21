// const mongoose = require("mongoose");
// const Parcel = require("../models/parcelModel");
// const Receiver = require("../models/receiverModel");
// const User = require("../models/userModel");
// const catchAsync = require("../utils/catchAscync");
// const Payment=require("../models/PaymentModel");
// const Branch=require("../models/BranchesModel");
// const AppError = require("../utils/appError");
// const { v4: uuidv4 } = require('uuid');

// // Distance calculation helper (mock - replace with real implementation)
// const calculateDistance = async (fromDistrict, toDistrict) => {
//     // In a real implementation, you would use a mapping service API or database lookup
//     // This is a simplified mock that returns a random distance between 5-100 km
//     return Math.floor(Math.random() * 95) + 5;
// };

// // Price per km based on item size
// const getBasePricePerKm = (itemSize) => {
//     switch(itemSize.toLowerCase()) {
//         case 'small': return 10;
//         case 'medium': return 15;
//         case 'large': return 20;
//         default: return 15;
//     }
// };

// // Generate sequential parcel ID
// const generateParcelId = async () => {
//     const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
//     let nextParcelId = "PARCEL001";
//     if (lastParcel && lastParcel.parcelId) {
//         const lastIdNumber = parseInt(lastParcel.parcelId.replace("PARCEL", ""), 10);
//         nextParcelId = `PARCEL${String(lastIdNumber + 1).padStart(3, "0")}`;
//     }
//     return nextParcelId;
// };

// // Controller function for adding a parcel
// exports.addParcel = catchAsync(async (req, res, next) => {
//   // Extract all data from request body
//   const {
//       // Receiver details
//       receiverFullName,
//       receiverContact,
//       receiverEmail,
      
//       // Parcel details
//       itemSize,
//       itemType,
//       shipmentMethod,
//       submittingType,
//       paymentMethod,
//       specialInstructions,
//       receivingType,
      
//       // Pickup information
//       pickupDate,
//       pickupTime,
//       address,
//       city,
//       district,
//       province,
      
//       // Delivery information
//       deliveryAddress,
//       deliveryCity,
//       deliveryDistrict,
//       deliveryProvince,
//       postalCode,
      
//       // Branch information
//       from,
//       to
//   } = req.body;

//   // Check authentication
//   if (!req.user) {
//       return next(new AppError("Unauthorized: No sender information", 401));
//   }
//   const senderId = req.user.id;

//   // Validate branches if needed
//   let fromBranch, toBranch;
//   if (from) {
//       fromBranch = await Branch.findById(from);
//       if (!fromBranch) {
//           return next(new AppError("Invalid 'from' branch", 400));
//       }
//   }
//   if (to) {
//       toBranch = await Branch.findById(to);
//       if (!toBranch) {
//           return next(new AppError("Invalid 'to' branch", 400));
//       }
//   }

//   // Find or create receiver
//   let receiver = await Receiver.findOne({ receiverEmail });
//   if (!receiver) {
//       receiver = await Receiver.create({
//           receiverFullName,
//           receiverContact,
//           receiverEmail
//       });
//   }

//   // Calculate distance based on submission and receiving types
//   let distance;
//   if (submittingType === 'pickup' && receivingType === 'doorstep') {
//       distance = await calculateDistance(district, deliveryDistrict);
//   } else if (submittingType === 'pickup' && receivingType === 'collection_center') {
//       if (!toBranch) return next(new AppError("'to' branch required for collection center delivery", 400));
//       distance = await calculateDistance(district, toBranch.location);
//   } else if (submittingType === 'drop-off' && receivingType === 'doorstep') {
//       if (!fromBranch) return next(new AppError("'from' branch required for drop-off", 400));
//       distance = await calculateDistance(fromBranch.location, deliveryDistrict);
//   } else if (submittingType === 'drop-off' && receivingType === 'collection_center') {
//       if (!fromBranch || !toBranch) return next(new AppError("Both 'from' and 'to' branches required", 400));
//       distance = await calculateDistance(fromBranch.location, toBranch.location);
//   }

//   // Calculate amount
//   const basePricePerKm = getBasePricePerKm(itemSize);
//   let amount = basePricePerKm * distance;
  
//   // Apply express multiplier if needed
//   if (shipmentMethod === 'express') {
//       amount *= 1.5;
//   }

//   // Generate parcel IDs first
//   const parcelId = await generateParcelId();
  
//   // Create parcel data
//  // Step 1: Create parcel without paymentId
// const parcelData = {
//   parcelId,
//   senderId,
//   receiverId: receiver._id,
//   itemSize,
//   itemType,
//   shippingMethod: shipmentMethod,
//   submittingType,
//   receivingType,
//   specialInstructions,
//   status: 'OrderPlaced'
// };

// // Add pickup and delivery info
// if (submittingType === 'pickup') {
//   parcelData.pickupInformation = {
//       pickupDate: new Date(pickupDate),
//       pickupTime,
//       address,
//       city,
//       district,
//       province
//   };
// }
// if (receivingType === 'doorstep') {
//   parcelData.deliveryInformation = {
//       deliveryAddress,
//       deliveryCity,
//       deliveryDistrict,
//       deliveryProvince,
//       postalCode
//   };
// }
// if (from) parcelData.from = from;
// if (to) parcelData.to = to;

// // Create the parcel first (without paymentId)
// const newParcel = await Parcel.create(parcelData);

// // Step 2: Create the payment
// const newPayment = await Payment.create({
 
//   paymentMethod: paymentMethod === 'Online' ? 'online' : 'COD',
//   paidBy: paymentMethod === 'Online' ? 'sender' : 'receiver',
//   amount: Math.round(amount),
//   paymentStatus: paymentMethod === 'Online' ? 'paid' : 'pending',
//   paymentDate: new Date(),
//   parcelId: newParcel._id
// });

// // Step 3: Update the parcel with paymentId
// newParcel.paymentId = newPayment._id;
// await newParcel.save();

//   res.status(201).json({
//       status: "success",
//       message: "Parcel added successfully!",
//       data: {
//           parcel: newParcel,
//           payment: newPayment,
//           distance: `${distance} km`,
//           calculatedAmount: amount
//       }
//   });
// });



const mongoose = require("mongoose");
const Parcel = require("../models/parcelModel");
const Receiver = require("../models/receiverModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAscync");
const Payment = require("../models/PaymentModel");
const Branch = require("../models/BranchesModel");
const AppError = require("../utils/appError");

const dotenv = require("dotenv");
dotenv.config();
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Hardcoded distance matrix between branches (in km)
const branchDistances = {
  // Colombo (B001) to other branches
  "B001": {
    "B002": 115.5, // Kandy
    "B003": 165.0, // Galle
    "B004": 205.0, // Jaffna
    // ... other branches
  },
  // Kandy (B002) to other branches
  "B002": {
    "B001": 115.5,
    "B003": 95.0,
    // ... other branches
  },
  // ... complete for all 25 branches
};

// Price per km based on item size
const getBasePricePerKm = (itemSize) => {
  const prices = {
    'small': 10,
    'medium': 15,
    'large': 20
  };
  return prices[itemSize.toLowerCase()] || 15;
};

// Generate sequential parcel ID
const generateParcelId = async () => {
  const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
  const lastIdNumber = lastParcel ? parseInt(lastParcel.parcelId.replace("PARCEL", ""), 10) : 0;
  return `PARCEL${String(lastIdNumber + 1).padStart(3, "0")}`;
};

// Calculate distance between two branches
const getBranchDistance = (fromBranchId, toBranchId) => {
  if (!fromBranchId || !toBranchId) {
    throw new Error("Both from and to branches are required");
  }
  
  if (fromBranchId === toBranchId) return 0; // Same branch
  
  const distance = branchDistances[fromBranchId]?.[toBranchId];
  if (distance === undefined) {
    throw new Error(`Distance not found between ${fromBranchId} and ${toBranchId}`);
  }
  return distance;
};



// Create Stripe payment session
const createStripeSession = async (parcelDetails, amount) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'lkr',
        product_data: {
          name: `Parcel Delivery (${parcelDetails.parcelId})`,
          description: `From ${parcelDetails.fromBranch.location} to ${parcelDetails.toBranch.location}`,
        },
        unit_amount: amount * 100, // Convert to cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    metadata: {
      parcelId: parcelDetails.parcelId,
      userId: parcelDetails.senderId.toString()
    }
  });
  return session;
};

// Main controller function
exports.addParcel = catchAsync(async (req, res, next) => {
  const {
    receiverFullName,
    receiverContact,
    receiverEmail,
    itemSize,
    itemType,
    shipmentMethod,
    submittingType,
    paymentMethod,
    specialInstructions,
    receivingType,
    pickupDate,
    pickupTime,
    address,
    city,
    district,
    province,
    deliveryAddress,
    deliveryCity,
    deliveryDistrict,
    deliveryProvince,
    postalCode,
    from, // branch ID
    to    // branch ID
  } = req.body;

  // Authentication check
  if (!req.user) return next(new AppError("Unauthorized: No sender information", 401));
  const senderId = req.user.id;

  // Validate branches based on submission type
  let fromBranch, toBranch;
  
  // Scenario 1: Pickup & Doorstep
  if (submittingType === 'pickup' && receivingType === 'doorstep') {
    if (!from) return next(new AppError("'from' branch required for pickup", 400));
    fromBranch = await Branch.findById(from);
    toBranch = await Branch.findOne({ location: deliveryDistrict });
    if (!toBranch) return next(new AppError("No branch found in delivery district", 400));
  }
  // Scenario 2: Pickup & Collection Center
  else if (submittingType === 'pickup' && receivingType === 'collection_center') {
    if (!from || !to) return next(new AppError("Both 'from' and 'to' branches required", 400));
    fromBranch = await Branch.findById(from);
    toBranch = await Branch.findById(to);
  }
  // Scenario 3: Drop-off & Doorstep
  else if (submittingType === 'drop-off' && receivingType === 'doorstep') {
    if (!to) return next(new AppError("'to' branch required for drop-off", 400));
    toBranch = await Branch.findById(to);
    fromBranch = await Branch.findOne({ location: district });
    if (!fromBranch) return next(new AppError("No branch found in pickup district", 400));
  }
  // Scenario 4: Drop-off & Collection Center
  else if (submittingType === 'drop-off' && receivingType === 'collection_center') {
    if (!from || !to) return next(new AppError("Both 'from' and 'to' branches required", 400));
    fromBranch = await Branch.findById(from);
    toBranch = await Branch.findById(to);
  }

  if (!fromBranch || !toBranch) {
    return next(new AppError("Could not determine branches for this delivery", 400));
  }

  // Find or create receiver
  let receiver = await Receiver.findOne({ receiverEmail });
  if (!receiver) {
    receiver = await Receiver.create({ receiverFullName, receiverContact, receiverEmail });
  }

  // Calculate distance between branches
  const distance = getBranchDistance(fromBranch.branchId, toBranch.branchId);
  
  // Calculate amount
  const basePricePerKm = getBasePricePerKm(itemSize);
  let amount = basePricePerKm * distance;
  
  // Apply express surcharge
  if (shipmentMethod === 'express') {
    amount *= 1.5; // 50% surcharge for express
  }
  amount = Math.round(amount);

  // Generate parcel ID
  const parcelId = await generateParcelId();

  // Create parcel data
  const parcelData = {
    parcelId,
    senderId,
    receiverId: receiver._id,
    itemSize,
    itemType,
    shippingMethod: shipmentMethod,
    submittingType,
    receivingType,
    specialInstructions,
    status: 'OrderPlaced',
    from: fromBranch._id,
    to: toBranch._id
  };

  // Add pickup/delivery info
  if (submittingType === 'pickup') {
    parcelData.pickupInformation = {
      pickupDate: new Date(pickupDate),
      pickupTime,
      address,
      city,
      district,
      province
    };
  }
  if (receivingType === 'doorstep') {
    parcelData.deliveryInformation = {
      deliveryAddress,
      deliveryCity,
      deliveryDistrict,
      deliveryProvince,
      postalCode
    };
  }

  // Handle online payment flow
if (paymentMethod === 'Online') {
    // Create parcel first
    const newParcel = await Parcel.create(parcelData);
    
    // Create stripe session
    const session = await createStripeSession({
      parcelId: newParcel.parcelId,
      senderId,
      fromBranch,
      toBranch
    }, amount);
  
    // Create payment record
    const newPayment = await Payment.create({
      paymentMethod: 'online',
      paidBy: 'sender',
      amount,
      paymentStatus: 'paid',
      paymentDate: new Date(),
      stripeSessionId: session.id,
      parcelId: newParcel._id
    });
  
    // Update parcel with payment reference
    newParcel.paymentId = newPayment._id;
    await newParcel.save();
  
    return res.status(201).json({
      status: "success",
      message: "Proceed to payment",
      paymentUrl: session.url,
      data: {
        parcel: newParcel,
        payment: newPayment,
        distance: `${distance} km`,
        calculatedAmount: amount
      }
    });
  } 
  // Handle COD payment flow
  else {
    // Create parcel first
    const newParcel = await Parcel.create(parcelData);
  
    // Create payment record
    const newPayment = await Payment.create({
      paymentMethod: 'COD',
      paidBy: 'receiver',
      amount,
      paymentStatus: 'pending',
      paymentDate: new Date(),
      parcelId: newParcel._id
    });
  
    // Update parcel with payment reference
    newParcel.paymentId = newPayment._id;
    await newParcel.save();
  
    return res.status(201).json({
      status: "success",
      message: "Parcel added successfully (COD)",
      data: {
        parcel: newParcel,
        payment: newPayment,
        distance: `${distance} km`,
        calculatedAmount: amount
      }
    });
  }
});

// Webhook for Stripe payment confirmation
exports.stripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Update payment status
    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { 
        paymentStatus: 'paid',
        paymentDate: new Date(),
        stripePaymentId: session.payment_intent
      }
    );
  }

  res.json({ received: true });
});



exports.getUserParcels = catchAsync(async (req, res, next) => {
  if (!req.user) {
      return next(new AppError("Unauthorized: No user found", 401));
  }

  const senderId = req.user.id; // Get the authenticated user's ID

  const parcels = await Parcel.find({ senderId }).populate("receiverId");

  res.status(200).json({
      status: "success",
      results: parcels.length,
      parcels,
  });
});
