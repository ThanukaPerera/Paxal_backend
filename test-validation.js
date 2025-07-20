// Quick test to verify Zod validation is working
const { adminRegistrationSchema } = require("./validations/adminValidation");

// Test data from your request
const testData = {
  name: 'Kavindya Perera',
  nic: '633150141v',
  email: 'thanukalap@gmail.com',
  contactNo: '0719844634',
  userType: 'admin',
  licenseId: '',
  branchId: '',
  vehicleId: ''
};

console.log("Testing Zod validation...");

try {
  const result = adminRegistrationSchema.parse(testData);
  console.log("✅ Validation successful:", result);
} catch (error) {
  console.log("❌ Validation failed:", error.message);
  if (error.errors) {
    console.log("Error details:", error.errors);
  }
}

console.log("Test completed.");
