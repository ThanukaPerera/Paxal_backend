const Admin = require('../../../../models/AdminModel');
const { adminSearchSchema } = require('../../../../validations/adminValidation');
const { safeValidate } = require('../../../../middleware/adminMiddleware/validationMiddleware');

const fetchAllAdmin = async (req, res) => {
  try {
    
    
    // Use validated data from middleware or fallback to manual parsing
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    console.log("Processed params:", { page, limit, search, sortBy, sortOrder });

    // 2. Build search filter
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { adminId: { $regex: search, $options: 'i' } },
          { contactNo: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    console.log("Search filter:", searchFilter);

    // 3. Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;
    console.log("Sort object:", sortObject);

    // 4. Calculate pagination
    const skip = (page - 1) * limit;
    console.log("Pagination:", { skip, limit });

    // 5. Execute queries
    console.log("Executing database queries...");
    const [rawAdmins, totalCount] = await Promise.all([
      Admin.find(searchFilter)
        .select("-password -__v -resetCode -resetCodeExpires")
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Admin.countDocuments(searchFilter)
    ]);
    
    // Transform admins to include id field for frontend compatibility
    const admins = rawAdmins.map(admin => ({
      ...admin,
      id: admin._id, // Frontend expects 'id' property
    }));
    
    console.log("Database results:", { 
      adminCount: admins.length, 
      totalCount,
      firstAdmin: admins[0] ? admins[0].name : 'No admins found',
      sampleAdmin: admins[0] ? { id: admins[0].id, name: admins[0].name, adminId: admins[0].adminId } : null
    });

    // 6. Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    
    // 7. Success response (matching frontend expectations)
    const responseData = {
      status: "success",
      message: "Admins fetched successfully",
      userData: admins, // Frontend expects userData property
      data: {
        admins,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        },
        filters: {
          search: search || null,
          sortBy,
          sortOrder
        }
      }
    };
    
    console.log("Sending response:", {
      status: responseData.status,
      adminCount: admins.length,
      totalCount,
      page
    });
    console.log("=== FETCH ALL ADMINS END ===");
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error("=== FETCH ALL ADMINS ERROR ===");
    console.error(`[${new Date().toISOString()}] Fetch All Admins Error:`, {
      message: error.message,
      stack: error.stack,
      query: req.query,
      path: req.path,
      method: req.method
    });
    console.error("=== ERROR END ===");

    res.status(500).json({
      status: "error",
      message: "Error fetching admins",
      code: "SERVER_ERROR",
      userData: [], // Provide empty array for frontend compatibility
      details: {
        originalError: error.message,
        query: req.query
      },
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          message: error.message,
          stack: error.stack,
        },
      }),
    });
  }
};

module.exports = fetchAllAdmin;
