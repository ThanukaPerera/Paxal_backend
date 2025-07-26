const axios = require('axios');

const testCustomerUpdate = async () => {
  try {
    // Test data
    const testData = {
      fName: 'John',
      lName: 'Doe',
      email: 'john.doe@example.com',
      contact: '0771234567',
      nic: '200123456789',
      address: '123 Main Street',
      city: 'Colombo',
      district: 'Colombo',
      province: 'Western'
    };

    // Make API call (this will fail without proper authentication, but we can test validation)
    const response = await axios.put(
      'http://localhost:8000/api/admin/users/customer/507f1f77bcf86cd799439011', // dummy ID
      testData,
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error response:', error.response?.data || error.message);
  }
};

// Run test
testCustomerUpdate();
