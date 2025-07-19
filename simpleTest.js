const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

mongoose.connect('mongodb://localhost:27017/parcel-management').then(async () => {
    const center = '682e1059ce33c2a891c9b168';
    
    const arrived = await Parcel.find({ 
        $or: [{ from: center }, { to: center }], 
        status: 'ArrivedAtCollectionCenter' 
    });
    console.log('Arrived parcels (no date filter):', arrived.length);
    
    const delivered = await Parcel.find({ 
        $or: [{ from: center }, { to: center }], 
        status: 'Delivered' 
    });
    console.log('Delivered parcels (no date filter):', delivered.length);
    
    const dispatched = await Parcel.find({ 
        $or: [{ from: center }, { to: center }], 
        status: 'DeliveryDispatched' 
    });
    console.log('Dispatched parcels (no date filter):', dispatched.length);
    
    mongoose.connection.close();
});
