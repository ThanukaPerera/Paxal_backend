// Sample Data for Each Collection
// Customer
// json
// Copy
// {
//   "customerId": "CUST001",
//   "nic": "123456789V",
//   "fName": "John",
//   "lName": "Doe",
//   "fullName": "John Doe",
//   "contact": ["0712345678", "0723456789"],
//   "email": "john.doe@example.com",
//   "username": "johndoe",
//   "password": "hashedpassword123",
//   "profilePicLink": "https://example.com/profile.jpg",
//   "address": "123 Main St",
//   "landmark": "Near City Hall",
//   "type": "home",
//   "city": "Colombo",
//   "district": "Colombo",
//   "province": "Western",
//   "zone": "Zone 1"
// }
// Parcel
// json
// Copy
// {
//   "parcelId": "PARCEL001",
//   "trackingNo": "TRACK001",
//   "qrCodeNo": "QR001",
//   "itemType": "Document",
//   "itemSize": "small",
//   "specialInstructions": "Handle with care",
//   "submittingType": "pickup",
//   "receivingType": "doorstep",
//   "shippingMethod": "express",
//   "latestLocation": "Colombo",
//   "senderId": "CUST001",
//   "receiverId": "REC001",
//   "orderPlacedTime": "2023-10-01T10:00:00Z",
//   "orderPlacedStaffId": "STAFF001",
//   "shipmentId": "SHIP001",
//   "arrivedToCollectionCenterTime": "2023-10-01T12:00:00Z"
// }
// Shipping
// json
// Copy
// {
//   "shippingId": "SHIP001",
//   "parcelId": "PARCEL001",
//   "shippingMethod": "express",
//   "arrivedToDistributionCenterTime": "2023-10-01T14:00:00Z",
//   "arrivedToCollectionCenterTime": "2023-10-01T12:00:00Z"
// }
// Pickup
// json
// Copy
// {
//   "pickupId": "PICK001",
//   "parcelId": "PARCEL001",
//   "driverId": "DRIVER001",
//   "staffId": "STAFF001",
//   "pickupAddress": "123 Main St",
//   "pickedUpTime": "2023-10-01T11:00:00Z"
// }
// Deliver
// json
// Copy
// {
//   "deliverId": "DELIVER001",
//   "parcelId": "PARCEL001",
//   "driverId": "DRIVER001",
//   "staffId": "STAFF001",
//   "deliveryConfirmation": "Signature",
//   "deliveryAddress": "456 Elm St",
//   "deliveryRemarks": "Delivered successfully",
//   "deliveredTime": "2023-10-01T15:00:00Z",
//   "deliveryDispatchedTime": "2023-10-01T14:00:00Z"
// }
// Receiver
// json
// Copy
// {
//   "receiverId": "REC001",
//   "fullName": "Jane Doe",
//   "contact": ["0712345678"],
//   "email": "jane.doe@example.com",
//   "address": "456 Elm St",
//   "landmark": "Near Park",
//   "type": "home",
//   "city": "Colombo",
//   "district": "Colombo",
//   "province": "Western",
//   "zone": "Zone 2"
// }
// Staff
// json
// Copy
// {
//   "staffId": "STAFF001",
//   "name": "Alice Smith",
//   "nic": "987654321V",
//   "email": "alice.smith@example.com",
//   "profilePicLink": "https://example.com/alice.jpg",
//   "joinedDate": "2023-01-01T00:00:00Z",
//   "status": "active",
//   "branchId": "BRANCH001",
//   "adminId": "ADMIN001",
//   "password": "hashedpassword123"
// }
// B2BShipment
// json
// Copy
// {
//   "shipmentId": "SHIP001",
//   "shipmentType": "B2B",
//   "distributionBranchId": "BRANCH001",
//   "collectionBranchId": "BRANCH002",
//   "assignedStaffId": "STAFF001",
//   "driverId": "DRIVER001"
// }
// Payment
// json
// Copy
// {
//   "paymentId": "PAY001",
//   "parcelId": "PARCEL001",
//   "paymentMethod": "online",
//   "amount": 1000,
//   "paymentStatus": "paid",
//   "paymentDate": "2023-10-01T10:00:00Z",
//   "transactionId": "TRANS001"
// }
// Driver
// json
// Copy
// {
//   "driverId": "DRIVER001",
//   "name": "Bob Johnson",
//   "nic": "456789123V",
//   "email": "bob.johnson@example.com",
//   "password": "hashedpassword123",
//   "contact": ["0712345678"],
//   "licenceId": "LIC001",
//   "branchId": "BRANCH001"
// }
// Admin
// json
// Copy
// {
//   "adminId": "ADMIN001",
//   "name": "Admin User",
//   "nic": "321654987V",
//   "password": "hashedpassword123",
//   "profilePicLink": "https://example.com/admin.jpg",
//   "email": "admin@example.com",
//   "contactNo": ["0712345678"]
// }
// Inquiry
// json
// Copy
// {
//   "inquiryId": "INQ001",
//   "message": "Where is my parcel?",
//   "status": "not",
//   "parcelTrackingNo": "TRACK001",
//   "inquiryTime": "2023-10-01T10:00:00Z",
//   "customerId": "CUST001",
//   "reply": [],
//   "staffId": "STAFF001"
// }
// Branch
// json
// Copy
// {
//   "branchId": "BRANCH001",
//   "location": "Colombo",
//   "contact": ["0112345678"]
// }