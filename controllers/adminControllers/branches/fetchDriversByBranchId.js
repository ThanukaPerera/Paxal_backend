const Branch = require("../../../models/BranchesModel");
const Driver = require("../../../models/driverModel");
const Vehicle = require("../../../models/VehicleModel");

const fetchDriversByBranchId = async (req, res) => {
  const { id } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search = '',
    status = 'all' // active, inactive, all
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
    const query = { branchId: id };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { driverId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
        { licenseId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch drivers with populated references
    const drivers = await Driver.find(query)
      .populate('branchId', 'branchId location contact')
      .populate('adminId', 'name email')
      .populate('vehicleId', 'vehicleId registrationNo vehicleType available capableVolume capableWeight')
      .select('-password') // Exclude password field
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalDrivers = await Driver.countDocuments(query);
    const totalPages = Math.ceil(totalDrivers / limitNum);

    // Get driver statistics
    const driverStats = await Driver.aggregate([
      { $match: { branchId: id } },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $group: {
          _id: null,
          totalDrivers: { $sum: 1 },
          availableVehicles: { 
            $sum: { $cond: [{ $eq: ['$vehicle.available', true] }, 1, 0] } 
          },
          unavailableVehicles: { 
            $sum: { $cond: [{ $eq: ['$vehicle.available', false] }, 1, 0] } 
          },
          pickupDeliveryVehicles: {
            $sum: { $cond: [{ $eq: ['$vehicle.vehicleType', 'pickupDelivery'] }, 1, 0] }
          },
          shipmentVehicles: {
            $sum: { $cond: [{ $eq: ['$vehicle.vehicleType', 'shipment'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get recent driver activities (if needed)
    const recentActivities = await Driver.find({ branchId: id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('vehicleId', 'vehicleId registrationNo vehicleType')
      .select('name driverId updatedAt')
      .lean();

    res.status(200).json({
      success: true,
      message: "Drivers fetched successfully",
      data: {
        branch: {
          id: branch._id,
          branchId: branch.branchId,
          location: branch.location,
          contact: branch.contact
        },
        drivers,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalDrivers,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        },
        statistics: driverStats[0] || {
          totalDrivers: 0,
          availableVehicles: 0,
          unavailableVehicles: 0,
          pickupDeliveryVehicles: 0,
          shipmentVehicles: 0
        },
        recentActivities,
        filters: {
          search,
          status,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error("Error fetching drivers by branch ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = fetchDriversByBranchId;
