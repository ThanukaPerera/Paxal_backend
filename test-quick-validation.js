// Quick test to check driver validation
const { driverRegistrationSchema } = require('./validations/adminValidation');

const testData = {
  name: 'Test Driver',
  email: 'test.driver@gmail.com',
  contactNo: '0719844634',
  nic: '200203601188',
  licenseId: 'B1234567',
  branchId: '507f1f77bcf86cd799439011',
  vehicleId: '507f1f77bcf86cd799439012',
  userType: 'driver'
};

console.log('Testing driver registration validation...');
const result = driverRegistrationSchema.safeParse(testData);

if (result.success) {
  console.log('✅ Validation passed');
  console.log('Validated data:', JSON.stringify(result.data, null, 2));
} else {
  console.log('❌ Validation failed');
  console.log('Errors:', JSON.stringify(result.error.errors, null, 2));
}

// Test with invalid data
console.log('\n--- Testing with invalid email ---');
const invalidData = { ...testData, email: 'invalid@gmail.co' };
const invalidResult = driverRegistrationSchema.safeParse(invalidData);

if (!invalidResult.success) {
  console.log('✅ Correctly rejected invalid email');
  if (invalidResult.error && invalidResult.error.errors && invalidResult.error.errors.length > 0) {
    console.log('Error:', invalidResult.error.errors[0].message);
  } else {
    console.log('Error details:', invalidResult.error);
  }
} else {
  console.log('❌ Should have rejected invalid email');
}
