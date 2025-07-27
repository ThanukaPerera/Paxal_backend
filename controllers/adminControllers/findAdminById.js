const findAdminFunction = require("../../utils/findAdminFunction");

const findAdminById = async (req, res) => {
  try {
    const admin = await findAdminFunction(req.params.adminId);
    console.log("Admin Details:", admin);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin", error });
  }
};

module.exports = findAdminById;
