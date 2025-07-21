// Admin Validation Middleware
const { ZodError } = require('zod');
const { validateRequest } = require("./validationMiddleware");
const { 
  adminRegistrationSchema, 
  adminUpdateSchema, 
  adminIdSchema,
  passwordSchema,
  adminSearchSchema 
} = require("../../validations/adminValidation");
const Admin = require('../../models/AdminModel');

// Enhanced admin registration validation middleware with duplicate checking
const validateAdminRegistration = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = adminRegistrationSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Admin registration validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Perform all duplicate checks in parallel for better performance
    const [
      existingAdminByEmail,
      existingAdminByNIC,
      existingAdminByAdminId,
      existingAdminByContact
    ] = await Promise.all([
      Admin.findOne({ email: validatedData.email }),
      Admin.findOne({ nic: validatedData.nic }),
      Admin.findOne({ adminId: validatedData.adminId }),
      Admin.findOne({ contactNo: validatedData.contactNo })
    ]);

    // Check for duplicates and return specific error messages
    if (existingAdminByEmail) {
      return res.status(409).json({
        status: 'error',
        message: 'An admin with this email address is already registered',
        field: 'email',
        code: 'DUPLICATE_ADMIN_EMAIL'
      });
    }

    if (existingAdminByNIC) {
      return res.status(409).json({
        status: 'error',
        message: 'An admin with this NIC is already registered',
        field: 'nic',
        code: 'DUPLICATE_ADMIN_NIC'
      });
    }

    if (existingAdminByAdminId) {
      return res.status(409).json({
        status: 'error',
        message: 'An admin with this Admin ID is already registered',
        field: 'adminId',
        code: 'DUPLICATE_ADMIN_ID'
      });
    }

    if (existingAdminByContact) {
      return res.status(409).json({
        status: 'error',
        message: 'An admin with this contact number is already registered',
        field: 'contactNo',
        code: 'DUPLICATE_ADMIN_CONTACT'
      });
    }

    // Replace req.body with validated and transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    console.error('Admin registration validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Enhanced admin update validation middleware with duplicate checking
const validateAdminUpdate = async (req, res, next) => {
  try {
    const adminId = req.params.id || req.params.adminId;
    
    if (!adminId) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin ID is required for update',
        code: 'MISSING_ADMIN_ID'
      });
    }

    // First validate the basic structure
    const result = adminUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Admin update validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Check for duplicates only for fields being updated (excluding current admin)
    if (validatedData.email) {
      const existingAdminByEmail = await Admin.findOne({ 
        email: validatedData.email,
        _id: { $ne: adminId }
      });
      if (existingAdminByEmail) {
        return res.status(409).json({
          status: 'error',
          message: 'Another admin with this email already exists',
          field: 'email',
          code: 'DUPLICATE_ADMIN_EMAIL'
        });
      }
    }

    if (validatedData.nic) {
      const existingAdminByNIC = await Admin.findOne({ 
        nic: validatedData.nic,
        _id: { $ne: adminId }
      });
      if (existingAdminByNIC) {
        return res.status(409).json({
          status: 'error',
          message: 'Another admin with this NIC already exists',
          field: 'nic',
          code: 'DUPLICATE_ADMIN_NIC'
        });
      }
    }

    if (validatedData.adminId) {
      const existingAdminByAdminId = await Admin.findOne({ 
        adminId: validatedData.adminId,
        _id: { $ne: adminId }
      });
      if (existingAdminByAdminId) {
        return res.status(409).json({
          status: 'error',
          message: 'Another admin with this Admin ID already exists',
          field: 'adminId',
          code: 'DUPLICATE_ADMIN_ID'
        });
      }
    }

    if (validatedData.contactNo) {
      const existingAdminByContact = await Admin.findOne({ 
        contactNo: validatedData.contactNo,
        _id: { $ne: adminId }
      });
      if (existingAdminByContact) {
        return res.status(409).json({
          status: 'error',
          message: 'Another admin with this contact number already exists',
          field: 'contactNo',
          code: 'DUPLICATE_ADMIN_CONTACT'
        });
      }
    }

    // Replace req.body with validated and transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    console.error('Admin update validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Enhanced admin ID parameter validation
const validateAdminId = (req, res, next) => {
  try {
    const result = adminIdSchema.safeParse(req.params);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Invalid admin ID parameter',
        errors: formattedErrors,
        code: 'INVALID_ADMIN_ID'
      });
    }
    
    req.params = result.data;
    next();
  } catch (error) {
    console.error('Admin ID validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Enhanced password change validation
const validatePasswordChange = (req, res, next) => {
  try {
    const result = passwordSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Password validation failed',
        errors: formattedErrors,
        code: 'INVALID_PASSWORD'
      });
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    console.error('Password validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Enhanced admin search/filter validation
const validateAdminSearch = (req, res, next) => {
  try {
    const result = adminSearchSchema.safeParse(req.query);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Admin search parameters validation failed',
        errors: formattedErrors,
        code: 'INVALID_SEARCH_PARAMS'
      });
    }
    
    req.query = result.data;
    next();
  } catch (error) {
    console.error('Admin search validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

module.exports = {
  validateAdminRegistration,
  validateAdminUpdate,
  validateAdminId,
  validatePasswordChange,
  validateAdminSearch,
};
