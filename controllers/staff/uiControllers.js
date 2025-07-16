const Branch = require("../../models/BranchesModel");
const Staff = require("../../models/StaffModel");

// Get branches for the staff to select in parcel registration form.
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    return res.status(200).json(branches);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching branches", error });
  }
};

// Get logged in staff member information for the navigation bar.
const getStaffInformation = async (req, res) => {
  try {
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id).populate("branchId","location");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    return res.status(200).json(staff);
    
  } catch (error) {
    return res.status(500).json({ message: "Error fetching staff information", error });
  }
};

module.exports = {
  getAllBranches,
  getStaffInformation,
};
