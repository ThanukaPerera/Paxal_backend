# Admin Validation with Zod

This project now uses Zod for robust admin registration and update validations. This documentation explains how to use and extend the validation system.

## Installation

First, ensure Zod is installed:

```bash
npm install zod
```

## Validation Schemas

### Available Schemas

All validation schemas are located in `/validations/adminValidation.js`:

1. **`adminRegistrationSchema`** - For new admin registration
2. **`adminUpdateSchema`** - For updating existing admin data
3. **`passwordSchema`** - For password changes
4. **`adminIdSchema`** - For validating admin ID parameters
5. **`emailCheckSchema`** - For email uniqueness validation
6. **`nicCheckSchema`** - For NIC uniqueness validation
7. **`adminSearchSchema`** - For search and pagination validation

### Schema Details

#### Admin Registration Schema
```javascript
// Required fields: name, email, contactNo, nic
{
  name: "John Doe",           // 2-50 chars, letters and spaces only
  email: "john@example.com",  // Valid email format, lowercase
  contactNo: "0771234567",    // 10-15 digits, allows +, -, spaces, ()
  nic: "123456789V"          // NIC format validation, auto-uppercase
}
```

#### Admin Update Schema
```javascript
// All fields optional, but at least one must be provided
{
  name: "Updated Name",       // Optional
  email: "new@example.com",   // Optional
  contactNo: "0777654321",    // Optional
  nic: "987654321V",         // Optional
  profilePicLink: "image.jpg" // Optional, URL or image file format
}
```

## Usage Examples

### 1. Controller Usage (Manual Validation)

```javascript
const { adminRegistrationSchema } = require("../validations/adminValidation");
const { safeValidate } = require("../middleware/validationMiddleware");

const registerAdmin = async (req, res) => {
  // Validate request data
  const validationResult = safeValidate(adminRegistrationSchema, req.body);
  
  if (!validationResult.success) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: validationResult.errors
    });
  }
  
  const validatedData = validationResult.data;
  // Use validatedData instead of req.body
};
```

### 2. Middleware Usage (Route-Level Validation)

```javascript
const { validateAdminRegistration } = require("../middleware/adminValidationMiddleware");

// Apply validation middleware before controller
router.post("/admin/register", 
  authenticateAdmin, 
  validateAdminRegistration,  // This validates req.body
  registerAdmin
);
```

### 3. Multiple Validation Sources

```javascript
const { validateMultiple } = require("../middleware/validationMiddleware");

router.put("/admin/:adminId",
  validateMultiple({
    params: adminIdSchema,
    body: adminUpdateSchema
  }),
  updateAdminController
);
```

## Validation Features

### 1. Data Transformation
- Email addresses are automatically converted to lowercase
- NIC values are converted to uppercase
- Strings are trimmed of whitespace
- Numeric strings are converted to numbers where appropriate

### 2. Comprehensive Validation
- **Name**: 2-50 characters, letters and spaces only
- **Email**: Valid email format with length limits
- **Contact Number**: 10-15 digits with flexible formatting
- **NIC**: Sri Lankan NIC format (old: 9 digits + V/X, new: 12 digits)
- **Admin ID**: ADMIN followed by 3 digits (e.g., ADMIN001)

### 3. Error Handling
```javascript
// Error response format
{
  "status": "error",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string",
      "value": "invalid-email"
    }
  ]
}
```

## Extending Validations

### Adding New Fields

1. **Update the base schema** in `/validations/adminValidation.js`:

```javascript
const baseAdminSchema = {
  // existing fields...
  newField: z
    .string()
    .min(1, "New field is required")
    .max(100, "New field too long"),
};
```

2. **Update the registration schema**:

```javascript
const adminRegistrationSchema = z.object({
  ...baseAdminSchema,
  newField: baseAdminSchema.newField, // Make it required
});
```

3. **Update the update schema**:

```javascript
const adminUpdateSchema = z.object({
  // existing fields...
  newField: baseAdminSchema.newField.optional(),
});
```

### Creating Custom Validation Middleware

```javascript
const { validateRequest } = require("../middleware/validationMiddleware");
const { z } = require("zod");

const customSchema = z.object({
  customField: z.string().min(1)
});

const validateCustom = validateRequest(customSchema, 'body');

module.exports = { validateCustom };
```

## Migration Guide

### From Express-Validator to Zod

**Old way:**
```javascript
const { body, validationResult } = require('express-validator');

const validateAdmin = [
  body('email').isEmail(),
  body('name').isLength({ min: 2 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

**New way:**
```javascript
const { validateAdminRegistration } = require("../middleware/adminValidationMiddleware");

// Just use the middleware
router.post("/register", validateAdminRegistration, registerController);
```

## Testing

### Valid Request Examples

**Admin Registration:**
```javascript
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "contactNo": "0771234567",
  "nic": "123456789V"
}
```

**Admin Update:**
```javascript
{
  "name": "Updated John Doe",
  "contactNo": "0777654321"
}
```

### Invalid Request Examples

**Missing required fields:**
```javascript
{
  "name": "John Doe"
  // Missing email, contactNo, nic
}
```

**Invalid email:**
```javascript
{
  "name": "John Doe",
  "email": "invalid-email",
  "contactNo": "0771234567",
  "nic": "123456789V"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | General validation failure |
| `DUPLICATE_EMAIL` | Email already exists |
| `DUPLICATE_NIC` | NIC already exists |
| `INVALID_ADMIN_ID` | Admin ID format invalid |
| `ADMIN_NOT_FOUND` | Admin doesn't exist |

## Best Practices

1. **Always use validated data**: Use the data returned by validation, not the original request body
2. **Handle uniqueness checks**: Check for existing records after validation
3. **Use appropriate middleware**: Apply validation at the route level for cleaner code
4. **Provide clear error messages**: The schemas include descriptive error messages
5. **Log validation errors**: Include validation context in error logs for debugging

## Performance Considerations

- Validation is performed synchronously and is very fast
- Uniqueness checks require database queries - consider caching for high-traffic endpoints
- Use `safeValidate` for non-throwing validation in controllers
- Use middleware for route-level validation to keep controllers clean

## Security Benefits

1. **Input sanitization**: Automatic trimming and case conversion
2. **Type safety**: Ensures data types match expectations
3. **Length limits**: Prevents excessively long inputs
4. **Format validation**: Regex-based validation for structured data (email, NIC, phone)
5. **Injection prevention**: Structured validation helps prevent injection attacks
