const Branch = require("../../../models/BranchesModel");
const Staff = require("../../../models/StaffModel");
const Parcel = require("../../../models/ParcelModel");

const fetchStaffByBranchId = async (req, res) => {
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

    // Add status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { nic: { $regex: search, $options: 'i' } },
        { contactNo: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch staff with populated references
    const staff = await Staff.find(query)
      .populate('branchId', 'branchId location contact')
      .populate('adminId', 'name email')
      .select('-password -resetPasswordToken') // Exclude sensitive fields
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalStaff = await Staff.countDocuments(query);
    const totalPages = Math.ceil(totalStaff / limitNum);

    // Get staff statistics
    const staffStats = await Staff.aggregate([
      { $match: { branchId: id } },
      {
        $group: {
          _id: null,
          totalStaff: { $sum: 1 },
          activeStaff: { 
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
          },
          inactiveStaff: { 
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } 
          }
        }
      }
    ]);

    // Get staff activity (parcels handled by each staff member)
    const staffActivity = await Promise.all(
      staff.map(async (staffMember) => {
        const parcelsHandled = await Parcel.countDocuments({
          $or: [
            { orderPlacedStaffId: staffMember._id },
            { 'pickupInformation.staffId': staffMember._id },
            { 'deliveryInformation.staffId': staffMember._id }
          ]
        });

        const recentParcels = await Parcel.countDocuments({
          $or: [
            { orderPlacedStaffId: staffMember._id },
            { 'pickupInformation.staffId': staffMember._id },
            { 'deliveryInformation.staffId': staffMember._id }
          ],
          updatedAt: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        });

        return {
          staffId: staffMember._id,
          name: staffMember.name,
          totalParcelsHandled: parcelsHandled,
          recentParcelsHandled: recentParcels
        };
      })
    );

    // Get recent staff activities
    const recentActivities = await Staff.find({ branchId: id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name staffId status updatedAt')
      .lean();

    res.status(200).json({
      success: true,
      message: "Staff members fetched successfully",
      data: {
        branch: {
          id: branch._id,
          branchId: branch.branchId,
          location: branch.location,
          contact: branch.contact
        },
        staff,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStaff,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        },
        statistics: staffStats[0] || {
          totalStaff: 0,
          activeStaff: 0,
          inactiveStaff: 0
        },
        staffActivity,
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
    console.error("Error fetching staff by branch ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = fetchStaffByBranchId;
