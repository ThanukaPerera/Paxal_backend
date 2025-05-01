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
const { v4: uuidv4 } = require("uuid");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Hardcoded distance matrix between branches (in km)
const branchDistances = {
  // Colombo (B001) to other districts (24 entries)
  B001: {
    B002: 35.2,
    B003: 115.5,
    B004: 165.0,
    B005: 205.0,
    B006: 148.0,
    B007: 102.0,
    B008: 160.0,
    B009: 225.0,
    B010: 125.0,
    B011: 135.0,
    B012: 85.0,
    B013: 195.0,
    B014: 175.0,
    B015: 240.0,
    B016: 55.0,
    B017: 70.0,
    B018: 180.0,
    B019: 155.0,
    B020: 90.0,
    B021: 220.0,
    B022: 230.0,
    B023: 250.0,
    B024: 265.0,
    B025: 275.0,
  },
  // Gampaha (B002) to other districts (24 entries)
  B002: {
    B001: 35.2,
    B003: 110.0,
    B004: 170.0,
    B005: 210.0,
    B006: 140.0,
    B007: 107.0,
    B008: 155.0,
    B009: 220.0,
    B010: 120.0,
    B011: 130.0,
    B012: 50.0,
    B013: 190.0,
    B014: 170.0,
    B015: 235.0,
    B016: 60.0,
    B017: 65.0,
    B018: 175.0,
    B019: 150.0,
    B020: 85.0,
    B021: 215.0,
    B022: 225.0,
    B023: 245.0,
    B024: 260.0,
    B025: 270.0,
  },
  // Kandy (B003) to other districts (24 entries)
  B003: {
    B001: 115.5,
    B002: 110.0,
    B004: 95.0,
    B005: 320.0,
    B006: 80.0,
    B007: 145.0,
    B008: 135.0,
    B009: 200.0,
    B010: 65.0,
    B011: 70.0,
    B012: 130.0,
    B013: 160.0,
    B014: 190.0,
    B015: 255.0,
    B016: 40.0,
    B017: 175.0,
    B018: 110.0,
    B019: 185.0,
    B020: 25.0,
    B021: 295.0,
    B022: 305.0,
    B023: 325.0,
    B024: 340.0,
    B025: 75.0,
  },
  // Galle (B004) to other districts (24 entries)
  B004: {
    B001: 165.0,
    B002: 170.0,
    B003: 95.0,
    B005: 370.0,
    B006: 175.0,
    B007: 45.0,
    B008: 230.0,
    B009: 295.0,
    B010: 160.0,
    B011: 165.0,
    B012: 80.0,
    B013: 260.0,
    B014: 240.0,
    B015: 305.0,
    B016: 135.0,
    B017: 240.0,
    B018: 205.0,
    B019: 90.0,
    B020: 120.0,
    B021: 345.0,
    B022: 355.0,
    B023: 375.0,
    B024: 390.0,
    B025: 170.0,
  },
  // Jaffna (B005) to other districts (24 entries)
  B005: {
    B001: 205.0,
    B002: 210.0,
    B003: 320.0,
    B004: 370.0,
    B006: 285.0,
    B007: 415.0,
    B008: 205.0,
    B009: 170.0,
    B010: 345.0,
    B011: 355.0,
    B012: 290.0,
    B013: 240.0,
    B014: 220.0,
    B015: 285.0,
    B016: 305.0,
    B017: 195.0,
    B018: 390.0,
    B019: 460.0,
    B020: 295.0,
    B021: 85.0,
    B022: 95.0,
    B023: 115.0,
    B024: 130.0,
    B025: 395.0,
  },
  // Kurunegala (B006) to other districts (24 entries)
  B006: {
    B001: 148.0,
    B002: 140.0,
    B003: 80.0,
    B004: 175.0,
    B005: 285.0,
    B007: 220.0,
    B008: 55.0,
    B009: 120.0,
    B010: 145.0,
    B011: 150.0,
    B012: 165.0,
    B013: 80.0,
    B014: 210.0,
    B015: 275.0,
    B016: 120.0,
    B017: 95.0,
    B018: 190.0,
    B019: 265.0,
    B020: 105.0,
    B021: 260.0,
    B022: 270.0,
    B023: 290.0,
    B024: 305.0,
    B025: 155.0,
  },
  // Matara (B007) to other districts (24 entries)
  B007: {
    B001: 102.0,
    B002: 107.0,
    B003: 145.0,
    B004: 45.0,
    B005: 415.0,
    B006: 220.0,
    B008: 275.0,
    B009: 340.0,
    B010: 205.0,
    B011: 210.0,
    B012: 35.0,
    B013: 305.0,
    B014: 285.0,
    B015: 350.0,
    B016: 180.0,
    B017: 285.0,
    B018: 250.0,
    B019: 45.0,
    B020: 165.0,
    B021: 390.0,
    B022: 400.0,
    B023: 420.0,
    B024: 435.0,
    B025: 215.0,
  },
  // Anuradhapura (B008) to other districts (24 entries)
  B008: {
    B001: 160.0,
    B002: 155.0,
    B003: 135.0,
    B004: 230.0,
    B005: 205.0,
    B006: 55.0,
    B007: 275.0,
    B009: 65.0,
    B010: 200.0,
    B011: 205.0,
    B012: 220.0,
    B013: 25.0,
    B014: 165.0,
    B015: 230.0,
    B016: 175.0,
    B017: 150.0,
    B018: 245.0,
    B019: 320.0,
    B020: 160.0,
    B021: 120.0,
    B022: 130.0,
    B023: 150.0,
    B024: 165.0,
    B025: 210.0,
  },
  // Trincomalee (B009) to other districts (24 entries)
  B009: {
    B001: 225.0,
    B002: 220.0,
    B003: 200.0,
    B004: 295.0,
    B005: 170.0,
    B006: 120.0,
    B007: 340.0,
    B008: 65.0,
    B010: 265.0,
    B011: 270.0,
    B012: 285.0,
    B013: 90.0,
    B014: 100.0,
    B015: 165.0,
    B016: 240.0,
    B017: 215.0,
    B018: 310.0,
    B019: 385.0,
    B020: 225.0,
    B021: 85.0,
    B022: 95.0,
    B023: 115.0,
    B024: 130.0,
    B025: 275.0,
  },
  // Badulla (B010) to other districts (24 entries)
  B010: {
    B001: 125.0,
    B002: 120.0,
    B003: 65.0,
    B004: 160.0,
    B005: 345.0,
    B006: 145.0,
    B007: 205.0,
    B008: 200.0,
    B009: 265.0,
    B011: 75.0,
    B012: 190.0,
    B013: 225.0,
    B014: 255.0,
    B015: 320.0,
    B016: 105.0,
    B017: 240.0,
    B018: 45.0,
    B019: 220.0,
    B020: 90.0,
    B021: 320.0,
    B022: 330.0,
    B023: 350.0,
    B024: 365.0,
    B025: 140.0,
  },
  // Ratnapura (B011) to other districts (24 entries)
  B011: {
    B001: 135.0,
    B002: 130.0,
    B003: 70.0,
    B004: 165.0,
    B005: 355.0,
    B006: 150.0,
    B007: 210.0,
    B008: 205.0,
    B009: 270.0,
    B010: 75.0,
    B012: 200.0,
    B013: 230.0,
    B014: 260.0,
    B015: 325.0,
    B016: 115.0,
    B017: 245.0,
    B018: 30.0,
    B019: 225.0,
    B020: 95.0,
    B021: 330.0,
    B022: 340.0,
    B023: 360.0,
    B024: 375.0,
    B025: 145.0,
  },
  // Kalutara (B012) to other districts (24 entries)
  B012: {
    B001: 85.0,
    B002: 50.0,
    B003: 130.0,
    B004: 80.0,
    B005: 290.0,
    B006: 165.0,
    B007: 35.0,
    B008: 220.0,
    B009: 285.0,
    B010: 190.0,
    B011: 200.0,
    B013: 245.0,
    B014: 225.0,
    B015: 290.0,
    B016: 175.0,
    B017: 235.0,
    B018: 230.0,
    B019: 80.0,
    B020: 155.0,
    B021: 265.0,
    B022: 275.0,
    B023: 295.0,
    B024: 310.0,
    B025: 200.0,
  },
  // Polonnaruwa (B013) to other districts (24 entries)
  B013: {
    B001: 195.0,
    B002: 190.0,
    B003: 160.0,
    B004: 260.0,
    B005: 240.0,
    B006: 80.0,
    B007: 305.0,
    B008: 25.0,
    B009: 90.0,
    B010: 225.0,
    B011: 230.0,
    B012: 245.0,
    B014: 140.0,
    B015: 205.0,
    B016: 200.0,
    B017: 175.0,
    B018: 270.0,
    B019: 345.0,
    B020: 185.0,
    B021: 155.0,
    B022: 165.0,
    B023: 185.0,
    B024: 200.0,
    B025: 235.0,
  },
  // Batticaloa (B014) to other districts (24 entries)
  B014: {
    B001: 175.0,
    B002: 170.0,
    B003: 190.0,
    B004: 240.0,
    B005: 220.0,
    B006: 210.0,
    B007: 285.0,
    B008: 165.0,
    B009: 100.0,
    B010: 255.0,
    B011: 260.0,
    B012: 225.0,
    B013: 140.0,
    B015: 65.0,
    B016: 235.0,
    B017: 240.0,
    B018: 300.0,
    B019: 330.0,
    B020: 215.0,
    B021: 135.0,
    B022: 145.0,
    B023: 165.0,
    B024: 180.0,
    B025: 265.0,
  },
  // Ampara (B015) to other districts (24 entries)
  B015: {
    B001: 240.0,
    B002: 235.0,
    B003: 255.0,
    B004: 305.0,
    B005: 285.0,
    B006: 275.0,
    B007: 350.0,
    B008: 230.0,
    B009: 165.0,
    B010: 320.0,
    B011: 325.0,
    B012: 290.0,
    B013: 205.0,
    B014: 65.0,
    B016: 300.0,
    B017: 305.0,
    B018: 365.0,
    B019: 395.0,
    B020: 280.0,
    B021: 200.0,
    B022: 210.0,
    B023: 230.0,
    B024: 245.0,
    B025: 330.0,
  },
  // Kegalle (B016) to other districts (24 entries)
  B016: {
    B001: 55.0,
    B002: 60.0,
    B003: 40.0,
    B004: 135.0,
    B005: 305.0,
    B006: 120.0,
    B007: 180.0,
    B008: 175.0,
    B009: 240.0,
    B010: 105.0,
    B011: 115.0,
    B012: 175.0,
    B013: 200.0,
    B014: 235.0,
    B015: 300.0,
    B017: 155.0,
    B018: 150.0,
    B019: 225.0,
    B020: 65.0,
    B021: 280.0,
    B022: 290.0,
    B023: 310.0,
    B024: 325.0,
    B025: 115.0,
  },
  // Puttalam (B017) to other districts (24 entries)
  B017: {
    B001: 70.0,
    B002: 65.0,
    B003: 175.0,
    B004: 240.0,
    B005: 195.0,
    B006: 95.0,
    B007: 285.0,
    B008: 150.0,
    B009: 215.0,
    B010: 240.0,
    B011: 245.0,
    B012: 235.0,
    B013: 175.0,
    B014: 240.0,
    B015: 305.0,
    B016: 155.0,
    B018: 270.0,
    B019: 335.0,
    B020: 190.0,
    B021: 110.0,
    B022: 120.0,
    B023: 140.0,
    B024: 155.0,
    B025: 250.0,
  },
  // Monaragala (B018) to other districts (24 entries)
  B018: {
    B001: 180.0,
    B002: 175.0,
    B003: 110.0,
    B004: 205.0,
    B005: 390.0,
    B006: 190.0,
    B007: 250.0,
    B008: 245.0,
    B009: 310.0,
    B010: 45.0,
    B011: 30.0,
    B012: 230.0,
    B013: 270.0,
    B014: 300.0,
    B015: 365.0,
    B016: 150.0,
    B017: 270.0,
    B019: 255.0,
    B020: 135.0,
    B021: 345.0,
    B022: 355.0,
    B023: 375.0,
    B024: 390.0,
    B025: 175.0,
  },
  // Hambantota (B019) to other districts (24 entries)
  B019: {
    B001: 155.0,
    B002: 150.0,
    B003: 185.0,
    B004: 90.0,
    B005: 460.0,
    B006: 265.0,
    B007: 45.0,
    B008: 320.0,
    B009: 385.0,
    B010: 220.0,
    B011: 225.0,
    B012: 80.0,
    B013: 345.0,
    B014: 330.0,
    B015: 395.0,
    B016: 225.0,
    B017: 335.0,
    B018: 255.0,
    B020: 210.0,
    B021: 435.0,
    B022: 445.0,
    B023: 465.0,
    B024: 480.0,
    B025: 260.0,
  },
  // Matale (B020) to other districts (24 entries)
  B020: {
    B001: 90.0,
    B002: 85.0,
    B003: 25.0,
    B004: 120.0,
    B005: 295.0,
    B006: 105.0,
    B007: 165.0,
    B008: 160.0,
    B009: 225.0,
    B010: 90.0,
    B011: 95.0,
    B012: 155.0,
    B013: 185.0,
    B014: 215.0,
    B015: 280.0,
    B016: 65.0,
    B017: 190.0,
    B018: 135.0,
    B019: 210.0,
    B021: 270.0,
    B022: 280.0,
    B023: 300.0,
    B024: 315.0,
    B025: 100.0,
  },
  // Vavuniya (B021) to other districts (24 entries)
  B021: {
    B001: 220.0,
    B002: 215.0,
    B003: 295.0,
    B004: 345.0,
    B005: 85.0,
    B006: 260.0,
    B007: 390.0,
    B008: 120.0,
    B009: 85.0,
    B010: 320.0,
    B011: 330.0,
    B012: 265.0,
    B013: 155.0,
    B014: 135.0,
    B015: 200.0,
    B016: 280.0,
    B017: 110.0,
    B018: 345.0,
    B019: 435.0,
    B020: 270.0,
    B022: 10.0,
    B023: 30.0,
    B024: 45.0,
    B025: 370.0,
  },
  // Mullaitivu (B022) to other districts (24 entries)
  B022: {
    B001: 230.0,
    B002: 225.0,
    B003: 305.0,
    B004: 355.0,
    B005: 95.0,
    B006: 270.0,
    B007: 400.0,
    B008: 130.0,
    B009: 95.0,
    B010: 330.0,
    B011: 340.0,
    B012: 275.0,
    B013: 165.0,
    B014: 145.0,
    B015: 210.0,
    B016: 290.0,
    B017: 120.0,
    B018: 355.0,
    B019: 445.0,
    B020: 280.0,
    B021: 10.0,
    B023: 20.0,
    B024: 35.0,
    B025: 380.0,
  },
  // Kilinochchi (B023) to other districts (24 entries)
  B023: {
    B001: 250.0,
    B002: 245.0,
    B003: 325.0,
    B004: 375.0,
    B005: 115.0,
    B006: 290.0,
    B007: 420.0,
    B008: 150.0,
    B009: 115.0,
    B010: 350.0,
    B011: 360.0,
    B012: 295.0,
    B013: 185.0,
    B014: 165.0,
    B015: 230.0,
    B016: 310.0,
    B017: 140.0,
    B018: 375.0,
    B019: 465.0,
    B020: 300.0,
    B021: 30.0,
    B022: 20.0,
    B024: 15.0,
    B025: 400.0,
  },
  // Mannar (B024) to other districts (24 entries)
  B024: {
    B001: 265.0,
    B002: 260.0,
    B003: 340.0,
    B004: 390.0,
    B005: 130.0,
    B006: 305.0,
    B007: 435.0,
    B008: 165.0,
    B009: 130.0,
    B010: 365.0,
    B011: 375.0,
    B012: 310.0,
    B013: 200.0,
    B014: 180.0,
    B015: 245.0,
    B016: 325.0,
    B017: 155.0,
    B018: 390.0,
    B019: 480.0,
    B020: 315.0,
    B021: 45.0,
    B022: 35.0,
    B023: 15.0,
    B025: 415.0,
  },
  // Nuwara Eliya (B025) to other districts (24 entries)
  B025: {
    B001: 275.0,
    B002: 270.0,
    B003: 75.0,
    B004: 170.0,
    B005: 395.0,
    B006: 155.0,
    B007: 215.0,
    B008: 210.0,
    B009: 275.0,
    B010: 140.0,
    B011: 145.0,
    B012: 200.0,
    B013: 235.0,
    B014: 265.0,
    B015: 330.0,
    B016: 115.0,
    B017: 250.0,
    B018: 175.0,
    B019: 260.0,
    B020: 100.0,
    B021: 370.0,
    B022: 380.0,
    B023: 400.0,
    B024: 415.0,
  },
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

// Generate sequential parcel ID
const generateParcelId = async () => {
  const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
  const lastIdNumber = lastParcel
    ? parseInt(lastParcel.parcelId.replace("PARCEL", ""), 10)
    : 0;
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
    throw new Error(
      `Distance not found between ${fromBranchId} and ${toBranchId}`,
    );
  }
  return distance;
};

// Create Stripe payment session
const createStripeSession = async (parcelDetails, amount) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "lkr",
          product_data: {
            name: `Parcel Delivery (${parcelDetails.parcelId})`,
            description: `From ${parcelDetails.fromBranch.location} to ${parcelDetails.toBranch.location}`,
          },
          unit_amount: amount * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    metadata: {
      parcelId: parcelDetails.parcelId,
      userId: parcelDetails.senderId.toString(),
    },
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
    to, // branch ID
  } = req.body;

  // Authentication check
  if (!req.user)
    return next(new AppError("Unauthorized: No sender information", 401));
  const senderId = req.user.id;

  // Validate branches based on submission type
  let fromBranch, toBranch;

  // Scenario 1: Pickup & Doorstep
  if (submittingType === "pickup" && receivingType === "doorstep") {
    // if (!from) return next(new AppError("'from' branch required for pickup", 400));
    // fromBranch = await Branch.findById(from);
    fromBranch = await Branch.findOne({ location: district });
    if (!fromBranch)
      return next(new AppError("No branch found in Pickup district", 400));
    toBranch = await Branch.findOne({ location: deliveryDistrict });
    if (!toBranch)
      return next(new AppError("No branch found in delivery district", 400));
  }
  // Scenario 2: Pickup & Collection Center
  else if (
    submittingType === "pickup" &&
    receivingType === "collection_center"
  ) {
    if (!from || !to)
      return next(new AppError("Both 'from' and 'to' branches required", 400));
    fromBranch = await Branch.findById(from);
    toBranch = await Branch.findById(to);
  }
  // Scenario 3: Drop-off & Doorstep
  else if (submittingType === "drop-off" && receivingType === "doorstep") {
    if (!to)
      return next(new AppError("'to' branch required for drop-off", 400));
    toBranch = await Branch.findById(to);
    fromBranch = await Branch.findOne({ location: district });
    if (!fromBranch)
      return next(new AppError("No branch found in pickup district", 400));
  }
  // Scenario 4: Drop-off & Collection Center
  else if (
    submittingType === "drop-off" &&
    receivingType === "collection_center"
  ) {
    if (!from || !to)
      return next(new AppError("Both 'from' and 'to' branches required", 400));
    fromBranch = await Branch.findById(from);
    toBranch = await Branch.findById(to);
  }

  if (!fromBranch || !toBranch) {
    return next(
      new AppError("Could not determine branches for this delivery", 400),
    );
  }

  // Find or create receiver
  let receiver = await Receiver.findOne({ receiverEmail });
  if (!receiver) {
    receiver = await Receiver.create({
      receiverFullName,
      receiverContact,
      receiverEmail,
    });
  }

  // Calculate distance between branches
  const distance = getBranchDistance(fromBranch.branchId, toBranch.branchId);

  // Calculate amount
  const basePricePerKm = getBasePricePerKm(itemSize);
  let amount = basePricePerKm * distance;

  // Apply express surcharge
  if (shipmentMethod === "express") {
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
    status: "OrderPlaced",
    from: fromBranch._id,
    to: toBranch._id,
  };

  // Add pickup/delivery info
  if (submittingType === "pickup") {
    parcelData.pickupInformation = {
      pickupDate: new Date(pickupDate),
      pickupTime,
      address,
      city,
      district,
      province,
    };
  }
  if (receivingType === "doorstep") {
    parcelData.deliveryInformation = {
      deliveryAddress,
      deliveryCity,
      deliveryDistrict,
      deliveryProvince,
      postalCode,
    };
  }

  // Handle online payment flow
  if (paymentMethod === "Online") {
    // Create parcel first
    const newParcel = await Parcel.create(parcelData);

    // Create stripe session
    const session = await createStripeSession(
      {
        parcelId: newParcel.parcelId,
        senderId,
        fromBranch,
        toBranch,
      },
      amount,
    );

    // Create payment record
    const newPayment = await Payment.create({
      paymentMethod: "online",
      paidBy: "sender",
      amount,
      paymentStatus: "paid",
      paymentDate: new Date(),
      stripeSessionId: session.id,
      parcelId: newParcel._id,
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
        calculatedAmount: amount,
      },
    });
  }
  // Handle COD payment flow
  else {
    // Create parcel first
    const newParcel = await Parcel.create(parcelData);

    // Create payment record
    const newPayment = await Payment.create({
      paymentMethod: "COD",
      paidBy: "receiver",
      amount,
      paymentStatus: "pending",
      paymentDate: new Date(),
      parcelId: newParcel._id,
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
        calculatedAmount: amount,
      },
    });
  }
});

// Webhook for Stripe payment confirmation
exports.stripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Update payment status
    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        paymentStatus: "paid",
        paymentDate: new Date(),
        stripePaymentId: session.payment_intent,
      },
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

//parcel tracking
exports.getParcelByTrackingNumber = catchAsync(async (req, res, next) => {
  const { trackingNo } = req.params;

  if (!trackingNo) {
    res.status(400);
    throw new Error("Please provide a tracking number");
  }

  const parcel = await Parcel.findOne({ trackingNo })
    .populate("senderId", "fname email phone")
    .populate("receiverId", "name email phone")
    .populate("from to", "branchName address city district province")
    .lean();

  if (!parcel) {
    res.status(404);
    throw new Error("Parcel not found");
  }

  // Format the response with tracking history based on status and timestamps

  const progressPercentage = calculateProgressPercentage(parcel.status);

  res.json({
    ...parcel,
    progress: progressPercentage,
  });
});

// Helper function to calculate progress percentage
const calculateProgressPercentage = (status) => {
  const statusOrder = [
    "OrderPlaced",
    "PendingPickup",
    "PickedUp",
    "ArrivedAtDistributionCenter",
    "ShipmentAssigned",
    "InTransit",
    "ArrivedAtCollectionCenter",
    "DeliveryDispatched",
    "Delivered",
  ];

  const currentIndex = statusOrder.indexOf(status);
  return currentIndex >= 0
    ? Math.round((currentIndex / (statusOrder.length - 1)) * 100)
    : 0;
};
