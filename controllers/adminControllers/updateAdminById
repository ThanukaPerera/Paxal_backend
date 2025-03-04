const findAdminFunction =require("../../utils/findAdminFunction");

const updateAdminById = async (req, res) => {
    try {
      const admin = await findAdminFunction(req.params.adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      Object.assign(admin, req.body);
      const updatedAdmin = await admin.save();
      res
        .status(200)
        .json({ message: "Admin updated successfully", updatedAdmin });
    } catch (error) {
      res.status(500).json({ message: "Error updating admin", error });
    }
  }

  module.exports = updateAdminById;