const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function fixParcelDates() {
    try {
        console.log('Fixing parcel dates...');
        
        // Get today's date at midnight for consistent filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Update TEST001 to have arrived today
        await Parcel.updateOne(
            { parcelId: 'TEST001' },
            { 
                $set: { 
                    parcelArrivedDate: today,
                    status: 'ArrivedAtCollectionCenter'
                }
            }
        );
        
        // Update TEST002 to have been delivered today
        await Parcel.updateOne(
            { parcelId: 'TEST002' },
            { 
                $set: { 
                    parcelDeliveredDate: today,
                    status: 'Delivered'
                }
            }
        );
        
        // Update TEST003 to have been dispatched today
        await Parcel.updateOne(
            { parcelId: 'TEST003' },
            { 
                $set: { 
                    parcelDispatchedDate: today,
                    status: 'DeliveryDispatched'
                }
            }
        );
        
        console.log('✅ Parcel dates updated successfully!');
        
        // Verify the updates
        const parcels = await Parcel.find().select('parcelId status parcelArrivedDate parcelDeliveredDate parcelDispatchedDate');
        
        console.log('\nUpdated parcel data:');
        parcels.forEach(p => {
            console.log(`${p.parcelId}: ${p.status}`);
            console.log(`  Arrived: ${p.parcelArrivedDate}`);
            console.log(`  Delivered: ${p.parcelDeliveredDate}`);
            console.log(`  Dispatched: ${p.parcelDispatchedDate}`);
            console.log('---');
        });
        
        mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.connection.close();
    }
}

fixParcelDates();
