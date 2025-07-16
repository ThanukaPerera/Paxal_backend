const  Branch  = require("../../../models/BranchesModel");

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, contact } = req.body;

    // Check if location already exists for another branch
    const existingBranch = await Branch.findOne({ 
      location: location,
      _id: { $ne: id }
    });

    if (existingBranch) {
      return res.status(400).json({
        status: "error",
        message: "Branch location already exists"
      });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { location, contact },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        status: "error",
        message: "Branch not found"
      });
    }

    res.json({
      status: "success",
      message: "Branch updated successfully",
      branch: updatedBranch
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error during update",
      error: error.message
    });
  }
};

module.exports=updateBranch