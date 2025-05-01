const Driver = require("../../models/DriverModel");
const bcrypt = require("bcryptjs");
const findAdminFunction = require("../../utils/findAdminFunction");

const registerDriver = async (req, res) => {
  try {
    const adminId = req.admin.adminId;
    const response = await findAdminFunction(adminId);

    if (!response || !response._id) {
      return res.status(400).json({ message: "Admin not found" });
    }

    console.log("Admin response", response._id);
    const adminName = response.name;
    console.log(adminId, adminName, "Registering Driver\n", req.body);

    // Find last driver ID and generate the next one
    const lastDriver = await Driver.findOne().sort({ driverId: -1 }).lean();
    let nextDriverId = "DRIVER001"; // Default ID if no drivers exist

    if (lastDriver) {
      const lastIdNumber = parseInt(
        lastDriver.driverId.replace("DRIVER", ""),
        10,
      );
      nextDriverId = `DRIVER${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    // Create new driver with generated ID
    const driverData = {
      ...req.body,
      driverId: nextDriverId,
      password: hashedPassword,
      adminId: response._id, // Store the correct admin ObjectId
    };

    const driver = new Driver(driverData);
    console.log("Driver registered", driverData);

    const savedDriver = await driver.save();
    console.log("Driver saved", savedDriver);

    res.status(201).json({ message: "Driver registered", savedDriver });
  } catch (error) {
    console.error("Driver registration error:", error);
    res.status(500).json({ message: "Error registering driver", error });
  }
};

module.exports = registerDriver;
