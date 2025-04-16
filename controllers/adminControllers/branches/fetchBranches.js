const  Branch  = require("../../../models/BranchesModel");

const fetchBranches=async (req, res) => {
    try {
      const branches = await Branch.find().select("-__v");
      
      const userData=branches;
      res.status(200).json({ message: "Branches fetched successfully", userData,branches });
      
    } catch (error) {
      res.status(500).json({ message: "Error fetching branches", error });
    }
  }

module.exports=fetchBranches;