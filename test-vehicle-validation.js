const { vehicleRegistrationSchema } = require('./validations/adminValidation');

// Test with invalid data
const testData = {
  registrationNo: 'AB', // Too short
  vehicleType: 'invalid', // Invalid enum
  capableVolume: -5, // Negative value
  assignedBranch: 'invalid-id' // Invalid ObjectId
};

console.log('Testing vehicle validation with invalid data...');
const result = vehicleRegistrationSchema.safeParse(testData);

if (!result.success) {
  const errors = result.error?.issues || [];
  console.log(`\nValidation errors found: ${errors.length}`);
  
  errors.forEach((err, i) => {
    console.log(`${i + 1}. Field: ${err.path.join('.')}`);
    console.log(`   Code: ${err.code}`);
    console.log(`   Message: ${err.message}`);
    console.log('');
  });
} else {
  console.log('Validation passed unexpectedly');
}
