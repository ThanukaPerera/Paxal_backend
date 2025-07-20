// Driver Validation Middleware
const { ZodError } = require('zod');
const { 
  driverRegistrationSchema, 
  driverUpdateSchema 
} = require('../../validations/adminValidation');
const Driver = require('../../models/DriverModel');

// Generic validation middleware factory
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const formattedErrors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
          details: result.error.errors
        });
      }
      
      // Replace req.body with validated and transformed data
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
      });
    }
  };
};

// Driver registration validation middleware
const validateDriverRegistration = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = driverRegistrationSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Driver registration validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Perform all duplicate checks in parallel for better performance
    const [
      existingDriverByEmail,
      existingDriverByNIC,
      existingDriverByLicense,
      existingDriverByContact
    ] = await Promise.all([
      Driver.findOne({ email: validatedData.email }),
      Driver.findOne({ nic: validatedData.nic }),
      Driver.findOne({ licenseId: validatedData.licenseId }),
      Driver.findOne({ contactNo: validatedData.contactNo })
    ]);

    // Check for duplicates and return specific error messages
    if (existingDriverByEmail) {
      return res.status(409).json({
        status: 'error',
        message: 'A driver with this email address is already registered',
        field: 'email',
        code: 'DUPLICATE_DRIVER_EMAIL'
      });
    }

    if (existingDriverByNIC) {
      return res.status(409).json({
        status: 'error',
        message: 'A driver with this NIC is already registered',
        field: 'nic',
        code: 'DUPLICATE_DRIVER_NIC'
      });
    }

    if (existingDriverByLicense) {
      return res.status(409).json({
        status: 'error',
        message: 'A driver with this license ID is already registered',
        field: 'licenseId',
        code: 'DUPLICATE_DRIVER_LICENSE'
      });
    }

    if (existingDriverByContact) {
      return res.status(409).json({
        status: 'error',
        message: 'A driver with this contact number is already registered',
        field: 'contactNo',
        code: 'DUPLICATE_DRIVER_CONTACT'
      });
    }

    // Replace req.body with validated and transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    console.error('Driver registration validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Driver update validation middleware
const validateDriverUpdate = async (req, res, next) => {
  try {
    const driverId = req.params.id || req.params.driverId;
    
    if (!driverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Driver ID is required for update'
      });
    }

    // First validate the basic structure
    const result = driverUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Driver update validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Check for duplicates only for fields being updated
    if (validatedData.email) {
      const existingDriverByEmail = await Driver.findOne({ 
        email: validatedData.email,
        _id: { $ne: driverId }
      });
      if (existingDriverByEmail) {
        return res.status(409).json({
          status: 'error',
          message: 'Another driver with this email already exists',
          field: 'email'
        });
      }
    }

    if (validatedData.nic) {
      const existingDriverByNIC = await Driver.findOne({ 
        nic: validatedData.nic,
        _id: { $ne: driverId }
      });
      if (existingDriverByNIC) {
        return res.status(409).json({
          status: 'error',
          message: 'Another driver with this NIC already exists',
          field: 'nic'
        });
      }
    }

    if (validatedData.licenseId) {
      const existingDriverByLicense = await Driver.findOne({ 
        licenseId: validatedData.licenseId,
        _id: { $ne: driverId }
      });
      if (existingDriverByLicense) {
        return res.status(409).json({
          status: 'error',
          message: 'Another driver with this license ID already exists',
          field: 'licenseId'
        });
      }
    }

    if (validatedData.contactNo) {
      const existingDriverByContact = await Driver.findOne({ 
        contactNo: validatedData.contactNo,
        _id: { $ne: driverId }
      });
      if (existingDriverByContact) {
        return res.status(409).json({
          status: 'error',
          message: 'Another driver with this contact number already exists',
          field: 'contactNo'
        });
      }
    }

    // Replace req.body with validated and transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    console.error('Driver update validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

module.exports = {
  validateDriverRegistration,
  validateDriverUpdate,
  validateRequest,
};
