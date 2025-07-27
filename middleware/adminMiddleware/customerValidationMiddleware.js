const { customerUpdateSchema } = require("../../validations/adminValidation");

const validateCustomerUpdate = async (req, res, next) => {
  try {
    // Validate the request body using Zod schema
    const validatedData = customerUpdateSchema.parse(req.body);
    
    // Replace the request body with validated and transformed data
    req.body = validatedData;
    
    next();
  } catch (error) {
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Internal validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  validateCustomerUpdate
};
