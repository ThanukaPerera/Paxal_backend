const Driver = require("../../../../models/driverModel");

const fetchAllDrivers = async (req, res) => {

  // Fetch all drivers from the database`
  // Populate adminId and branchId with specific fields
  // Exclude password and other sensitive fields from the response
  try {
    const drivers = await Driver.find()
      .select("-password -__v -updatedAt")
      .populate(
        "adminId",
        "-adminId -password -email -contactNo -createdAt -profilePicLink -__v -updatedAt",
      )
      .populate("branchId", "-branchId -__v -updatedAt");
    if (!drivers || drivers.length === 0) {
      return res.status(404).json({ message: "No drivers found" });
    }
    const userData = drivers.map((driver) => ({
      _id: driver._id,
      driverId: driver.driverId,
      name: driver.name,
      nic: driver.nic,
      email: driver.email,
      contactNo: driver.contactNo,
      licenseId: driver.licenseId,
      branchId: driver.branchId?._id,
      branchLocation: driver.branchId?.location,
      branchContactNo: driver.branchId?.contact, // Extracting location from branchId
      adminId: driver.adminId?._id, // Extracting adminId only
      adminName: driver.adminId?.name, // Extracting admin name
      createdAt: driver.createdAt,
    }));

    res.status(200).json({ message: "Drivers fetched successfully", userData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching drivers", error });
  }
};

module.exports = fetchAllDrivers;
