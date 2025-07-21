// Staff Validation Middleware
const { ZodError } = require('zod');
const { 
  staffRegistrationSchema, 
  staffUpdateSchema 
} = require('../../validations/adminValidation');
const Staff = require('../../models/StaffModel');

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

// Staff registration validation middleware
const validateStaffRegistration = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = staffRegistrationSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Staff registration validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Perform duplicate checks in parallel for better performance
    // Note: Skip staffId check during registration since it's auto-generated
    const [
      existingStaffByEmail,
      existingStaffByNIC,
      existingStaffByContact
    ] = await Promise.all([
      Staff.findOne({ email: validatedData.email }),
      Staff.findOne({ nic: validatedData.nic }),
      Staff.findOne({ contactNo: validatedData.contactNo })
    ]);

    // Check for duplicates and return specific error messages
    if (existingStaffByEmail) {
      return res.status(409).json({
        status: 'error',
        message: 'A staff member with this email address is already registered',
        field: 'email',
        code: 'DUPLICATE_STAFF_EMAIL'
      });
    }

    if (existingStaffByNIC) {
      return res.status(409).json({
        status: 'error',
        message: 'A staff member with this NIC is already registered',
        field: 'nic',
        code: 'DUPLICATE_STAFF_NIC'
      });
    }

    if (existingStaffByContact) {
      return res.status(409).json({
        status: 'error',
        message: 'A staff member with this contact number is already registered',
        field: 'contactNo',
        code: 'DUPLICATE_STAFF_CONTACT'
      });
    }

    // Replace req.body with validated and transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    console.error('Staff registration validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Staff update validation middleware
const validateStaffUpdate = async (req, res, next) => {
  try {
    const staffId = req.params.id || req.params.staffId;
    
    if (!staffId) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff ID is required for update',
        code: 'MISSING_STAFF_ID'
      });
    }

    // First validate the basic structure
    const result = staffUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Staff update validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Check for duplicates only for fields being updated (excluding current staff)
    if (validatedData.email) {
      const existingStaffByEmail = await Staff.findOne({ 
        email: validatedData.email,
        _id: { $ne: staffId }
      });
      if (existingStaffByEmail) {
        return res.status(409).json({
          status: 'error',
          message: 'Another staff member with this email already exists',
          field: 'email',
          code: 'DUPLICATE_STAFF_EMAIL'
        });
      }
    }

    if (validatedData.nic) {
      const existingStaffByNIC = await Staff.findOne({ 
        nic: validatedData.nic,
        _id: { $ne: staffId }
      });
      if (existingStaffByNIC) {
        return res.status(409).json({
          status: 'error',
          message: 'Another staff member with this NIC already exists',
          field: 'nic',
          code: 'DUPLICATE_STAFF_NIC'
        });
      }
    }

    if (validatedData.staffId) {
      const existingStaffByStaffId = await Staff.findOne({ 
        staffId: validatedData.staffId,
        _id: { $ne: staffId }
      });
      if (existingStaffByStaffId) {
        return res.status(409).json({
          status: 'error',
          message: 'Another staff member with this Staff ID already exists',
          field: 'staffId',
          code: 'DUPLICATE_STAFF_ID'
        });
      }
    }

    if (validatedData.contactNo) {
      const existingStaffByContact = await Staff.findOne({ 
        contactNo: validatedData.contactNo,
        _id: { $ne: staffId }
      });
      if (existingStaffByContact) {
        return res.status(409).json({
          status: 'error',
          message: 'Another staff member with this contact number already exists',
          field: 'contactNo',
          code: 'DUPLICATE_STAFF_CONTACT'
        });
      }
    }

    // Replace req.body with validated and transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    console.error('Staff update validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Staff status validation middleware (for status changes)
const validateStaffStatus = (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required',
        code: 'MISSING_STATUS'
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "active" or "inactive"',
        field: 'status',
        code: 'INVALID_STATUS'
      });
    }

    next();
  } catch (error) {
    console.error('Staff status validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Staff ID parameter validation middleware
const validateStaffId = (req, res, next) => {
  try {
    const staffId = req.params.id || req.params.staffId;
    
    if (!staffId) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff ID parameter is required',
        code: 'MISSING_STAFF_ID_PARAM'
      });
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(staffId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Staff ID format',
        field: 'staffId',
        code: 'INVALID_STAFF_ID_FORMAT'
      });
    }

    next();
  } catch (error) {
    console.error('Staff ID validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

module.exports = {
  validateStaffRegistration,
  validateStaffUpdate,
  validateStaffStatus,
  validateStaffId,
  validateRequest,
};

// Additional staff validation utilities for specific use cases

// Validate staff assignment to branch
const validateStaffBranchAssignment = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.body;
    
    if (!branchId) {
      return res.status(400).json({
        status: 'error',
        message: 'Branch ID is required for staff assignment',
        field: 'branchId',
        code: 'MISSING_BRANCH_ID'
      });
    }

    if (!staffId) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff ID is required for branch assignment',
        field: 'staffId', 
        code: 'MISSING_STAFF_ID'
      });
    }

    // Check if staff exists
    const existingStaff = await Staff.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({
        status: 'error',
        message: 'Staff member not found',
        field: 'staffId',
        code: 'STAFF_NOT_FOUND'
      });
    }

    next();
  } catch (error) {
    console.error('Staff branch assignment validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Validate staff status change with additional business rules
const validateStaffStatusChange = async (req, res, next) => {
  try {
    const staffId = req.params.id || req.params.staffId;
    const { status, reason } = req.body;
    
    if (!staffId) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff ID is required for status change',
        code: 'MISSING_STAFF_ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required',
        field: 'status',
        code: 'MISSING_STATUS'
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "active" or "inactive"',
        field: 'status',
        code: 'INVALID_STATUS'
      });
    }

    // Check if staff exists
    const existingStaff = await Staff.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({
        status: 'error',
        message: 'Staff member not found',
        field: 'staffId',
        code: 'STAFF_NOT_FOUND'
      });
    }

    // Check if status is actually changing
    if (existingStaff.status === status) {
      return res.status(400).json({
        status: 'error',
        message: `Staff member is already ${status}`,
        field: 'status',
        code: 'STATUS_UNCHANGED'
      });
    }

    // Require reason for deactivation
    if (status === 'inactive' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Reason is required when deactivating a staff member',
        field: 'reason',
        code: 'MISSING_DEACTIVATION_REASON'
      });
    }

    next();
  } catch (error) {
    console.error('Staff status change validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Validate bulk staff operations
const validateBulkStaffOperation = (req, res, next) => {
  try {
    const { staffIds, operation } = req.body;
    
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Staff IDs array is required and must not be empty',
        field: 'staffIds',
        code: 'MISSING_STAFF_IDS'
      });
    }

    if (staffIds.length > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot process more than 50 staff members at once',
        field: 'staffIds',
        code: 'TOO_MANY_STAFF_IDS'
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

    const validOperations = ['activate', 'deactivate', 'delete', 'update_branch'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`,
        field: 'operation',
        code: 'INVALID_OPERATION'
      });
    }

    // Validate all staff IDs are valid MongoDB ObjectIds
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const invalidIds = staffIds.filter(id => !objectIdPattern.test(id));
    
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid Staff ID format: ${invalidIds.join(', ')}`,
        field: 'staffIds',
        code: 'INVALID_STAFF_ID_FORMAT',
        details: { invalidIds }
      });
    }

    next();
  } catch (error) {
    console.error('Bulk staff operation validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Export additional validation functions
module.exports.validateStaffBranchAssignment = validateStaffBranchAssignment;
module.exports.validateStaffStatusChange = validateStaffStatusChange;
module.exports.validateBulkStaffOperation = validateBulkStaffOperation;
