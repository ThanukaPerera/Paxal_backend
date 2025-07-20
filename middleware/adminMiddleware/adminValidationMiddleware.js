const { validateRequest } = require("./validationMiddleware");
const { 
  adminRegistrationSchema, 
  adminUpdateSchema, 
  adminIdSchema,
  passwordSchema,
  adminSearchSchema 
} = require("../../validations/adminValidation");

// Middleware for admin registration validation
const validateAdminRegistration = validateRequest(adminRegistrationSchema, 'body');

// Middleware for admin update validation
const validateAdminUpdate = validateRequest(adminUpdateSchema, 'body');

// Middleware for admin ID parameter validation
const validateAdminId = validateRequest(adminIdSchema, 'params');

// Middleware for password change validation
const validatePasswordChange = validateRequest(passwordSchema, 'body');

// Middleware for admin search/filter validation
const validateAdminSearch = validateRequest(adminSearchSchema, 'query');

module.exports = {
  validateAdminRegistration,
  validateAdminUpdate,
  validateAdminId,
  validatePasswordChange,
  validateAdminSearch,
};
