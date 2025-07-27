// Driver Validation Middleware
const { ZodError } = require('zod');
const { 
  driverRegistrationSchema, 
  driverUpdateSchema 
} = require('../../validations/adminValidation');
const Driver = require('../../models/driverModel');

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
        message: 'Driver ID is required for update',
        code: 'MISSING_DRIVER_ID'
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
          field: 'email',
          code: 'DUPLICATE_DRIVER_EMAIL'
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
          field: 'nic',
          code: 'DUPLICATE_DRIVER_NIC'
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
          field: 'licenseId',
          code: 'DUPLICATE_DRIVER_LICENSE'
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
          field: 'contactNo',
          code: 'DUPLICATE_DRIVER_CONTACT'
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

// Additional driver validation utilities for specific use cases

// Validate driver vehicle assignment
const validateDriverVehicleAssignment = async (req, res, next) => {
  try {
    const { vehicleId, driverId } = req.body;
    
    if (!vehicleId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vehicle ID is required for driver assignment',
        field: 'vehicleId',
        code: 'MISSING_VEHICLE_ID'
      });
    }

    if (!driverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Driver ID is required for vehicle assignment',
        field: 'driverId',
        code: 'MISSING_DRIVER_ID'
      });
    }

    // Check if driver exists
    const existingDriver = await Driver.findById(driverId);
    if (!existingDriver) {
      return res.status(404).json({
        status: 'error',
        message: 'Driver not found',
        field: 'driverId',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    // Check if vehicle is already assigned to another driver
    const vehicleAssignment = await Driver.findOne({ 
      vehicleId: vehicleId,
      _id: { $ne: driverId }
    });
    
    if (vehicleAssignment) {
      return res.status(409).json({
        status: 'error',
        message: 'This vehicle is already assigned to another driver',
        field: 'vehicleId',
        code: 'VEHICLE_ALREADY_ASSIGNED'
      });
    }

    next();
  } catch (error) {
    console.error('Driver vehicle assignment validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Validate driver license renewal
const validateDriverLicenseRenewal = async (req, res, next) => {
  try {
    const driverId = req.params.id || req.params.driverId;
    const { newLicenseId, expiryDate } = req.body;
    
    if (!driverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Driver ID is required for license renewal',
        code: 'MISSING_DRIVER_ID'
      });
    }

    if (!newLicenseId) {
      return res.status(400).json({
        status: 'error',
        message: 'New license ID is required',
        field: 'newLicenseId',
        code: 'MISSING_NEW_LICENSE_ID'
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        status: 'error',
        message: 'License expiry date is required',
        field: 'expiryDate',
        code: 'MISSING_EXPIRY_DATE'
      });
    }

    // Validate expiry date is in the future
    const expiry = new Date(expiryDate);
    const today = new Date();
    
    if (expiry <= today) {
      return res.status(400).json({
        status: 'error',
        message: 'License expiry date must be in the future',
        field: 'expiryDate',
        code: 'INVALID_EXPIRY_DATE'
      });
    }

    // Check if driver exists
    const existingDriver = await Driver.findById(driverId);
    if (!existingDriver) {
      return res.status(404).json({
        status: 'error',
        message: 'Driver not found',
        field: 'driverId',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    // Check if new license ID is already in use by another driver
    const duplicateLicense = await Driver.findOne({
      licenseId: newLicenseId,
      _id: { $ne: driverId }
    });

    if (duplicateLicense) {
      return res.status(409).json({
        status: 'error',
        message: 'This license ID is already registered to another driver',
        field: 'newLicenseId',
        code: 'DUPLICATE_DRIVER_LICENSE'
      });
    }

    next();
  } catch (error) {
    console.error('Driver license renewal validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Validate bulk driver operations
const validateBulkDriverOperation = (req, res, next) => {
  try {
    const { driverIds, operation } = req.body;
    
    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Driver IDs array is required and must not be empty',
        field: 'driverIds',
        code: 'MISSING_DRIVER_IDS'
      });
    }

    if (driverIds.length > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot process more than 50 drivers at once',
        field: 'driverIds',
        code: 'TOO_MANY_DRIVER_IDS'
      });
    }

    if (!operation) {
      return res.status(400).json({
        status: 'error',
        message: 'Operation type is required',
        field: 'operation',
        code: 'MISSING_OPERATION'
      });
    }

    const validOperations = ['activate', 'deactivate', 'delete', 'update_branch', 'reassign_vehicle'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`,
        field: 'operation',
        code: 'INVALID_OPERATION'
      });
    }

    // Validate all driver IDs are valid MongoDB ObjectIds
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const invalidIds = driverIds.filter(id => !objectIdPattern.test(id));
    
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid Driver ID format: ${invalidIds.join(', ')}`,
        field: 'driverIds',
        code: 'INVALID_DRIVER_ID_FORMAT',
        details: { invalidIds }
      });
    }

    next();
  } catch (error) {
    console.error('Bulk driver operation validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Driver ID parameter validation middleware
const validateDriverId = (req, res, next) => {
  try {
    const driverId = req.params.id || req.params.driverId;
    
    if (!driverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Driver ID parameter is required',
        code: 'MISSING_DRIVER_ID_PARAM'
      });
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(driverId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Driver ID format',
        field: 'driverId',
        code: 'INVALID_DRIVER_ID_FORMAT'
      });
    }

    next();
  } catch (error) {
    console.error('Driver ID validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Export additional validation functions
module.exports.validateDriverVehicleAssignment = validateDriverVehicleAssignment;
module.exports.validateDriverLicenseRenewal = validateDriverLicenseRenewal;
module.exports.validateBulkDriverOperation = validateBulkDriverOperation;
module.exports.validateDriverId = validateDriverId;
