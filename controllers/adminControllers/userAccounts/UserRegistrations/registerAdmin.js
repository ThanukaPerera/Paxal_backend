const Admin = require("../../../../models/AdminModel");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../../../utils/sendEmail");
const { default: generateRandomPassword } = require("../../../../utils/admin/genPassword");

const registerAdmin = async (req, res) => {
  console.log("Registering admin...", req.body);
  try {
    // The validation is already handled by middleware, so we can use req.body directly
    // req.body has already been validated and transformed by the middleware
    const validatedData = req.body;

    console.log("Validated data:", validatedData);

    // 2. Check Existing Admin by Email
    const existingAdminByEmail = await Admin.findOne({ email: validatedData.email });
    if (existingAdminByEmail) {
      return res.status(409).json({
        status: "error",
        message: "Admin with this email already exists",
        code: "DUPLICATE_EMAIL",
      });
    }

    // 3. Check Existing Admin by NIC
    const existingAdminByNic = await Admin.findOne({ nic: validatedData.nic });
    if (existingAdminByNic) {
      return res.status(409).json({
        status: "error",
        message: "Admin with this NIC already exists",
        code: "DUPLICATE_NIC",
      });
    }

    // 4. Generate and Validate Password
    const password = generateRandomPassword();
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(500).json({
        status: "error",
        message: "Generated password does not meet security requirements",
        code: "PASSWORD_GENERATION_ERROR",
      });
    }

    // 5. ID Generation with Transaction Safety
    const lastAdmin = await Admin.findOne().sort({ adminId: -1 }).lean();
    let nextAdminId = "ADMIN001";

    if (lastAdmin) {
      const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADMIN", ""), 10);
      if (isNaN(lastIdNumber)) {
        throw new Error("Invalid admin ID format in database");
      }
      nextAdminId = `ADMIN${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    // 6. Secure Hashing
    const hashedPassword = await bcrypt.hash(password, 12);

    // 7. Admin Creation
    const adminData = {
      ...validatedData,
      adminId: nextAdminId,
      password: hashedPassword,
    };

    const admin = new Admin(adminData);
    const savedAdmin = await admin.save();
    await sendEmail({
      to: validatedData.email,
      subject: "Admin account password",
      html: `<p>Your password is: <b>${password}</b></br> Reset your password after logged in</p>`,
    });

  
    // 8. Success Response
    res.status(201).json({
      status: "success",
      message: "Admin registered successfully",
      data: {
        adminId: savedAdmin.adminId,
        name: savedAdmin.name,
        email: savedAdmin.email,
      },
    });
  } catch (error) {
    // 9. Error Classification
    let statusCode = 500;
    let errorMessage = "Internal server error";
    let errorCode = "SERVER_ERROR";

    // Handle specific error types
    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      errorCode = "VALIDATION_ERROR";
    } else if (error.message.includes("Invalid admin ID")) {
      statusCode = 500;
      errorMessage = "Database inconsistency detected";
      errorCode = "DB_INCONSISTENCY";
    }

    // 10. Secure Logging
    console.error(`[${new Date().toISOString()}] Admin Registration Error:`, {
      code: errorCode,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      requestBody:
        process.env.NODE_ENV === "development" ? req.body : undefined,
    });

    // 11. Client Response
    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      code: errorCode,
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          message: error.message,
          stack: error.stack,
        },
      }),
    });
  }
};

module.exports = registerAdmin;

// const {Admin}=require("../../models/models");
// const bcrypt=require("bcryptjs");

// const registerAdmin =  async (req, res) => {
//     try {

//       // Find last admin ID and generate the next one
//       const lastAdmin = await Admin.findOne().sort({ adminId: -1 }).lean();
//       let nextAdminId = "ADMIN001"; // Default ID if no admins exist

//       if (lastAdmin) {
//         const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADMIN", ""), 10);
//         nextAdminId = `ADMIN${String(lastIdNumber + 1).padStart(3, "0")}`;
//       }

//       const hashedPassword = await bcrypt.hash(req.body.password, 12);

//       // Create new admin with the generated ID
//       const adminData = {
//         ...req.body,
//         adminId: nextAdminId,
//         password: hashedPassword,
//       };
//       const admin = new Admin(adminData);

//       const savedAdmin = await admin.save();
//       console.log("Admin registered", adminData);
//       res.status(201).json({ message: "Admin registered", savedAdmin });
//     } catch (error) {

//         console.error("Admin registration error:", error);
//       res.status(500).json({ message: "Error registering admin", error });
//     }
//   };

//   module.exports=registerAdmin;
