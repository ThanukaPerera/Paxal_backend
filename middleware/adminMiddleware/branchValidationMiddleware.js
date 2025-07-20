// Branch Validation Middleware
const { ZodError } = require('zod');
const { 
  branchRegistrationSchema, 
  branchUpdateSchema 
} = require('../../validations/adminValidation');
const Branch = require('../../models/BranchesModel');

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

// Branch registration validation middleware
const validateBranchRegistration = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = branchRegistrationSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Branch registration validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;

    // Perform duplicate checks in parallel for better performance
    const [
      existingBranchByLocation,
      existingBranchByContact
    ] = await Promise.all([
      Branch.findOne({ 
        location: { $regex: new RegExp(`^${validatedData.location.trim()}$`, 'i') }
      }),
      Branch.findOne({ contact: validatedData.contact })
    ]);

    // Check for duplicates and return specific error messages
    if (existingBranchByLocation) {
      return res.status(409).json({
        status: 'error',
        message: 'A branch at this location already exists',
        field: 'location',
        code: 'DUPLICATE_BRANCH_LOCATION'
      });
    }

    if (existingBranchByContact) {
      return res.status(409).json({
        status: 'error',
        message: 'A branch with this contact number already exists',
        field: 'contact',
        code: 'DUPLICATE_BRANCH_CONTACT'
      });
    }

    // If all validations pass, attach validated data to request
    req.body = validatedData;
    next();
    
  } catch (error) {
    console.error('Branch registration validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error during branch registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Branch update validation middleware
const validateBranchUpdate = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = branchUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Branch update validation failed',
        errors: formattedErrors,
        details: result.error.errors
      });
    }

    const validatedData = result.data;
    const branchId = req.params.id;

    // Check if branch exists
    const existingBranch = await Branch.findById(branchId);
    if (!existingBranch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found',
        code: 'BRANCH_NOT_FOUND'
      });
    }

    // Check for duplicates only if fields are being updated
    const duplicateChecks = [];
    
    if (validatedData.location && validatedData.location !== existingBranch.location) {
      duplicateChecks.push(
        Branch.findOne({ 
          location: { $regex: new RegExp(`^${validatedData.location.trim()}$`, 'i') },
          _id: { $ne: branchId }
        }).then(branch => ({ type: 'location', branch }))
      );
    }
    
    if (validatedData.contact && validatedData.contact !== existingBranch.contact) {
      duplicateChecks.push(
        Branch.findOne({ 
          contact: validatedData.contact,
          _id: { $ne: branchId }
        }).then(branch => ({ type: 'contact', branch }))
      );
    }

    // Wait for all duplicate checks
    const duplicateResults = await Promise.all(duplicateChecks);
    
    // Check for any duplicates
    for (const result of duplicateResults) {
      if (result.branch) {
        const fieldName = result.type === 'location' ? 'location' : 'contact number';
        return res.status(409).json({
          status: 'error',
          message: `A branch with this ${fieldName} already exists`,
          field: result.type,
          code: `DUPLICATE_BRANCH_${result.type.toUpperCase()}`
        });
      }
    }

    // If all validations pass, attach validated data to request
    req.body = validatedData;
    req.existingBranch = existingBranch; // For use in controller
    next();
    
  } catch (error) {
    console.error('Branch update validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error during branch update',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Simple validation middleware for basic requests
const validateBranchId = async (req, res, next) => {
  try {
    const branchId = req.params.id;
    
    if (!branchId) {
      return res.status(400).json({
        status: 'error',
        message: 'Branch ID is required',
        code: 'MISSING_BRANCH_ID'
      });
    }

    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found',
        code: 'BRANCH_NOT_FOUND'
      });
    }

    req.branch = branch; // Attach branch to request for use in controller
    next();
    
  } catch (error) {
    console.error('Branch ID validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal error during branch validation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

module.exports = {
  validateRequest,
  validateBranchRegistration,
  validateBranchUpdate,
  validateBranchId,
  // Export specific validation middlewares for different operations
  validateBranchCreate: validateBranchRegistration,
  validateBranchEdit: validateBranchUpdate,
};
