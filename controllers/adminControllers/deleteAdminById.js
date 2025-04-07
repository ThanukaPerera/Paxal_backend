const {Admin} = require('../../models/models');

const deleteAdminById =async (req, res) => {
    try {
      // const result = await Admin.deleteOne({ adminId: req.params.adminId });
      const result = await Admin.findByIdAndDelete(req.params.adminId);
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.status(200).json({ message: "Admin deleted successfully", result });
    } catch (error) {
      res.status(500).json({ message: "Error deleting admin", error });
    }
  };

  module.exports = deleteAdminById;

