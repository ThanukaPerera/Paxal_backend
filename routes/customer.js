const express = require("express");
const router = express.Router();
const {
  Customer,
  Parcel,
  Shipping,
  Pickup,
  Deliver,
  Receiver,
  Staff,
  B2BShipment,
  Payment,
  Driver,
  Admin,
  Inquiry,
  Branch,
} = require("../models/models");

router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find();

    res.status(200).json(customers);
  } catch (err) {
    return err;
  }
});

// Customer Routes
router.post("/customer/save", async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(20).send(newCustomer);
    return res.status(200).json({
      success: "Customer saved successfully",
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
});

// Parcel Routes
router.post("/parcel/save", async (req, res) => {
  try {
    const parcel = new Parcel(req.body);
    await parcel.save();
    res.status(201).send(parcel);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Shipping Routes
router.post("/shipping/save", async (req, res) => {
  try {
    const shipping = new Shipping(req.body);
    await shipping.save();
    res.status(201).send(shipping);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Pickup Routes
router.post("/pickup/save", async (req, res) => {
  try {
    const pickup = new Pickup(req.body);
    await pickup.save();
    res.status(201).send(pickup);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Deliver Routes
router.post("/deliver/save", async (req, res) => {
  try {
    const deliver = new Deliver(req.body);
    await deliver.save();
    res.status(201).send(deliver);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Receiver Routes
router.post("/receiver/save", async (req, res) => {
  try {
    const receiver = new Receiver(req.body);
    await receiver.save();
    res.status(201).send(receiver);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Staff Routes
router.post("/staff/save", async (req, res) => {
  try {
    const staff = new Staff(req.body);
    await staff.save();
    res.status(201).send(staff);
  } catch (error) {
    res.status(400).send(error);
  }
});

// B2B Shipment Routes
router.post("/b2bshipment/save", async (req, res) => {
  try {
    const b2bShipment = new B2BShipment(req.body);
    await b2bShipment.save();
    res.status(201).send(b2bShipment);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Payment Routes
router.post("/payment/save", async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).send(payment);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Driver Routes
router.post("/driver/save", async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    res.status(201).send(driver);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin Routes
router.post("/admin/save", async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).send(admin);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Inquiry Routes
router.post("/inquiry/save", async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    res.status(201).send(inquiry);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/branch/save", async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).send(branch);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;

//Adding Staff
// {
//   "staffId": "STAFF001",
//   "name": "Alice Johnson",
//   "nic": "123456789V",
//   "email": "alice.johnson@example.com",
//   "profilePicLink": "https://example.com/alice.jpg",
//   "joinedDate": "2023-01-01T00:00:00Z",
//   "status": "active",
//   "branchId": "67aab0dbdb18e325006901a5", // Reference to Branch
//   "adminId": "67aafde715a9b3a9a1daa56b", // Reference to Admin
//   "password": "hashedpassword123"
// }

//Adding Admin
// {
//   "adminId":"224150L",
//   "name":"Nirmal Priyankara",
//   "nic":"200203601188",
//   "password":"Sehara",
//   "profilePicLink":"link",
//   "email":"priyankarakn@uom.lk",
//   "contactNo":"0112637561"
// }

//Adding Driver

// {
//   "driverId": "DRIVER001",
//   "name": "Sam Smith",
//   "nic": "987654321V",
//   "email": "sam.smith@example.com",
//   "password": "hashedpassword123",
//   "contact": ["0712345678", "0776543210"],
//   "licenceId": "LIC001",
//   "branchId": "67aab0dbdb18e325006901a5" // Reference to Branch
// }

//Adding Parcel

//  {
//   "parcelId": "PARCEL001",
//   "trackingNo": "TRACK001",
//   "qrCodeNo": "QR001",
//   "itemType": "Electronics",
//   "itemSize": "medium",
//   "specialInstructions": "Handle with care",
//   "submittingType": "pickup",
//   "receivingType": "doorstep",
//   "shippingMethod": "express",
//   "latestLocation": "Colombo",
//   "senderId": "67aaabc9f7b52d94162f792f", // Reference to Customer
//   "receiverId": "67aaabe7f7b52d94162f7931", // Reference to Receiver
//   "orderPlacedTime": "2023-10-01T10:00:00Z",
//   "orderPlacedStaffId": "67ab02f1296d464c25cb886a" // Reference to Staff
// }

//Adding Staff

// {
//   "staffId": "STAFF001",
//   "name": "Alice Johnson",
//   "nic": "123456789V",
//   "email": "alice.johnson@example.com",
//   "profilePicLink": "https://example.com/alice.jpg",
//   "joinedDate": "2023-01-01T00:00:00Z",
//   "status": "active",
//   "branchId": "BRANCH001", // Reference to Branch
//   "adminId": "ADMIN001", // Reference to Admin
//   "password": "hashedpassword123"
// }

// B2BShipment
// {
//   "shipmentId": "B2BSHIP001",
//   "shipmentType": "B2B",
//   "distributionBranchId": "67aab0dbdb18e325006901a5", // Reference to Branch
//   "collectionBranchId": "67aab0dbdb18e325006901a5", // Reference to Branch
//   "assignedStaffId": "67ab02f1296d464c25cb886a", // Reference to Staff
//   "driverId": "67aab148db18e325006901a8" // Reference to Driver
// }

// To access data from referenced fields (`customerId` and `staffId` in your `inquirySchema`), you need to use **Mongoose's `populate()` method**. Here's how you can retrieve inquiries along with the referenced customer and staff details:

// ---

// ### 1️⃣ **Basic Query (Without Populating References)**
// If you just fetch an inquiry, you'll get only the IDs of referenced documents:
// ```javascript
// const Inquiry = require("./models/Inquiry"); // Import your Inquiry model

// async function getInquiries() {
//   const inquiries = await Inquiry.find();
//   console.log(inquiries);
// }
// getInquiries();
// ```
// This will return:
// ```json
// [
//   {
//     "_id": "65a1234567890abcdef12345",
//     "inquiryId": "INQ12345",
//     "message": "Where is my parcel?",
//     "status": "not",
//     "parcelTrackingNo": "TRK98765",
//     "inquiryTime": "2024-02-10T10:00:00Z",
//     "customerId": "65aabcdef1234567890abcde",
//     "staffId": "65abcdef1234567890abcdef",
//     "reply": [],
//     "createdAt": "2024-02-10T10:05:00Z",
//     "updatedAt": "2024-02-10T10:05:00Z"
//   }
// ]
// ```
// You can see that `customerId` and `staffId` are just **ObjectIds**.

// ---

// ### 2️⃣ **Fetching Data with `populate()`**
// To get the full customer and staff details instead of just their IDs:

// ```javascript
// async function getInquiriesWithDetails() {
//   const inquiries = await Inquiry.find()
//     .populate("customerId")  // Fetch full customer details
//     .populate("staffId");    // Fetch full staff details

//   console.log(inquiries);
// }
// getInquiriesWithDetails();
// ```
// This will return:
// ```json
// [
//   {
//     "_id": "65a1234567890abcdef12345",
//     "inquiryId": "INQ12345",
//     "message": "Where is my parcel?",
//     "status": "not",
//     "parcelTrackingNo": "TRK98765",
//     "inquiryTime": "2024-02-10T10:00:00Z",
//     "customerId": {
//       "_id": "65aabcdef1234567890abcde",
//       "name": "John Doe",
//       "email": "john@example.com",
//       "phone": "1234567890"
//     },
//     "staffId": {
//       "_id": "65abcdef1234567890abcdef",
//       "name": "Jane Smith",
//       "role": "Support Agent"
//     },
//     "reply": [],
//     "createdAt": "2024-02-10T10:05:00Z",
//     "updatedAt": "2024-02-10T10:05:00Z"
//   }
// ]
// ```
// Now you get full details instead of just IDs.

// ---

// ### 3️⃣ **Selecting Specific Fields from Populated References**
// If you don’t need all fields from the referenced models, you can select specific fields:
// ```javascript
// async function getFilteredInquiries() {
//   const inquiries = await Inquiry.find()
//     .populate("customerId", "name email") // Only fetch `name` and `email` from Customer
//     .populate("staffId", "name role");    // Only fetch `name` and `role` from Staff

//   console.log(inquiries);
// }
// getFilteredInquiries();
// ```
// This will return:
// ```json
// [
//   {
//     "_id": "65a1234567890abcdef12345",
//     "inquiryId": "INQ12345",
//     "message": "Where is my parcel?",
//     "status": "not",
//     "parcelTrackingNo": "TRK98765",
//     "inquiryTime": "2024-02-10T10:00:00Z",
//     "customerId": {
//       "name": "John Doe",
//       "email": "john@example.com"
//     },
//     "staffId": {
//       "name": "Jane Smith",
//       "role": "Support Agent"
//     },
//     "reply": [],
//     "createdAt": "2024-02-10T10:05:00Z",
//     "updatedAt": "2024-02-10T10:05:00Z"
//   }
// ]
// ```
// Now, only the `name` and `email` fields from the `customerId` reference and the `name` and `role` fields from `staffId` are included.

// ---

// ### 4️⃣ **Filtering Inquiries Based on Status or Parcel Tracking Number**
// You can filter inquiries while populating references:
// ```javascript
// async function getPendingInquiries() {
//   const inquiries = await Inquiry.find({ status: "not" }) // Filter by status
//     .populate("customerId", "name email")
//     .populate("staffId", "name role");

//   console.log(inquiries);
// }
// getPendingInquiries();
// ```
// Or if you want to find inquiries related to a specific parcel:
// ```javascript
// async function getInquiryByTrackingNo(trackingNo) {
//   const inquiries = await Inquiry.find({ parcelTrackingNo: trackingNo })
//     .populate("customerId", "name email")
//     .populate("staffId", "name role");

//   console.log(inquiries);
// }
// getInquiryByTrackingNo("TRK98765");
// ```

// ---

// ### ✅ **Key Takeaways**
// 1. Use `.populate("customerId")` to get full details instead of just IDs.
// 2. Use `.populate("customerId", "name email")` to fetch only specific fields.
// 3. Combine `.find({ condition })` with `.populate()` to filter and fetch data efficiently.

// Let me know if you need more details! 🚀

// Your error is caused by this line in `inquirySchema`:

// ```js
// parcelTrackingNo: { type: mongoose.Schema.Types.trackingNo, ref: "Parcel", required: true }
// ```
// ### **Issues:**
// 1. **`mongoose.Schema.Types.trackingNo` does not exist**
//    - Mongoose only has built-in types like `String`, `Number`, `ObjectId`, etc.
// 2. **Incorrect use of `ref`**
//    - `ref` should only be used with `ObjectId`, not `String`.

// ---

// ### **Fixed Schema**
// #### **Option 1: Store `parcelTrackingNo` as a String (Recommended)**
// ```js
// const inquirySchema = new mongoose.Schema({
//   inquiryId: { type: String, required: true, unique: true },
//   message: { type: String, required: true },
//   status: { type: String, enum: ["replied", "solved", "not"], required: true },
//   parcelTrackingNo: { type: String, required: true }, // Store trackingNo as a String
//   inquiryTime: { type: Date, required: true },
//   customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
//   reply: { type: [Object], required: false },
//   staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: false },
// }, { timestamps: true });
// ```
// ✅ **Why?**
// - `parcelTrackingNo` is a `String`, just like `trackingNo` in `Parcel`.
// - You can still query related parcels:
//   ```js
//   const inquiry = await Inquiry.findOne({ parcelTrackingNo: "ABC123" });
//   const parcel = await Parcel.findOne({ trackingNo: inquiry.parcelTrackingNo });
//   ```

// ---

// #### **Option 2: Reference Parcel by `_id`**
// Modify `inquirySchema` to use `ObjectId` instead:
// ```js
// parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true },
// ```
// ✅ **Pros:** Can use `.populate("parcelId")` to fetch parcel details directly.
// ❌ **Cons:** You must store `_id` instead of `trackingNo`.

// ---

// #### **Final Fix**
// Change this incorrect line:
// ```js
// parcelTrackingNo: { type: mongoose.Schema.Types.trackingNo, ref: "Parcel", required: true }
// ```
// to this:
// ```js
// parcelTrackingNo: { type: String, required: true }
// ```
// This will **stop the crash** and allow your app to run. 🚀
