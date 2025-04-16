
const Admin = require("../../models/AdminModel");

const fetchAllAdmin =async (req, res) => {
    try {
      const reqAdminId=req.admin.adminId;
      const reqAdmin = await Admin.findOne({ adminId: reqAdminId });
  
      console.log("All admin data is fetched by",reqAdminId,reqAdmin.name);
      const admins = await Admin.find();
      res.status(200).json({ message: "Admins fetched successfully", admins });
      
    } catch (error) {
      res.status(500).json({ message: "Error fetching admins", error });
    }
  }

  module.exports = fetchAllAdmin;