const mongoose = require("mongoose");
const Branch = require("../../../models/BranchesModel"); // Adjust the path as needed

const deleteBranch = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }

    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({ status: "error", message: "Branch not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Branch deleted successfully",
      deletedBranch,
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = deleteBranch;
