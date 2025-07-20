// Test the admin validation with the problematic data
const { adminRegistrationSchema } = require("./validations/adminValidation");

const testData = [
  {
    name: "Test: Valid data",
    data: {
      name: 'Hansamali Awarjana',
      email: 'hansamali@gmail.com', // Fixed email
      contactNo: '0719844634',
      nic: '200203601188', // Fixed NIC (12 digits)
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  },
  {
    name: "Test: Original problematic email (.co domain)",
    data: {
      name: 'Hansamali Awarjana',
      email: 'awarjanahansamali@gmail.co', // The original failing case
      contactNo: '0719844634',
      nic: '200203601188',
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  },
  {
    name: "Test: Original problematic NIC",
    data: {
      name: 'Hansamali Awarjana',
      email: 'hansamali@gmail.com',
      contactNo: '0719844634',
      nic: '200203601189', // The original failing NIC
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  },
  {
    name: "Test: Clearly invalid NIC (day 400)",
    data: {
      name: 'Hansamali Awarjana',
      email: 'hansamali@gmail.com',
      contactNo: '0719844634',
      nic: '200240001189', // Day 400 is invalid
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  },
  {
    name: "Test: Invalid NIC (year 1800)",
    data: {
      name: 'Hansamali Awarjana',
      email: 'hansamali@gmail.com',
      contactNo: '0719844634',
      nic: '180003601189', // Year 1800 is too old
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  },
  {
    name: "Test: Invalid email (missing m in .com)",
    data: {
      name: 'Hansamali Awarjana',
      email: 'awarjanahansamali@gmail.c', // Invalid email - just .c
      contactNo: '0719844634',
      nic: '200203601188',
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  },
  {
    name: "Test: Invalid contact",
    data: {
      name: 'Hansamali Awarjana',
      email: 'hansamali@gmail.com',
      contactNo: '123456789', // Invalid contact (only 9 digits)
      nic: '200203601188',
      userType: 'admin',
      licenseId: '',
      branchId: '',
      vehicleId: ''
    }
  }
];

console.log("Testing admin validation...\n");

testData.forEach(({ name, data }) => {
  console.log(`\n${name}:`);
  console.log("Data:", JSON.stringify(data, null, 2));
  
  try {
    const result = adminRegistrationSchema.parse(data);
    console.log("✅ VALID - Validation passed");
    console.log("Transformed data:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("❌ INVALID - Validation failed");
    if (error.errors) {
      error.errors.forEach(err => {
        console.log(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.log("  - Error:", error.message);
    }
  }
  console.log("-".repeat(50));
});

console.log("\nValidation testing completed.");
