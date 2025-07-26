const Branch = require("../../../models/BranchesModel");

const fetchAllBranches = async (req, res) => {
  try {
    // Fetch all branches with only necessary fields for dropdown
    const branches = await Branch.find({})
      .select('_id location contact')
      .sort({ location: 1 }); // Sort alphabetically by location

    if (!branches || branches.length === 0) {
      return res.status(404).json({
        status: "success",
        message: "No branches found",
        data: {
          branches: []
        }
      });
    }

    // Format the response for dropdown usage
    const formattedBranches = branches.map(branch => ({
      value: branch._id.toString(),
      label: branch.location,
      contact: branch.contact
    }));

    return res.status(200).json({
      status: "success",
      message: "Branches fetched successfully",
      data: {
        branches: formattedBranches,
        total: branches.length
      }
    });

  } catch (error) {
    console.error("Error fetching branches:", error);
    
    return res.status(500).json({
      status: "error",
      message: "Internal server error while fetching branches",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = fetchAllBranches;
