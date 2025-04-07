const { Branch } = require("../../../models/models");

const fetchBranches=async (req, res) => {
    try {
      const branches = await Branch.find();
      res.status(200).json({ message: "Branches fetched successfully", branches });
      
    } catch (error) {
      res.status(500).json({ message: "Error fetching branches", error });
    }
  }

module.exports=fetchBranches;