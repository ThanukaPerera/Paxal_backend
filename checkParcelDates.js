const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkParcelDates() {
    try {
        const parcels = await Parcel.find().select('parcelId status parcelArrivedDate parcelDeliveredDate parcelDispatchedDate createdAt');
        
        console.log('Parcel data:');
        parcels.forEach(p => {
            console.log(`${p.parcelId}: ${p.status}`);
            console.log(`  Created: ${p.createdAt}`);
            console.log(`  Arrived: ${p.parcelArrivedDate}`);
            console.log(`  Delivered: ${p.parcelDeliveredDate}`);
            console.log(`  Dispatched: ${p.parcelDispatchedDate}`);
            console.log('---');
        });
        
        mongoose.connection.close();
        
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

checkParcelDates();
