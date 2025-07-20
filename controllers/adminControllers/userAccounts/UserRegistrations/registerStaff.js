const Staff = require("../../../../models/StaffModel");
const bcrypt = require("bcryptjs");
const findAdminFunction = require("../../../../utils/findAdminFunction");
const sendEmail = require("../../../../utils/admin/sendEmail");
const {
  default: generateRandomPassword,
} = require("../../../../utils/admin/genPassword");

const registerStaff = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;
    if (!adminId) {
      return res.status(400).json({ 
        status: 'error',
        message: "Admin ID is required",
        code: 'MISSING_ADMIN_ID'
      });
    }

    const response = await findAdminFunction(adminId);
    if (!response || !response._id) {
      return res.status(400).json({ 
        status: 'error',
        message: "Admin not found",
        code: 'ADMIN_NOT_FOUND'
      });
    }

    console.log("Admin response", response._id);
    const adminName = response.name;

    // The req.body is already validated and transformed by the middleware
    const validatedData = req.body;

    // Find last staff ID and generate the next one (since staffId is auto-generated)
    const lastStaff = await Staff.findOne().sort({ staffId: -1 }).lean();
    let nextStaffId = "STF001";

    if (lastStaff) {
      const lastIdNumber = parseInt(lastStaff.staffId.replace(/^(STF|STAFF)/, ""), 10);
      nextStaffId = `STF${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    // Generate secure password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const password = generateRandomPassword();

    if (!passwordRegex.test(password)) {
      return res.status(500).json({
        status: "error",
        message: "Failed to generate secure password. Please try again.",
        code: "PASSWORD_GENERATION_ERROR",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new staff with validated data and generated fields
    const staffData = {
      ...validatedData,
      staffId: nextStaffId,
      password: hashedPassword,
      adminId: response._id, // Ensure the correct admin ObjectId is assigned
      status: validatedData.status || "active", // Use validated status or default to active
    };

    const staff = new Staff(staffData);
    const savedStaff = await staff.save();

    // Send email notification with professional template
    try {
      await sendEmail({
        to: validatedData.email,
        subject: "Staff Account Created - Paxal PMS",
        template: "staffAccount",
        templateData: {
          password: password,
          userName: validatedData.name,
          adminId: nextStaffId // Using staffId as the ID for template
        }
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Continue with success response even if email fails
    }

    console.log(adminId, adminName, "Registered Staff", staffData);
    
    // Return success response with staff data (excluding password)
    const { password: _, ...staffResponse } = savedStaff.toObject();
    
    res.status(201).json({ 
      status: 'success',
      message: "Staff registered successfully", 
      data: {
        staff: staffResponse,
        credentials: {
          staffId: nextStaffId,
          tempPassword: password // Include temp password in response for admin
        }
      }
    });
  } catch (error) {
    console.error("Staff registration error:", error);
    
    // Handle MongoDB duplicate key errors (in case validation missed something)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      
      return res.status(409).json({
        status: 'error',
        message: `A staff member with this ${field} already exists: ${value}`,
        field: field,
        code: 'DUPLICATE_STAFF_FIELD'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        code: 'VALIDATION_ERROR'
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Staff registration validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      status: 'error',
      message: "Error registering staff", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = registerStaff;
