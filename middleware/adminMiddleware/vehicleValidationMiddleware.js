// Vehicle Validation Middleware
const { ZodError } = require('zod');
const { 
  vehicleRegistrationSchema, 
  vehicleUpdateSchema 
} = require('../../validations/adminValidation');
const Vehicle = require('../../models/VehicleModel');
const Branch = require('../../models/BranchesModel');

// Helper function to format validation errors for user-friendly messages
const formatValidationErrors = (errors) => {
  const userFriendlyMessages = {
    'registrationNo': {
      'too_small': 'Registration number is too short. Please enter at least 3 characters.',
      'too_big': 'Registration number is too long. Please keep it under 20 characters.',
      'custom': 'Invalid registration number format. Please use Sri Lankan format (e.g., CAR-1234, AB-1234).',
      'invalid_string': 'Registration number must be text.',
      'required_error': 'Registration number is required.'
    },
    'vehicleType': {
      'invalid_enum_value': 'Please select a valid vehicle type: either "Shipment" or "Pickup & Delivery".',
      'invalid_literal': 'Please select a valid vehicle type: either "Shipment" or "Pickup & Delivery".',
      'invalid_type': 'Please select a vehicle type.',
      'invalid_value': 'Please select a valid vehicle type: either "Shipment" or "Pickup & Delivery".',
      'required_error': 'Vehicle type is required.'
    },
    'assignedBranch': {
      'too_small': 'Please select a branch for this vehicle.',
      'custom': 'Invalid branch ID format. Please select a valid branch.',
      'invalid_string': 'Please select a valid branch.',
      'required_error': 'Assigned branch is required.'
    },
    'currentBranch': {
      'custom': 'Invalid current branch ID format. Please select a valid branch.',
      'invalid_string': 'Please select a valid branch.',
    },
    'capableVolume': {
      'too_small': 'Volume capacity must be greater than 0.',
      'too_big': 'Volume capacity cannot exceed 10,000 cubic units.',
      'invalid_type': 'Volume capacity must be a valid number.',
      'required_error': 'Volume capacity is required.'
    },
    'capableWeight': {
      'too_small': 'Weight capacity must be greater than 0.',
      'too_big': 'Weight capacity cannot exceed 50,000 kg.',
      'invalid_type': 'Weight capacity must be a valid number.',
      'required_error': 'Weight capacity is required.'
    },
    'available': {
      'invalid_type': 'Availability status must be true or false.',
    }
  };

  return errors.map(err => {
    const field = err.path ? err.path.join('.') : 'unknown';
    const fieldMessages = userFriendlyMessages[field];
    let userMessage = err.message || 'Invalid input';

    // Get user-friendly message if available
    if (fieldMessages) {
      if (fieldMessages[err.code]) {
        userMessage = fieldMessages[err.code];
      } else if (fieldMessages['custom']) {
        userMessage = fieldMessages['custom'];
      }
    }

    // Add field name to make it clearer
    const fieldDisplayName = {
      'registrationNo': 'Registration Number',
      'vehicleType': 'Vehicle Type',
      'assignedBranch': 'Assigned Branch',
      'currentBranch': 'Current Branch',
      'capableVolume': 'Volume Capacity',
      'capableWeight': 'Weight Capacity',
      'available': 'Availability Status'
    }[field] || field;

    return {
      field: field,
      fieldName: fieldDisplayName,
      message: userMessage,
      code: err.code || 'VALIDATION_ERROR',
      value: err.received || null
    };
  });
};

// Generic validation middleware factory
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        // Safely handle the error structure
        const errors = result.error?.issues || result.error?.errors || [];
        const formattedErrors = formatValidationErrors(errors);
        
        // Create a summary message for the main error
        const mainErrors = formattedErrors.slice(0, 2); // Show first 2 errors
        const errorSummary = mainErrors.map(err => `${err.fieldName}: ${err.message}`).join('; ');
        const additionalErrorsCount = formattedErrors.length - 2;
        const summaryMessage = additionalErrorsCount > 0 
          ? `${errorSummary}... and ${additionalErrorsCount} more error${additionalErrorsCount > 1 ? 's' : ''}`
          : errorSummary;
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          summary: summaryMessage,
          errors: formattedErrors,
          details: errors,
          toast: {
            title: 'Validation Error',
            message: formattedErrors.length === 1 
              ? formattedErrors[0].message 
              : `Please fix ${formattedErrors.length} validation error${formattedErrors.length > 1 ? 's' : ''}`,
            type: 'error'
          }
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error',
        toast: {
          title: 'System Error',
          message: 'An internal error occurred during validation. Please try again.',
          type: 'error'
        }
      });
    }
  };
};

// Vehicle registration validation middleware
const validateVehicleRegistration = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = vehicleRegistrationSchema.safeParse(req.body);
    
    if (!result.success) {
      // Safely handle the error structure
      const errors = result.error?.issues || result.error?.errors || [];
      
      // Log the actual validation errors for debugging
      console.log('Vehicle registration validation errors:', {
        requestBody: req.body,
        errors: errors.map(err => ({
          field: err.path?.join('.') || 'unknown',
          code: err.code,
          message: err.message,
          received: err.received
        }))
      });
      
      const formattedErrors = formatValidationErrors(errors);
      
      // Create a summary message for the main error
      const mainErrors = formattedErrors.slice(0, 3); // Show first 3 errors
      const errorSummary = mainErrors.map(err => `${err.fieldName}: ${err.message}`).join('; ');
      const additionalErrorsCount = formattedErrors.length - 3;
      const summaryMessage = additionalErrorsCount > 0 
        ? `${errorSummary}... and ${additionalErrorsCount} more error${additionalErrorsCount > 1 ? 's' : ''}`
        : errorSummary;
      
      return res.status(400).json({
        status: 'error',
        message: 'Vehicle registration validation failed',
        summary: summaryMessage,
        errors: formattedErrors,
        details: errors,
        code: 'VALIDATION_ERROR',
        toast: {
          title: 'Vehicle Registration Failed',
          message: formattedErrors.length === 1 
            ? formattedErrors[0].message 
            : `Please fix ${formattedErrors.length} validation error${formattedErrors.length > 1 ? 's' : ''}: ${formattedErrors[0].message}`,
          type: 'error'
        }
      });
    }

    const validatedData = result.data;

    // Perform duplicate checks and branch validation in parallel
    const [
      existingVehicleByRegNo,
      assignedBranch,
      currentBranch
    ] = await Promise.all([
      Vehicle.findOne({ registrationNo: validatedData.registrationNo }),
      Branch.findById(validatedData.assignedBranch),
      validatedData.currentBranch ? Branch.findById(validatedData.currentBranch) : null
    ]);

    // Check for duplicates and return specific error messages
    if (existingVehicleByRegNo) {
      return res.status(409).json({
        status: 'error',
        message: `A vehicle with registration number "${validatedData.registrationNo}" already exists`,
        field: 'registrationNo',
        code: 'DUPLICATE_VEHICLE_REGISTRATION',
        toast: {
          title: 'Registration Number Already Exists',
          message: `The registration number "${validatedData.registrationNo}" is already registered. Please use a different registration number.`,
          type: 'error'
        },
        suggestions: [
          'Check if this vehicle is already registered in the system',
          'Use a different registration number',
          'Contact admin if you believe this is an error'
        ]
      });
    }

    // Validate assigned branch exists
    if (!assignedBranch) {
      return res.status(404).json({
        status: 'error',
        message: 'The selected branch does not exist in the system',
        field: 'assignedBranch',
        code: 'ASSIGNED_BRANCH_NOT_FOUND',
        toast: {
          title: 'Branch Not Found',
          message: 'The selected branch does not exist. Please select a valid branch from the dropdown.',
          type: 'error'
        },
        suggestions: [
          'Refresh the page to get updated branch list',
          'Select a different branch from the dropdown',
          'Contact admin if the branch should be available'
        ]
      });
    }

    // Validate current branch exists (if provided)
    if (validatedData.currentBranch && !currentBranch) {
      return res.status(404).json({
        status: 'error',
        message: 'The selected current branch does not exist in the system',
        field: 'currentBranch',
        code: 'CURRENT_BRANCH_NOT_FOUND',
        toast: {
          title: 'Current Branch Not Found',
          message: 'The selected current branch does not exist. Please select a valid branch from the dropdown.',
          type: 'error'
        },
        suggestions: [
          'Refresh the page to get updated branch list',
          'Select a different current branch from the dropdown',
          'Leave current branch empty to use the assigned branch'
        ]
      });
    }

    // If current branch not provided, set it to assigned branch
    if (!validatedData.currentBranch) {
      validatedData.currentBranch = validatedData.assignedBranch;
    }

    // If all validations pass, attach validated data to request
    req.body = validatedData;
    req.assignedBranch = assignedBranch;
    req.currentBranch = currentBranch || assignedBranch;
    next();
    
  } catch (error) {
    console.error('Vehicle registration validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error during vehicle registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Vehicle update validation middleware
const validateVehicleUpdate = async (req, res, next) => {
  try {
    // First validate the basic structure
    const result = vehicleUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      // Safely handle the error structure
      const errors = result.error?.issues || result.error?.errors || [];
      const formattedErrors = formatValidationErrors(errors);
      
      // Create a summary message for the main error
      const mainErrors = formattedErrors.slice(0, 3); // Show first 3 errors
      const errorSummary = mainErrors.map(err => `${err.fieldName}: ${err.message}`).join('; ');
      const additionalErrorsCount = formattedErrors.length - 3;
      const summaryMessage = additionalErrorsCount > 0 
        ? `${errorSummary}... and ${additionalErrorsCount} more error${additionalErrorsCount > 1 ? 's' : ''}`
        : errorSummary;
      
      return res.status(400).json({
        status: 'error',
        message: 'Vehicle update validation failed',
        summary: summaryMessage,
        errors: formattedErrors,
        details: errors,
        code: 'VALIDATION_ERROR',
        toast: {
          title: 'Vehicle Update Failed',
          message: formattedErrors.length === 1 
            ? formattedErrors[0].message 
            : `Please fix ${formattedErrors.length} validation error${formattedErrors.length > 1 ? 's' : ''}`,
          type: 'error'
        }
      });
    }

    const validatedData = result.data;
    const vehicleId = req.params.id;

    // Check if vehicle exists
    const existingVehicle = await Vehicle.findById(vehicleId);
    if (!existingVehicle) {
      return res.status(404).json({
        status: 'error',
        message: `Vehicle with ID "${vehicleId}" not found`,
        code: 'VEHICLE_NOT_FOUND',
        toast: {
          title: 'Vehicle Not Found',
          message: 'The vehicle you are trying to update does not exist. Please refresh the page and try again.',
          type: 'error'
        },
        suggestions: [
          'Refresh the vehicle list',
          'Check if the vehicle was deleted by another user',
          'Contact admin if you believe this is an error'
        ]
      });
    }

    // Check for duplicates and validate branches only if fields are being updated
    const validationChecks = [];
    
    if (validatedData.registrationNo && validatedData.registrationNo !== existingVehicle.registrationNo) {
      validationChecks.push(
        Vehicle.findOne({ 
          registrationNo: validatedData.registrationNo,
          _id: { $ne: vehicleId }
        }).then(vehicle => ({ type: 'registrationNo', vehicle }))
      );
    }
    
    if (validatedData.assignedBranch && validatedData.assignedBranch !== existingVehicle.assignedBranch?.toString()) {
      validationChecks.push(
        Branch.findById(validatedData.assignedBranch).then(branch => ({ type: 'assignedBranch', branch }))
      );
    }
    
    if (validatedData.currentBranch && validatedData.currentBranch !== existingVehicle.currentBranch?.toString()) {
      validationChecks.push(
        Branch.findById(validatedData.currentBranch).then(branch => ({ type: 'currentBranch', branch }))
      );
    }

    // Wait for all validation checks
    const validationResults = await Promise.all(validationChecks);
    
    // Check for any validation failures
    for (const result of validationResults) {
      if (result.type === 'registrationNo' && result.vehicle) {
        return res.status(409).json({
          status: 'error',
          message: `Registration number "${validatedData.registrationNo}" is already used by another vehicle`,
          field: 'registrationNo',
          code: 'DUPLICATE_VEHICLE_REGISTRATION',
          toast: {
            title: 'Registration Number Conflict',
            message: `The registration number "${validatedData.registrationNo}" is already used by another vehicle. Please use a different registration number.`,
            type: 'error'
          },
          suggestions: [
            'Check if this registration number is already in use',
            'Use a different registration number',
            'Contact admin if you believe this is an error'
          ]
        });
      }
      
      if (result.type === 'assignedBranch' && !result.branch) {
        return res.status(404).json({
          status: 'error',
          message: 'The selected assigned branch does not exist in the system',
          field: 'assignedBranch',
          code: 'ASSIGNED_BRANCH_NOT_FOUND',
          toast: {
            title: 'Branch Not Found',
            message: 'The selected branch does not exist. Please select a valid branch from the dropdown.',
            type: 'error'
          },
          suggestions: [
            'Refresh the page to get updated branch list',
            'Select a different branch from the dropdown',
            'Contact admin if the branch should be available'
          ]
        });
      }
      
      if (result.type === 'currentBranch' && !result.branch) {
        return res.status(404).json({
          status: 'error',
          message: 'The selected current branch does not exist in the system',
          field: 'currentBranch',
          code: 'CURRENT_BRANCH_NOT_FOUND',
          toast: {
            title: 'Current Branch Not Found',
            message: 'The selected current branch does not exist. Please select a valid branch from the dropdown.',
            type: 'error'
          },
          suggestions: [
            'Refresh the page to get updated branch list',
            'Select a different current branch from the dropdown',
            'Leave current branch empty to use the assigned branch'
          ]
        });
      }
    }

    // If all validations pass, attach validated data to request
    req.body = validatedData;
    req.existingVehicle = existingVehicle; // For use in controller
    next();
    
  } catch (error) {
    console.error('Vehicle update validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error during vehicle update',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Simple validation middleware for basic requests
const validateVehicleId = async (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    
    if (!vehicleId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vehicle ID is required in the request URL',
        code: 'MISSING_VEHICLE_ID',
        toast: {
          title: 'Invalid Request',
          message: 'Vehicle ID is missing from the request. Please try again.',
          type: 'error'
        }
      });
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(vehicleId)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid Vehicle ID format: "${vehicleId}"`,
        field: 'vehicleId',
        code: 'INVALID_VEHICLE_ID_FORMAT',
        toast: {
          title: 'Invalid Vehicle ID',
          message: 'The vehicle ID format is invalid. Please select a vehicle from the list.',
          type: 'error'
        },
        suggestions: [
          'Select a vehicle from the vehicle list',
          'Refresh the page and try again',
          'Contact admin if you believe this is an error'
        ]
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        status: 'error',
        message: `Vehicle with ID "${vehicleId}" not found`,
        code: 'VEHICLE_NOT_FOUND',
        toast: {
          title: 'Vehicle Not Found',
          message: 'The selected vehicle does not exist. It may have been deleted.',
          type: 'error'
        },
        suggestions: [
          'Refresh the vehicle list',
          'Check if the vehicle was deleted by another user',
          'Contact admin if you believe this is an error'
        ]
      });
    }

    req.vehicle = vehicle; // Attach vehicle to request for use in controller
    req.existingVehicle = vehicle; // Also attach as existingVehicle for consistency
    next();
    
  } catch (error) {
    console.error('Vehicle ID validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal error during vehicle validation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Vehicle availability validation middleware
const validateVehicleAvailability = async (req, res, next) => {
  try {
    const { available } = req.body;
    
    if (available === undefined || available === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Availability status is required',
        field: 'available',
        code: 'MISSING_AVAILABILITY_STATUS'
      });
    }

    if (typeof available !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Availability status must be a boolean value',
        field: 'available',
        code: 'INVALID_AVAILABILITY_STATUS'
      });
    }

    next();
  } catch (error) {
    console.error('Vehicle availability validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

// Vehicle type validation middleware
const validateVehicleType = (req, res, next) => {
  try {
    const { vehicleType } = req.body;
    
    if (!vehicleType) {
      return res.status(400).json({
        status: 'error',
        message: 'Vehicle type is required',
        field: 'vehicleType',
        code: 'MISSING_VEHICLE_TYPE'
      });
    }

    const validTypes = ['shipment', 'pickupDelivery'];
    if (!validTypes.includes(vehicleType)) {
      return res.status(400).json({
        status: 'error',
        message: `Vehicle type must be one of: ${validTypes.join(', ')}`,
        field: 'vehicleType',
        code: 'INVALID_VEHICLE_TYPE'
      });
    }

    next();
  } catch (error) {
    console.error('Vehicle type validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
    });
  }
};

module.exports = {
  validateRequest,
  validateVehicleRegistration,
  validateVehicleUpdate,
  validateVehicleId,
  validateVehicleAvailability,
  validateVehicleType,
  // Export specific validation middlewares for different operations
  validateVehicleCreate: validateVehicleRegistration,
  validateVehicleEdit: validateVehicleUpdate,
};
