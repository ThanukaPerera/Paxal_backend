const mongoose = require('mongoose');
const Parcel = require('./models/parcelModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/parcel-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestParcels() {
    try {
        console.log('Creating test parcels...');
        
        const center = '682e1059ce33c2a891c9b168';
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        // Create test parcels with different statuses and dates
        const testParcels = [
            {
                parcelId: 'TEST001',
                trackingNo: 'TRK001',
                qrCodeNo: 'QR001',
                itemType: 'Electronics',
                itemSize: 'medium',
                specialInstructions: 'Handle with care',
                submittingType: 'drop-off',
                receivingType: 'doorstep',
                shippingMethod: 'standard',
                senderId: new mongoose.Types.ObjectId(),
                receiverId: new mongoose.Types.ObjectId(),
                paymentId: new mongoose.Types.ObjectId(),
                orderPlacedStaffId: new mongoose.Types.ObjectId(),
                arrivedToCollectionCenterTime: today,
                parcelArrivedDate: today,
                status: 'ArrivedAtCollectionCenter',
                from: center,
                to: new mongoose.Types.ObjectId(),
                pickupInformation: {
                    pickupDate: today,
                    pickupTime: '08:00 - 12:00',
                    address: 'Test Address 1',
                    city: 'Test City',
                    district: 'Test District',
                    province: 'Test Province',
                    staffId: new mongoose.Types.ObjectId()
                },
                deliveryInformation: {
                    deliveryAddress: 'Test Delivery Address 1',
                    deliveryCity: 'Test Delivery City',
                    deliveryDistrict: 'Test Delivery District',
                    deliveryProvince: 'Test Delivery Province',
                    postalCode: '12345',
                    staffId: new mongoose.Types.ObjectId()
                }
            },
            {
                parcelId: 'TEST002',
                trackingNo: 'TRK002',
                qrCodeNo: 'QR002',
                itemType: 'Document',
                itemSize: 'small',
                specialInstructions: 'Urgent delivery',
                submittingType: 'pickup',
                receivingType: 'doorstep',
                shippingMethod: 'express',
                senderId: new mongoose.Types.ObjectId(),
                receiverId: new mongoose.Types.ObjectId(),
                paymentId: new mongoose.Types.ObjectId(),
                orderPlacedStaffId: new mongoose.Types.ObjectId(),
                arrivedToCollectionCenterTime: today,
                parcelDeliveredDate: today,
                status: 'Delivered',
                from: new mongoose.Types.ObjectId(),
                to: center,
                pickupInformation: {
                    pickupDate: today,
                    pickupTime: '13:00 - 17:00',
                    address: 'Test Address 2',
                    city: 'Test City',
                    district: 'Test District',
                    province: 'Test Province',
                    staffId: new mongoose.Types.ObjectId()
                },
                deliveryInformation: {
                    deliveryAddress: 'Test Delivery Address 2',
                    deliveryCity: 'Test Delivery City',
                    deliveryDistrict: 'Test Delivery District',
                    deliveryProvince: 'Test Delivery Province',
                    postalCode: '54321',
                    staffId: new mongoose.Types.ObjectId()
                }
            },
            {
                parcelId: 'TEST003',
                trackingNo: 'TRK003',
                qrCodeNo: 'QR003',
                itemType: 'Clothing',
                itemSize: 'large',
                specialInstructions: 'Fragile',
                submittingType: 'branch',
                receivingType: 'collection_center',
                shippingMethod: 'standard',
                senderId: new mongoose.Types.ObjectId(),
                receiverId: new mongoose.Types.ObjectId(),
                paymentId: new mongoose.Types.ObjectId(),
                orderPlacedStaffId: new mongoose.Types.ObjectId(),
                arrivedToCollectionCenterTime: yesterday,
                parcelDispatchedDate: today,
                status: 'DeliveryDispatched',
                from: center,
                to: new mongoose.Types.ObjectId(),
                pickupInformation: {
                    pickupDate: yesterday,
                    pickupTime: '08:00 - 12:00',
                    address: 'Test Address 3',
                    city: 'Test City',
                    district: 'Test District',
                    province: 'Test Province',
                    staffId: new mongoose.Types.ObjectId()
                },
                deliveryInformation: {
                    deliveryAddress: 'Test Delivery Address 3',
                    deliveryCity: 'Test Delivery City',
                    deliveryDistrict: 'Test Delivery District',
                    deliveryProvince: 'Test Delivery Province',
                    postalCode: '67890',
                    staffId: new mongoose.Types.ObjectId()
                }
            }
        ];

        // Insert test parcels
        await Parcel.insertMany(testParcels);
        console.log('✅ Test parcels created successfully!');
        
        // Verify creation
        const count = await Parcel.countDocuments();
        console.log(`Total parcels in database: ${count}`);
        
        // Test the queries
        console.log('\n--- Testing Dashboard Queries ---');
        
        const arrivedCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "ArrivedAtCollectionCenter",
            parcelArrivedDate: {
                $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
        });
        console.log(`Arrived parcels today: ${arrivedCount}`);
        
        const deliveredCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
        });
        console.log(`Delivered parcels today: ${deliveredCount}`);
        
        const dispatchedCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "DeliveryDispatched",
            parcelDispatchedDate: {
                $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
        });
        console.log(`Dispatched parcels today: ${dispatchedCount}`);
        
        mongoose.connection.close();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error creating test parcels:', error);
        mongoose.connection.close();
    }
}

createTestParcels();
