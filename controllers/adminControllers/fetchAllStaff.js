const { Staff } = require("../../models/models");

const fetchAllStaff = async (req, res) => {
    try {
        const reqAdminId = req.admin.adminId;
        console.log("All staff data is fetched by", reqAdminId);

        const staff = await Staff.find();
        res.status(200).json({ message: "Staff fetched successfully", staff });
    } catch (error) {
        res.status(500).json({ message: "Error fetching staff", error });
    }
};

module.exports = fetchAllStaff;
