const { Driver } = require("../../models/models");

const fetchAllDrivers = async (req, res) => {
    try {
        
        const drivers = await Driver.find().select("-password -driverId -__v -updatedAt")
        .populate("adminId","-adminId -password -email -contactNo -createdAt -profilePicLink -__v -updatedAt")
        .populate("branchId","-branchId -__v -updatedAt");

      

        const userData=drivers.map(driver=>({
            _id:driver._id,
            name:driver.name,
            nic:driver.nic,
            email:driver.email,
            contactNo:driver.contactNo,
            licenseId:driver.licenseId,
            branchId:driver.branchId?._id,
            branchLocation: driver.branchId?.location,
            branchContactNo:driver.branchId?.contact, // Extracting location from branchId
            adminId: driver.adminId?._id, // Extracting adminId only
            adminName: driver.adminId?.name, // Extracting admin name
            createdAt:driver.createdAt
        }))
        
    
        

        res.status(200).json({ message: "Drivers fetched successfully", userData });
    } catch (error) {
        res.status(500).json({ message: "Error fetching drivers", error });
    }
};

module.exports = fetchAllDrivers;
