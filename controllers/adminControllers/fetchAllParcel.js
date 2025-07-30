const Parcel = require("../../models/parcelModel");
const Receiver = require("../../models/receiverModel");
const mongoose = require("mongoose");
const {
  safeConvertDate
} = require("../../utils/admin/convertUTCToColomboTime");

const fetchAllParcel = async (req, res) => {
  console.log("Fetching all parcels with filters...");
  try {
    // Extract filter parameters from query
    const {
      startDate,
      endDate,
      status,
      fromBranch,
      toBranch,
      itemType,
      itemSize,
      shippingMethod,
      receivingType,
      submittingType,
      senderId,
      receiverId,
      paymentId,
      page = 1,
      limit = 100
    } = req.query;
    

    console.log("Filter parameters:", req.query);

    // Build filter query
    let filterQuery = {};

    // Date range filtering
    if (startDate || endDate) {
      filterQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filterQuery.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filterQuery.createdAt.$lte = end;
      }
    }

    // Status filtering
    if (status && status !== 'all') {
      filterQuery.status = status;
    }

    // Branch filtering
    if (fromBranch && fromBranch !== 'all') {
      try {
        filterQuery.from = new mongoose.Types.ObjectId(fromBranch);
      } catch (error) {
        console.warn("Invalid fromBranch ObjectId:", fromBranch);
      }
    }

    if (toBranch && toBranch !== 'all') {
      try {
        filterQuery.to = new mongoose.Types.ObjectId(toBranch);
      } catch (error) {
        console.warn("Invalid toBranch ObjectId:", toBranch);
      }
    }

    // Item filtering
    if (itemType && itemType !== 'all') {
      filterQuery.itemType = itemType;
    }

    if (itemSize && itemSize !== 'all') {
      filterQuery.itemSize = itemSize;
    }

    // Shipping method filtering
    if (shippingMethod && shippingMethod !== 'all') {
      filterQuery.shippingMethod = shippingMethod;
    }

    // Receiving type filtering
    if (receivingType && receivingType !== 'all') {
      filterQuery.receivingType = receivingType;
    }

    // Submitting type filtering
    if (submittingType && submittingType !== 'all') {
      filterQuery.submittingType = submittingType;
    }

    // User/Receiver/Payment filtering
    if (senderId && senderId !== 'all') {
      try {
        filterQuery.senderId = new mongoose.Types.ObjectId(senderId);
      } catch (error) {
        console.warn("Invalid senderId ObjectId:", senderId);
      }
    }

    if (receiverId && receiverId !== 'all') {
      try {
        filterQuery.receiverId = new mongoose.Types.ObjectId(receiverId);
      } catch (error) {
        console.warn("Invalid receiverId ObjectId:", receiverId);
      }
    }

    if (paymentId && paymentId !== 'all') {
      try {
        filterQuery.paymentId = new mongoose.Types.ObjectId(paymentId);
      } catch (error) {
        console.warn("Invalid paymentId ObjectId:", paymentId);
      }
    }

    console.log("Applied filter query:", JSON.stringify(filterQuery, null, 2));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalCount = await Parcel.countDocuments(filterQuery);

    // Fetch parcels with filters and pagination
    const parcels = await Parcel.find(filterQuery)
      .lean()
      .select("-__v -updatedAt")
      .populate({
        path: "senderId",
        select:
          "-customerId -nic -customerFullName -password -createdAt -updatedAt -__v -province -district -city",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "receiverId",
        select: "-__v",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "from",
        select: "branchId location contact",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "to",
        select: "branchId location contact",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "paymentId",
        select: "amount paymentMethod status",
        match: { _id: { $exists: true } },
      })
      .populate("orderPlacedStaffId", "staffId name email")
      .populate("shipmentId", "shipmentId status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`Found ${parcels.length} parcels out of ${totalCount} total`);

    const filteredData = parcels.map((parcel) => ({
      ...parcel,
      senderId: parcel.senderId?._id,
      senderName: `${parcel.senderId?.fName || ''} ${parcel.senderId?.lName || ''}`.trim(),
      senderContact: parcel.senderId?.customerContact,
      senderEmail: parcel.senderId?.customerEmail,
      senderAddress: parcel.senderId?.customerAddress,
      
      // Receiver information
      receiverName: `${parcel.receiverId?.fName || ''} ${parcel.receiverId?.lName || ''}`.trim(),
      receiverContact: parcel.receiverId?.receiverContact,
      receiverEmail: parcel.receiverId?.receiverEmail,
      
      // Branch information
      fromBranchId: parcel.from?.branchId,
      fromBranchLocation: parcel.from?.location,
      fromBranchContact: parcel.from?.contact,
      
      toBranchId: parcel.to?.branchId,
      toBranchLocation: parcel.to?.location,
      toBranchContact: parcel.to?.contact,
      
      // Payment information
      paymentAmount: parcel.paymentId?.amount,
      paymentMethod: parcel.paymentId?.paymentMethod,
      paymentStatus: parcel.paymentId?.status,
      
      // Staff information
      staffId: parcel.orderPlacedStaffId?.staffId,
      staffName: parcel.orderPlacedStaffId?.name,
      staffEmail: parcel.orderPlacedStaffId?.email,
      
      // Shipment information
      shipmentIdRef: parcel.shipmentId?.shipmentId,
      shipmentStatus: parcel.shipmentId?.status,
      
      deliveryAddress: parcel.deliveryInformation,
      itemSize: parcel.parcelSize || parcel.itemSize,
      shipmentMethod: parcel.shipmentMethod || parcel.shippingMethod,
      createdAt: safeConvertDate(parcel.createdAt),
      updatedAt: safeConvertDate(parcel.updatedAt),
    }));

    // Prepare response with pagination info
    const response = {
      success: true,
      data: filteredData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount: totalCount,
        hasNextPage: skip + parcels.length < totalCount,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      filters: {
        applied: Object.keys(req.query).length > 0,
        count: Object.keys(filterQuery).length,
        details: req.query
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.log("Error fetching parcels:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching parcels", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = fetchAllParcel;
