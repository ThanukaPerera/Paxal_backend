// Test driver validation
const { 
  driverRegistrationSchema 
} = require('./validations/adminValidation');

console.log('Testing driver validation...\n');

const testCases = [
  {
    name: "Test: Valid driver data",
    data: {
      name: 'John Driver',
      email: 'john.driver@gmail.com',
      contactNo: '0719844634',
      nic: '200203601188',
      licenseId: 'B1234567',
      branchId: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      userType: 'driver'
    }
  },
  {
    name: "Test: Invalid email (.co domain)",
    data: {
      name: 'John Driver',
      email: 'john.driver@gmail.co',
      contactNo: '0719844634',
      nic: '200203601188',
      licenseId: 'B1234567',
      branchId: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      userType: 'driver'
    }
  },
  {
    name: "Test: Missing license ID",
    data: {
      name: 'John Driver',
      email: 'john.driver@gmail.com',
      contactNo: '0719844634',
      nic: '200203601188',
      licenseId: '',
      branchId: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      userType: 'driver'
    }
  },
  {
    name: "Test: Invalid vehicle ID",
    data: {
      name: 'John Driver',
      email: 'john.driver@gmail.com',
      contactNo: '0719844634',
      nic: '200203601188',
      licenseId: 'B1234567',
      branchId: '507f1f77bcf86cd799439011',
      vehicleId: 'invalid-vehicle-id',
      userType: 'driver'
    }
  },
  {
    name: "Test: Invalid contact number (9 digits)",
    data: {
      name: 'John Driver',
      email: 'john.driver@gmail.com',
      contactNo: '071984463',
      nic: '200203601188',
      licenseId: 'B1234567',
      branchId: '507f1f77bcf86cd799439011',
      vehicleId: '507f1f77bcf86cd799439012',
      userType: 'driver'
    }
  }
];

testCases.forEach(testCase => {
  console.log(`${testCase.name}:`);
  console.log('Data:', JSON.stringify(testCase.data, null, 2));
  
  const result = driverRegistrationSchema.safeParse(testCase.data);
  
  if (result.success) {
    console.log('✅ VALID - Validation passed');
    console.log('Transformed data:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ INVALID - Validation failed');
    if (result.error && result.error.errors) {
      console.log('  - Error:', JSON.stringify(result.error.errors, null, 2));
    } else {
      console.log('  - Error object:', result.error);
    }
  }
  
  console.log('--------------------------------------------------');
});

console.log('Driver validation testing completed.');
