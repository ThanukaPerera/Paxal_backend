const {Admin}=require("../../models/models");
const bcrypt=require("bcryptjs");

const registerAdmin =  async (req, res) => {
    try {
      
      // Find last admin ID and generate the next one
      const lastAdmin = await Admin.findOne().sort({ adminId: -1 }).lean();
      let nextAdminId = "ADMIN001"; // Default ID if no admins exist
  
      if (lastAdmin) {
        const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADMIN", ""), 10);
        nextAdminId = `ADMIN${String(lastIdNumber + 1).padStart(3, "0")}`;
      }
  
      const hashedPassword = await bcrypt.hash(req.body.password, 12);
  
      // Create new admin with the generated ID
      const adminData = {
        ...req.body,
        adminId: nextAdminId,
        password: hashedPassword,
      };
      const admin = new Admin(adminData);
      console.log("Admin registered", adminData);
      const savedAdmin = await admin.save();
      console.log("Admin saved", savedAdmin);
      res.status(201).json({ message: "Admin registered", savedAdmin });
    } catch (error) {

        console.error("Admin registration error:", error); 
      res.status(500).json({ message: "Error registering admin", error });
    }
  };

  module.exports=registerAdmin;