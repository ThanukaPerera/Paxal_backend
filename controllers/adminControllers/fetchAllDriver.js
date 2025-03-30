const { Driver } = require("../../models/models");

const fetchAllDrivers = async (req, res) => {
    try {
        const reqAdminId = req.admin.adminId;
        console.log("All driver data is fetched by", reqAdminId);

        const drivers = await Driver.find()
        .populate("adminId","adminId name contactNo")
        .populate("branchId","branchId location contactNo");
        const filteredData = drivers.map(driver => ({
            driverId: driver.driverId,
            name: driver.name,
            nic:driver.nic,
            email:driver.email,
            contactNo: driver.contactNo,
            licenseId: driver.licenseId,
            branchId:driver.branchId?.branchId,
            branchLocation: driver.branchId?.location, // Extracting location from branchId
            adminId: driver.adminId?.adminId, // Extracting adminId only
            adminName: driver.adminId?.name // Extracting admin name
        }));
        
    
        

        res.status(200).json({ message: "Drivers fetched successfully", DriverData:filteredData });
    } catch (error) {
        res.status(500).json({ message: "Error fetching drivers", error });
    }
};

module.exports = fetchAllDrivers;
