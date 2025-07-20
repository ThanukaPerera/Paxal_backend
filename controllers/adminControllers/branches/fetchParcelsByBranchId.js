const Branch = require("../../../models/BranchesModel");
const Parcel = require("../../../models/ParcelModel");

const fetchParcelsByBranchId = async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    itemType,
    shippingMethod 
  } = req.query;

  try {
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid branch ID format" 
      });
    }

    // Check if branch exists
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ 
        success: false,
        message: "Branch not found" 
      });
    }

    // Build query filters
    const query = {
      $or: [
        { from: id },
        { to: id },
        { 'pickupInformation.staffId': { $exists: true } },
        { 'deliveryInformation.staffId': { $exists: true } }
      ]
    };

    // Add additional filters if provided
    if (status) {
      query.status = status;
    }
    if (itemType) {
      query.itemType = itemType;
    }
    if (shippingMethod) {
      query.shippingMethod = shippingMethod;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch parcels with populated references
    const parcels = await Parcel.find(query)
      .populate('senderId', 'name email contactNo')
      .populate('receiverId', 'name email contactNo address')
      .populate('paymentId', 'amount status paymentMethod')
      .populate('orderPlacedStaffId', 'name staffId')
      .populate('shipmentId', 'shipmentId status')
      .populate('from', 'branchId location contact')
      .populate('to', 'branchId location contact')
      .populate('pickupInformation.staffId', 'name staffId')
      .populate('deliveryInformation.staffId', 'name staffId')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalParcels = await Parcel.countDocuments(query);
    const totalPages = Math.ceil(totalParcels / limitNum);

    // Get status distribution
    const statusDistribution = await Parcel.aggregate([
      { $match: { $or: [{ from: id }, { to: id }] } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Parcels fetched successfully",
      data: {
        branch: {
          id: branch._id,
          branchId: branch.branchId,
          location: branch.location,
          contact: branch.contact
        },
        parcels,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalParcels,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        },
        statusDistribution,
        filters: {
          status,
          itemType,
          shippingMethod,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error("Error fetching parcels by branch ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = fetchParcelsByBranchId;