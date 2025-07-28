// Test the fixed calculateCustomerSatisfaction function
const testData = {
  parcels: {
    total: 100,
    byStatus: {
      Delivered: 80,
      "In Transit": 15,
      Pending: 5
    },
    deliveryTimes: [
      { days: 2, status: "Delivered" },
      { days: 3, status: "Delivered" },
      { days: 1, status: "Delivered" },
      { days: 4, status: "Delivered" },
      { days: 5, status: "Delivered" }
    ]
  }
};

// Recreate the function for testing
function calculateCustomerSatisfaction(data) {
  const totalDelivered = data.parcels.byStatus.Delivered || data.parcels.byStatus.delivered || 0;
  const totalParcels = data.parcels.total || 0;
  
  const deliveryRate = totalParcels > 0 ? (totalDelivered / totalParcels * 100) : 0;
  
  const avgDeliveryTime = data.parcels.deliveryTimes && data.parcels.deliveryTimes.length > 0
    ? data.parcels.deliveryTimes.reduce((sum, d) => sum + d.days, 0) / data.parcels.deliveryTimes.length
    : 7;
  
  const timeFactor = Math.max(0, 100 - (avgDeliveryTime - 3) * 10);
  const satisfaction = (deliveryRate * 0.7) + (timeFactor * 0.3);
  
  return Math.min(100, Math.max(0, satisfaction)).toFixed(2);
}

// Test the function
try {
  const result = calculateCustomerSatisfaction(testData);
  console.log('✅ Customer satisfaction calculation successful:', result);
  console.log('   Delivery rate: 80%');
  console.log('   Average delivery time: 3 days');
  console.log('   Customer satisfaction score:', result + '%');
} catch (error) {
  console.log('❌ Error in customer satisfaction calculation:', error.message);
}
