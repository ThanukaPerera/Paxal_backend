const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testDashboardQuery() {
    try {
        const center = '682e1059ce33c2a891c9b168';
        const date = new Date('2025-07-18');
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        console.log('Testing dashboard query for center:', center);
        console.log('Date range:', date, 'to', nextDay);

        // Test arrived parcels
        const arrivedCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "ArrivedAtCollectionCenter",
            parcelArrivedDate: {
                $gte: date,
                $lt: nextDay
            }
        });

        console.log('Arrived parcels count:', arrivedCount);

        // Test delivered parcels
        const deliveredCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: date,
                $lt: nextDay
            }
        });

        console.log('Delivered parcels count:', deliveredCount);

        // Test total parcels
        const totalParcels = await Parcel.find({
            $and: [
                { $or: [{ from: center }, { to: center }] },
                {
                    $or: [
                        {
                            status: "ArrivedAtCollectionCenter",
                            parcelArrivedDate: {
                                $gte: date,
                                $lt: nextDay
                            }
                        },
                        {
                            status: "Delivered",
                            parcelDeliveredDate: {
                                $gte: date,
                                $lt: nextDay
                            }
                        }
                    ]
                }
            ]
        });

        console.log('Total parcels found:', totalParcels.length);
        
        // Test driver stats
        const dispatchedParcels = await Parcel.find({
            $or: [{ from: center }, { to: center }],
            parcelDispatchedDate: {
                $gte: date,
                $lt: nextDay
            },
            status: "DeliveryDispatched"
        }).populate('deliveryInformation.staffId', 'staffId name');

        console.log('Dispatched parcels found:', dispatchedParcels.length);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

testDashboardQuery();
