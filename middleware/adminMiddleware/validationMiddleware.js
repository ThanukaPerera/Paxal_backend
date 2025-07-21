const { ZodError } = require("zod");

/**
 * Middleware to validate request data using Zod schemas
 * @param {Object} schema - Zod schema object
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated and transformed data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input
        }));

        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: formattedErrors,
          details: {
            totalErrors: formattedErrors.length,
            source: source
          }
        });
      }
      
      // Handle unexpected errors
      console.error(`[${new Date().toISOString()}] Validation Middleware Error:`, {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
      
      return res.status(500).json({
        status: "error",
        message: "Internal validation error",
        code: "VALIDATION_MIDDLEWARE_ERROR",
      });
    }
  };
};

/**
 * Validate multiple sources (body, params, query) with different schemas
 * @param {Object} schemas - Object containing schemas for different sources
 * @returns {Function} Express middleware function
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    try {
      const errors = [];
      
      // Validate each source with its corresponding schema
      Object.entries(schemas).forEach(([source, schema]) => {
        try {
          const dataToValidate = req[source];
          const validatedData = schema.parse(dataToValidate);
          req[source] = validatedData;
        } catch (error) {
          if (error instanceof ZodError) {
            error.errors.forEach(err => {
              errors.push({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
                source: source,
                value: err.input
              });
            });
          }
        }
      });
      
      if (errors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: errors,
          details: {
            totalErrors: errors.length,
            sources: Object.keys(schemas)
          }
        });
      }
      
      next();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Multiple Validation Middleware Error:`, {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
      
      return res.status(500).json({
        status: "error",
        message: "Internal validation error",
        code: "VALIDATION_MIDDLEWARE_ERROR",
      });
    }
  };
};

/**
 * Safe validation helper that doesn't throw errors
 * @param {Object} schema - Zod schema
 * @param {any} data - Data to validate
 * @returns {Object} Validation result with success/error information
 */
const safeValidate = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
      errors: null
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: err.input
      }));
      
      return {
        success: false,
        data: null,
        errors: formattedErrors
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{
        field: 'unknown',
        message: 'Unexpected validation error',
        code: 'UNKNOWN_ERROR',
        value: data
      }]
    };
  }
};

/**
 * Validation helper for async operations
 * @param {Object} schema - Zod schema
 * @param {any} data - Data to validate
 * @returns {Promise<Object>} Promise that resolves to validation result
 */
const validateAsync = async (schema, data) => {
  return new Promise((resolve) => {
    try {
      const validatedData = schema.parse(data);
      resolve({
        success: true,
        data: validatedData,
        errors: null
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input
        }));
        
        resolve({
          success: false,
          data: null,
          errors: formattedErrors
        });
      } else {
        resolve({
          success: false,
          data: null,
          errors: [{
            field: 'unknown',
            message: 'Unexpected validation error',
            code: 'UNKNOWN_ERROR',
            value: data
          }]
        });
      }
    }
  });
};

module.exports = {
  validateRequest,
  validateMultiple,
  safeValidate,
  validateAsync,
};
