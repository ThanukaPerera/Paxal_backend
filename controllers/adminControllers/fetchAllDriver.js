const { Driver } = require("../../models/models");

const fetchAllDrivers = async (req, res) => {
    try {
        const reqAdminId = req.admin.adminId;
        console.log("All driver data is fetched by", reqAdminId);

        const drivers = await Driver.find();
        res.status(200).json({ message: "Drivers fetched successfully", drivers });
    } catch (error) {
        res.status(500).json({ message: "Error fetching drivers", error });
    }
};

module.exports = fetchAllDrivers;
