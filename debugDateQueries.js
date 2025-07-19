const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function debugDateQueries() {
    try {
        console.log('Debugging date queries...');
        
        const center = '682e1059ce33c2a891c9b168';
        const today = new Date();
        const nextDay = new Date();
        nextDay.setDate(today.getDate() + 1);
        
        console.log('Center:', center);
        console.log('Today:', today);
        console.log('Next day:', nextDay);
        
        // First, let's see all parcels
        const allParcels = await Parcel.find({}).select('parcelId status from to parcelArrivedDate parcelDeliveredDate parcelDispatchedDate');
        console.log('\n=== All Parcels ===');
        allParcels.forEach(p => {
            console.log(`${p.parcelId}: ${p.status}`);
            console.log(`  From: ${p.from}`);
            console.log(`  To: ${p.to}`);
            console.log(`  Arrived: ${p.parcelArrivedDate}`);
            console.log(`  Delivered: ${p.parcelDeliveredDate}`);
            console.log(`  Dispatched: ${p.parcelDispatchedDate}`);
            console.log('---');
        });
        
        // Test center filter
        console.log('\n=== Testing Center Filter ===');
        const centerParcels = await Parcel.find({
            $or: [{ from: center }, { to: center }]
        }).select('parcelId status from to');
        
        console.log(`Parcels for center ${center}:`, centerParcels.length);
        centerParcels.forEach(p => {
            console.log(`${p.parcelId}: from=${p.from}, to=${p.to}`);
        });
        
        // Test arrived parcels query step by step
        console.log('\n=== Testing Arrived Parcels Query ===');
        const arrivedParcels = await Parcel.find({
            status: "ArrivedAtCollectionCenter"
        }).select('parcelId status parcelArrivedDate from to');
        
        console.log('Parcels with ArrivedAtCollectionCenter status:', arrivedParcels.length);
        arrivedParcels.forEach(p => {
            console.log(`${p.parcelId}: arrived=${p.parcelArrivedDate}, from=${p.from}, to=${p.to}`);
        });
        
        // Test the complete query
        console.log('\n=== Testing Complete Query ===');
        const result = await Parcel.find({
            $or: [{ from: center }, { to: center }],
            status: "ArrivedAtCollectionCenter",
            parcelArrivedDate: {
                $gte: today,
                $lt: nextDay
            }
        });
        
        console.log('Complete query result:', result.length);
        
        mongoose.connection.close();
        
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

debugDateQueries();
