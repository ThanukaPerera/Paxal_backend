const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testDashboardAPI() {
    try {
        console.log('Testing Dashboard API Logic...');
        
        const center = '682e1059ce33c2a891c9b168';
        const today = new Date();
        const nextDay = new Date();
        nextDay.setDate(today.getDate() + 1);
        
        console.log('Center:', center);
        console.log('Date range:', today.toISOString().split('T')[0], 'to', nextDay.toISOString().split('T')[0]);
        
        // Test the exact query from the API
        const arrived = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: 'ArrivedAtCollectionCenter',
            parcelArrivedDate: {
                $gte: today,
                $lt: nextDay
            }
        });
        
        const delivered = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: 'Delivered',
            parcelDeliveredDate: {
                $gte: today,
                $lt: nextDay
            }
        });
        
        console.log('\n--- API Test Results ---');
        console.log('Arrived parcels:', arrived);
        console.log('Delivered parcels:', delivered);
        console.log('Total parcels:', arrived + delivered);
        
        // Test driver stats
        const dispatched = await Parcel.find({
            $or: [{ from: center }, { to: center }],
            status: 'DeliveryDispatched',
            parcelDispatchedDate: {
                $gte: today,
                $lt: nextDay
            }
        });
        
        console.log('Dispatched parcels:', dispatched.length);
        
        // Test all parcels with center filter
        const allParcels = await Parcel.find({
            $or: [{ from: center }, { to: center }]
        });
        
        console.log('All parcels for center:', allParcels.length);
        
        mongoose.connection.close();
        console.log('✅ Test completed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.connection.close();
    }
}

testDashboardAPI();
