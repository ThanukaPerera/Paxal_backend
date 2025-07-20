const { z } = require("zod");

// Base admin validation schema with common fields
const baseAdminSchema = {
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must not exceed 50 characters")
    .transform(val => val.trim().replace(/\s+/g, ' ')) // Normalize spaces first
    .refine(name => {
      // Allow letters, spaces, and some common name characters
      const namePattern = /^[a-zA-Z\s\.\'-]+$/;
      return namePattern.test(name);
    }, "Name can only contain letters, spaces, periods, apostrophes, and hyphens")
    .refine(name => {
      // Ensure it's not just spaces
      return name.length >= 2;
    }, "Name must contain at least 2 non-space characters"),
  
  email: z
    .string()
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must not exceed 100 characters")
    .transform(val => val.toLowerCase().trim()) // Transform first
    .refine(email => {
      // More strict email validation - check for valid domain extensions (removed .co)
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const validDomainExtensions = /\.(com|org|net|edu|gov|co\.uk|ac\.uk|in|lk|io|dev|tech|info|biz)$/i;
      return strictEmailRegex.test(email) && validDomainExtensions.test(email);
    }, "Please enter a valid email address with a proper domain (e.g., .com, .org, .net)"),
  
  contactNo: z
    .string()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number must not exceed 15 digits")
    .transform(val => val.replace(/[\s\-\(\)]/g, '').trim()) // Clean and transform first
    .refine(contact => {
      // Sri Lankan mobile numbers: 07XXXXXXXX or +947XXXXXXXX
      const sriLankanMobile = /^(07[0-9]{8}|947[0-9]{8}|\+947[0-9]{8})$/;
      const generalMobile = /^[0-9]{10,15}$/;
      return sriLankanMobile.test(contact) || generalMobile.test(contact);
    }, "Invalid contact number format. Use Sri Lankan format (07XXXXXXXX) or international format"),
  
  nic: z
    .string()
    .transform(val => val.trim().toUpperCase()) // Transform first
    .refine(nic => {
      // Sri Lankan NIC validation with exact patterns
      const oldFormat = /^[0-9]{9}[VX]$/; // Exactly 9 digits + V or X (uppercase after transform)
      const newFormat = /^[0-9]{12}$/;    // Exactly 12 digits
      return oldFormat.test(nic) || newFormat.test(nic);
    }, "Invalid NIC format. Use old format (123456789V) or new format (200203601188)")
    .refine(nic => {
      return nic.length === 10 || nic.length === 12;
    }, "NIC must be exactly 10 characters (old format) or 12 characters (new format)")
    .refine(nic => {
      // Additional validation for Sri Lankan NIC logic
      if (nic.length === 12) {
        // New format NIC validation
        const year = parseInt(nic.substring(0, 4));
        const dayOfYear = parseInt(nic.substring(4, 7));
        
        // Basic year validation (should be realistic birth year)
        if (year < 1900 || year > new Date().getFullYear()) {
          return false;
        }
        
        // Day of year validation (1-366 for males, 501-866 for females)
        if ((dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866)) {
          return true;
        }
        return false;
      } else if (nic.length === 10) {
        // Old format NIC validation
        const dayOfYear = parseInt(nic.substring(2, 5));
        
        // Day of year validation for old format
        if ((dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866)) {
          return true;
        }
        return false;
      }
      return false;
    }, "Invalid NIC number - please check the format and validity"),
};

// Admin registration validation schema
const adminRegistrationSchema = z.object({
  ...baseAdminSchema,
  // NIC is required for registration
  nic: baseAdminSchema.nic,
  
  // Optional fields that might be sent from frontend but are not needed for admin registration
  userType: z.string().optional(),
  licenseId: z.string().optional(),
  branchId: z.string().optional(),
  vehicleId: z.string().optional(),
}).strict(); // Prevent additional fields

// Admin update validation schema (all fields optional except adminId)
const adminUpdateSchema = z.object({
  adminId: z
    .string()
    .regex(/^ADMIN\d{3}$/, "Invalid admin ID format")
    .optional(),
  
  name: baseAdminSchema.name.optional(),
  email: baseAdminSchema.email.optional(),
  contactNo: baseAdminSchema.contactNo.optional(),
  nic: baseAdminSchema.nic.optional(),
  
  // Profile picture is optional and can be updated
  profilePicLink: z
    .string()
    .url("Invalid profile picture URL")
    .or(z.string().regex(/\.(jpg|jpeg|png|gif|webp)$/i, "Invalid image file format"))
    .optional(),
    
}).strict().refine(
  (data) => {
    // At least one field should be provided for update
    const updateFields = ['name', 'email', 'contactNo', 'nic', 'profilePicLink'];
    return updateFields.some(field => data[field] !== undefined);
  },
  {
    message: "At least one field must be provided for update",
    path: ["update"]
  }
);

// Password validation schema (for password changes)
const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),
  
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  
  confirmPassword: z
    .string()
    .min(1, "Password confirmation is required"),
    
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Admin ID validation schema
const adminIdSchema = z.object({
  adminId: z
    .string()
    .regex(/^ADMIN\d{3}$/, "Invalid admin ID format (should be ADMIN followed by 3 digits)"),
});

// Email uniqueness check schema (for duplicate checks)
const emailCheckSchema = z.object({
  email: baseAdminSchema.email,
  excludeAdminId: z
    .string()
    .regex(/^ADMIN\d{3}$/, "Invalid admin ID format")
    .optional(),
});

// NIC uniqueness check schema
const nicCheckSchema = z.object({
  nic: baseAdminSchema.nic,
  excludeAdminId: z
    .string()
    .regex(/^ADMIN\d{3}$/, "Invalid admin ID format")
    .optional(),
});

// Admin search/filter schema
const adminSearchSchema = z.object({
  page: z.union([
    z.string().regex(/^\d+$/, "Page must be a positive number").transform(val => parseInt(val)),
    z.number()
  ])
    .refine(val => val > 0, "Page must be greater than 0")
    .optional()
    .default(1),
  
  limit: z.union([
    z.string().regex(/^\d+$/, "Limit must be a positive number").transform(val => parseInt(val)),
    z.number()
  ])
    .refine(val => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default(10),
  
  search: z
    .string()
    .min(1, "Search term must be at least 1 character")
    .max(50, "Search term must not exceed 50 characters")
    .trim()
    .optional(),
  
  sortBy: z
    .enum(['name', 'email', 'adminId', 'createdAt'])
    .optional()
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
}).passthrough(); // Allow additional fields to pass through

// Driver validation schemas
const baseDriverSchema = {
  name: z
    .string()
    .min(1, 'Driver name is required')
    .max(100, 'Name must not exceed 100 characters')
    .transform(val => val.trim())
    .refine(name => {
      // Allow letters, spaces, and some common name characters
      const namePattern = /^[a-zA-Z\s\.\'-]+$/;
      return namePattern.test(name);
    }, "Name can only contain letters, spaces, periods, apostrophes, and hyphens")
    .refine(name => {
      // Ensure it's not just spaces
      return name.length >= 2;
    }, "Name must contain at least 2 non-space characters"),
  
  email: z
    .string()
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must not exceed 100 characters")
    .transform(val => val.toLowerCase().trim()) // Transform first
    .refine(email => {
      // Basic email format validation
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return strictEmailRegex.test(email);
    }, "Invalid email format")
    .refine(email => {
      // More strict email validation - check for valid domain extensions (removed .co)
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const validDomainExtensions = /\.(com|org|net|edu|gov|co\.uk|ac\.uk|in|lk|io|dev|tech|info|biz)$/i;
      return strictEmailRegex.test(email) && validDomainExtensions.test(email);
    }, "Please enter a valid email address with a proper domain (e.g., .com, .org, .net)"),

  contactNo: z
    .string()
    .min(10, 'Contact number must be at least 10 digits')
    .max(15, 'Contact number must not exceed 15 characters')
    .transform(val => val.replace(/[\s\-()+=]/g, '')) // Remove spaces, dashes, brackets
    .refine(contact => {
      // Sri Lankan mobile number or international format
      const sriLankanMobile = /^(07[0-9]{8}|(\+94|0094)7[0-9]{8})$/;
      const generalMobile = /^[0-9]{10,15}$/;
      return sriLankanMobile.test(contact) || generalMobile.test(contact);
    }, "Invalid contact number format. Use Sri Lankan format (07XXXXXXXX) or international format"),

  nic: z
    .string()
    .transform(val => val.trim().toUpperCase()) // Transform first
    .refine(nic => {
      // Sri Lankan NIC validation with exact patterns
      const oldFormat = /^[0-9]{9}[VX]$/; // Exactly 9 digits + V or X (uppercase after transform)
      const newFormat = /^[0-9]{12}$/;    // Exactly 12 digits
      return oldFormat.test(nic) || newFormat.test(nic);
    }, "Invalid NIC format. Use old format (123456789V) or new format (200203601188)")
    .refine(nic => {
      return nic.length === 10 || nic.length === 12;
    }, "NIC must be exactly 10 characters (old format) or 12 characters (new format)")
    .refine(nic => {
      // Additional validation for Sri Lankan NIC logic
      if (nic.length === 12) {
        // New format NIC validation
        const year = parseInt(nic.substring(0, 4));
        const dayOfYear = parseInt(nic.substring(4, 7));
        
        // Basic year validation (should be realistic birth year)
        if (year < 1900 || year > new Date().getFullYear()) {
          return false;
        }
        
        // Day of year validation (1-366 for males, 501-866 for females)
        if ((dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866)) {
          return true;
        }
        return false;
      } else if (nic.length === 10) {
        // Old format NIC validation
        const dayOfYear = parseInt(nic.substring(2, 5));
        
        // Day of year validation for old format
        if ((dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866)) {
          return true;
        }
        return false;
      }
      return false;
    }, "Invalid NIC number - please check the format and validity"),

  licenseId: z
    .string()
    .min(1, 'License ID is required for drivers')
    .max(50, 'License ID must not exceed 50 characters')
    .transform(val => val.trim().toUpperCase())
    .refine(licenseId => {
      // Sri Lankan driving license format validation
      const licensePattern = /^[A-Z0-9\-\/]+$/;
      return licensePattern.test(licenseId);
    }, "Invalid license ID format. Please enter a valid driving license number"),

  branchId: z
    .string()
    .min(1, 'Branch assignment is required')
    .refine(branchId => {
      // Check if it's a valid MongoDB ObjectId format
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      return objectIdPattern.test(branchId);
    }, "Invalid branch ID format"),

  vehicleId: z
    .string()
    .min(1, 'Vehicle assignment is required')
    .refine(vehicleId => {
      // Check if it's a valid MongoDB ObjectId format
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      return objectIdPattern.test(vehicleId);
    }, "Invalid vehicle ID format"),
};

// Driver registration validation schema
const driverRegistrationSchema = z.object({
  ...baseDriverSchema,
  // All fields are required for driver registration
  name: baseDriverSchema.name,
  email: baseDriverSchema.email,
  contactNo: baseDriverSchema.contactNo,
  nic: baseDriverSchema.nic,
  licenseId: baseDriverSchema.licenseId,
  branchId: baseDriverSchema.branchId,
  vehicleId: baseDriverSchema.vehicleId,
  
  // Optional fields that might be sent from frontend but are not needed for driver registration
  userType: z.string().optional(),
  password: z.string().optional(), // Password is auto-generated
});

// Driver update validation schema (for editing drivers)
const driverUpdateSchema = z.object({
  name: baseDriverSchema.name.optional(),
  email: baseDriverSchema.email.optional(),
  contactNo: baseDriverSchema.contactNo.optional(),
  nic: baseDriverSchema.nic.optional(),
  licenseId: baseDriverSchema.licenseId.optional(),
  branchId: baseDriverSchema.branchId.optional(),
  vehicleId: baseDriverSchema.vehicleId.optional(),
}).refine(data => {
  // At least one field must be provided for update
  return Object.keys(data).length > 0;
}, "At least one field must be provided for update");

// Staff validation schemas
const baseStaffSchema = {
  name: z
    .string()
    .min(1, 'Staff name is required')
    .max(100, 'Name must not exceed 100 characters')
    .transform(val => val.trim())
    .refine(name => {
      // Allow letters, spaces, and some common name characters
      const namePattern = /^[a-zA-Z\s\.\'-]+$/;
      return namePattern.test(name);
    }, "Name can only contain letters, spaces, periods, apostrophes, and hyphens")
    .refine(name => {
      // Ensure it's not just spaces
      return name.length >= 2;
    }, "Name must contain at least 2 non-space characters"),
  
  email: z
    .string()
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must not exceed 100 characters")
    .transform(val => val.toLowerCase().trim()) // Transform first
    .refine(email => {
      // Basic email format validation
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return strictEmailRegex.test(email);
    }, "Invalid email format")
    .refine(email => {
      // More strict email validation - check for valid domain extensions (removed .co)
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const validDomainExtensions = /\.(com|org|net|edu|gov|co\.uk|ac\.uk|in|lk|io|dev|tech|info|biz)$/i;
      return strictEmailRegex.test(email) && validDomainExtensions.test(email);
    }, "Please enter a valid email address with a proper domain (e.g., .com, .org, .net)"),

  contactNo: z
    .string()
    .min(10, 'Contact number must be at least 10 digits')
    .max(15, 'Contact number must not exceed 15 characters')
    .transform(val => val.replace(/[\s\-()+=]/g, '')) // Remove spaces, dashes, brackets
    .refine(contact => {
      // Sri Lankan mobile number or international format
      const sriLankanMobile = /^(07[0-9]{8}|(\+94|0094)7[0-9]{8})$/;
      const generalMobile = /^[0-9]{10,15}$/;
      return sriLankanMobile.test(contact) || generalMobile.test(contact);
    }, "Invalid contact number format. Use Sri Lankan format (07XXXXXXXX) or international format"),

  nic: z
    .string()
    .transform(val => val.trim().toUpperCase()) // Transform first
    .refine(nic => {
      // Sri Lankan NIC validation with exact patterns
      const oldFormat = /^[0-9]{9}[VX]$/; // Exactly 9 digits + V or X (uppercase after transform)
      const newFormat = /^[0-9]{12}$/;    // Exactly 12 digits
      return oldFormat.test(nic) || newFormat.test(nic);
    }, "Invalid NIC format. Use old format (123456789V) or new format (200203601188)")
    .refine(nic => {
      return nic.length === 10 || nic.length === 12;
    }, "NIC must be exactly 10 characters (old format) or 12 characters (new format)")
    .refine(nic => {
      // Additional validation for Sri Lankan NIC logic
      if (nic.length === 12) {
        // New format NIC validation
        const year = parseInt(nic.substring(0, 4));
        const dayOfYear = parseInt(nic.substring(4, 7));
        
        // Basic year validation (should be realistic birth year)
        if (year < 1900 || year > new Date().getFullYear()) {
          return false;
        }
        
        // Day of year validation (1-366 for males, 501-866 for females)
        if ((dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866)) {
          return true;
        }
        return false;
      } else if (nic.length === 10) {
        // Old format NIC validation
        const dayOfYear = parseInt(nic.substring(2, 5));
        
        // Day of year validation for old format
        if ((dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866)) {
          return true;
        }
        return false;
      }
      return false;
    }, "Invalid NIC number - please check the format and validity"),

  staffId: z
    .string()
    .min(1, 'Staff ID is required')
    .max(20, 'Staff ID must not exceed 20 characters')
    .transform(val => val.trim().toUpperCase())
    .refine(staffId => {
      // Staff ID format validation (e.g., STF001, STAFF001, etc.)
      const staffIdPattern = /^(STF|STAFF)\d{3,6}$/;
      return staffIdPattern.test(staffId);
    }, "Invalid Staff ID format. Use format like STF001 or STAFF001"),

  status: z
    .enum(['active', 'inactive'], {
      errorMap: () => ({ message: "Status must be either 'active' or 'inactive'" })
    }),

  branchId: z
    .string()
    .min(1, 'Branch assignment is required')
    .refine(branchId => {
      // Check if it's a valid MongoDB ObjectId format
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      return objectIdPattern.test(branchId);
    }, "Invalid branch ID format"),

  adminId: z
    .string()
    .min(1, 'Admin assignment is required')
    .refine(adminId => {
      // Check if it's a valid MongoDB ObjectId format
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      return objectIdPattern.test(adminId);
    }, "Invalid admin ID format"),

  profilePicLink: z
    .string()
    .url("Invalid profile picture URL")
    .or(z.string().regex(/\.(jpg|jpeg|png|gif|webp)$/i, "Invalid image file format"))
    .optional(),
};

// Staff registration validation schema
const staffRegistrationSchema = z.object({
  ...baseStaffSchema,
  // All required fields for staff registration
  name: baseStaffSchema.name,
  email: baseStaffSchema.email,
  contactNo: baseStaffSchema.contactNo,
  nic: baseStaffSchema.nic,
  staffId: baseStaffSchema.staffId.optional(), // Optional since it's auto-generated
  status: baseStaffSchema.status.optional(), // Optional since it defaults to 'active'
  branchId: baseStaffSchema.branchId,
  adminId: baseStaffSchema.adminId.optional(), // Optional since it's set from authenticated admin
  profilePicLink: baseStaffSchema.profilePicLink,
  
  // Optional fields that might be sent from frontend but are not needed for staff registration
  userType: z.string().optional(),
  password: z.string().optional(), // Password is auto-generated
});

// Staff update validation schema (for editing staff)
const staffUpdateSchema = z.object({
  name: baseStaffSchema.name.optional(),
  email: baseStaffSchema.email.optional(),
  contactNo: baseStaffSchema.contactNo.optional(),
  nic: baseStaffSchema.nic.optional(),
  staffId: baseStaffSchema.staffId.optional(),
  status: baseStaffSchema.status.optional(),
  branchId: baseStaffSchema.branchId.optional(),
  adminId: baseStaffSchema.adminId.optional(),
  profilePicLink: baseStaffSchema.profilePicLink,
}).refine(data => {
  // At least one field must be provided for update
  return Object.keys(data).length > 0;
}, "At least one field must be provided for update");

module.exports = {
  adminRegistrationSchema,
  adminUpdateSchema,
  passwordSchema,
  adminIdSchema,
  emailCheckSchema,
  nicCheckSchema,
  adminSearchSchema,
  baseAdminSchema,
  driverRegistrationSchema,
  driverUpdateSchema,
  baseDriverSchema,
  staffRegistrationSchema,
  staffUpdateSchema,
  baseStaffSchema,
};
