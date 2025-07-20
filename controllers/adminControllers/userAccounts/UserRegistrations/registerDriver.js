const Driver = require("../../../../models/DriverModel");
const bcrypt = require("bcryptjs");
const findAdminFunction = require("../../../../utils/findAdminFunction");
const sendEmail = require("../../../../utils/admin/sendEmail");
const {
  default: generateRandomPassword,
} = require("../../../../utils/admin/genPassword");

const registerDriver = async (req, res) => {
  try {
    console.log(req.params);
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
        10
      );
      nextDriverId = `DRIVER${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    // Generate random password (validation middleware has already validated req.body)
    const password = generateRandomPassword();

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        status: "error",
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
        code: "WEAK_PASSWORD",
      });
    }

    // Send email notification to admin
    await sendEmail({
      to: response.email,
      subject: "Driver Account Created Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Driver Account Created</h2>
          <p>A new driver account has been created successfully.</p>
          <h3>Driver Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${req.body.name}</li>
            <li><strong>Email:</strong> ${req.body.email}</li>
            <li><strong>NIC:</strong> ${req.body.nic}</li>
            <li><strong>Contact:</strong> ${req.body.contactNo}</li>
            <li><strong>License ID:</strong> ${req.body.licenseId}</li>
            <li><strong>Driver ID:</strong> ${nextDriverId}</li>
          </ul>
          <p><strong>Temporary Password:</strong> ${password}</p>
          <p style="color: #ff6b6b;"><em>Please inform the driver to change their password after first login.</em></p>
        </div>
      `,
    });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new driver with generated ID (req.body is already validated and transformed)
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

    res.status(201).json({ 
      status: "success",
      message: "Driver registered successfully", 
      data: {
        driverId: savedDriver.driverId,
        name: savedDriver.name,
        email: savedDriver.email,
        nic: savedDriver.nic,
        contactNo: savedDriver.contactNo,
        licenseId: savedDriver.licenseId,
        branchId: savedDriver.branchId,
        vehicleId: savedDriver.vehicleId,
        createdAt: savedDriver.createdAt
      }
    });
  } catch (error) {
    console.error("Driver registration error:", error);
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = `A driver with this ${field} already exists`;
      
      // Provide more specific messages
      switch (field) {
        case 'email':
          message = 'A driver with this email address is already registered';
          break;
        case 'nic':
          message = 'A driver with this NIC is already registered';
          break;
        case 'licenseId':
          message = 'A driver with this license ID is already registered';
          break;
        case 'contactNo':
          message = 'A driver with this contact number is already registered';
          break;
        case 'driverId':
          message = 'Driver ID conflict - please try again';
          break;
      }
      
      return res.status(409).json({ 
        status: "error",
        message: message,
        field: field,
        code: 'DUPLICATE_DRIVER_FIELD'
      });
    }
    
    res.status(500).json({ 
      status: "error",
      message: "Error registering driver", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = registerDriver;
