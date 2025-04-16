// const express = require("express");
// const router = express.Router();
// const {
//   Customer,
//   Parcel,
//   Shipping,
//   Pickup,
//   Deliver,
//   Receiver,
//   Staff,
//   B2BShipment,
//   Payment,
//   Driver,
//   Admin,
//   Inquiry,
//   Branch,
// } = require("../models/models");


// const jwt=require('jsonwebtoken');
// require('dotenv').config();
// const LOGIN_KEY=process.env.LOGIN_KEY;
// //LOgin





// // Parcels
// // Get all parcels
// router.get("/parcels", async (req, res) => {
//   try {
//     const parcels = await Parcel.find();
//     res.status(200).json(parcels);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching parcels", error });
//   }
// });

// // Get a parcel by parcelId
// router.get("/parcel/:parcelId", async (req, res) => {
//   try {
//     const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
//     if (!parcel) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }
//     res.status(200).json({
//       success: true,
//       existingParcels: parcel,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching parcel", error });
//   }
// });

// // Add a new parcel
// router.post("/parcel/save", async (req, res) => {
//   console.log("Received data:", req.body);
//   try {
//     const parcel = new Parcel(req.body);
//     const savedParcel = await parcel.save();
//     console.log(savedParcel);
//     res.status(201).json({message:"Parcel saved successfully",savedParcel});
//   } catch (error) {
//     res.status(500).json({ message: "Error saving parcel", error });
//   }
// });



// // Update a parcel by parcelId
// router.put("/parcelUpdate/:parcelId", async (req, res) => {
//   try {
//     const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
//     if (!parcel) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }

//     // Update parcel with provided data
//     Object.assign(parcel, req.body);

//     const updatedParcel = await parcel.save();
//     res.status(200).json({message:"Parcel updated successfully",updatedParcel});
//   } catch (error) {
//     res.status(500).json({ message: "Error updating parcel", error });
//   }
// });

// //parcel delete

// router.delete("/parcelDelete/:parcelId", async (req, res) => {
//   try {
//     const parcelId = req.params.parcelId;
//     console.log("Received parcelId for deletion:", parcelId);

//     // Attempt deletion
//     const result = await Parcel.deleteOne({ parcelId });
//     console.log("Deletion result:", result);

//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }

//     res.status(200).json({ message: "Parcel deleted successfully" ,result});
//   } catch (error) {
//     console.error("Error during deletion:", error);
//     res.status(500).json({ message: "Error deleting parcel", error: error.message });
//   }
// });





// //Customer
// //get all customers
// router.get("/customers", async (req, res) => {
//   try {
//     const customers = await Customer.find();
//     res.status(200).json({message:"Customer Details fetched successfully",customers});
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching customers", error });
//   }
// });

// //Get selected customer
// router.get("/customer/:customerId",async(req,res)=>{
//   try{
//     const customer = await Customer.findOne({customerId:req.params.customerId});
//     if(!customer){
//       return res.status(404).json({message:"Customer not found"});
//     }
//     res.status(200).json({
//       success:true,
//       existingCustomers:customer
//     })
//   }
//   catch(error){
//     res.status(500).json({message:"Error fetching parcel",error})
//   }
// })


// // add Customer
// router.post("/customer/save", async (req, res) => {
//   try {
//     const newCustomer = new Customer(req.body);
//     await newCustomer.save();
//     res.status(200).send(newCustomer);
//     return res.status(200).json({
//       success: "Customers saved successfully",
//       savedCustomers
//     });

//   } catch (error) {
//     return res.status(400).json({ message: "Error saving customers", error });
//   }
// });

// // Bulk insert Receivers
// router.post("/receiversBulk/save", async (req, res) => {
//   try {
//     if (!Array.isArray(req.body) || req.body.length === 0) {
//       return res.status(400).json({ message: "Invalid input, expected an array of receivers." });
//     }

//     const newReceivers = await Receiver.insertMany(req.body);
//     return res.status(200).json({ success: "Receivers inserted successfully", newReceivers });
//   } catch (error) {
//     return res.status(400).json({ message: "Error inserting receivers", error });
//   }
// });

// // Bulk insert Branches
// router.post("/branchesBulk/save", async (req, res) => {
//   try {
//     if (!Array.isArray(req.body) || req.body.length === 0) {
//       return res.status(400).json({ message: "Invalid input, expected an array of branches." });
//     }

//     const newBranches = await Branch.insertMany(req.body);
//     return res.status(200).json({ success: "Branches inserted successfully", newBranches });
//   } catch (error) {
//     return res.status(400).json({ message: "Error inserting branches", error });
//   }
// });

// router.post("/staffsBulk/save", async (req, res) => {
//   try {
//     if (!Array.isArray(req.body) || req.body.length === 0) {
//       return res.status(400).json({ message: "Invalid input, expected an array of staff entries." });
//     }

//     const newStaff = await Staff.insertMany(req.body);
//     return res.status(200).json({ success: "Staff inserted successfully", newStaff });
//   } catch (error) {
//     return res.status(400).json({ message: "Error inserting staff", error });
//   }
// });


// router.post("/parcelsBulk/save", async (req, res) => {
//   try {
//     if (!Array.isArray(req.body) || req.body.length === 0) {
//       return res.status(400).json({ message: "Invalid input, expected an array of parcel entries." });
//     }

//     const newParcels = await Parcel.insertMany(req.body);
//     return res.status(200).json({ success: "Parcels inserted successfully", newParcels });
//   } catch (error) {
//     return res.status(400).json({ message: "Error inserting parcels", error });
//   }
// });






// // Update a customer by customerId
// router.put("/customerUpdate/:customerId",async(req,res)=>{
//   try{
//     const customer = await Customer.findOne({customerId:req.params.customerId});
//     if(!customer){
//       return res.status(404).json({message:"Customer not found"});
//     }

//     Object.assign(customer,req.body);
//     const updatedCustomer = await customer.save();
//     res.status(200).json({message:"Customer updated successfully",updatedCustomer});
//   }
//   catch(error){
//     res.status(500).json({message:"Error updating customer",error});
//   }
// });



// //Customer delete

// router.delete("/customerDelete/:customerId",async(req,res)=>{
//   try{
//     const customerId=req.params.customerId;
    
//     const result = await Customer.deleteOne({customerId});
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     res.status(200).json({ message: "Customer deleted successfully" ,result});
//   }
//   catch(error){
//     res.status(404).json({message:"Error deleting customer",error:error.message})
//   }
// });


// //Shipping
// //get all shipping
// router.get("/shippings", async (req, res) => {
//   try {
//     const shippings = await Shipping.find();
//     res.status(200).json({ message: "Shippings fetched successfully", shippings });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching shippings", error });
//   }
// });

// //get an specific shipping
// router.get("/shipping/:shippingId", async (req, res) => {
//   try {
//     const shipping = await Shipping.findOne({ shippingId: req.params.shippingId });
//     if (!shipping) {
//       return res.status(404).json({ message: "Shipping not found" });
//     }
//     res.status(200).json({ success: true, shipping });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching shipping", error });
//   }
// });

// //add shipping
// router.post("/shipping/save", async (req, res) => {
//   try {
//     const shipping = new Shipping(req.body);
//     const savedShipping = await shipping.save();
//     res.status(200).json({ message: "Shipping saved successfully", savedShipping });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving shipping", error });
//   }
// });

// //Update a shipping by shippingId
// router.put("/shippingUpdate/:shippingId", async (req, res) => {
//   try {
//     const shipping = await Shipping.findOne({ shippingId: req.params.shippingId });
//     if (!shipping) {
//       return res.status(404).json({ message: "Shipping not found" });
//     }
//     Object.assign(shipping, req.body);
//     const updatedShipping = await shipping.save();
//     res.status(200).json({ message: "Shipping updated successfully", updatedShipping });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating shipping", error });
//   }
// });

// //Delete a shipping by shippingId
// router.delete("/shippingDelete/:shippingId", async (req, res) => {
//   try {
//     const result = await Shipping.deleteOne({ shippingId: req.params.shippingId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Shipping not found" });
//     }
//     res.status(200).json({ message: "Shipping deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting shipping", error });
//   }
// });

// //Pickup CRUD Operations
// //Get all pickups
// router.get("/pickups", async (req, res) => {
//   try {
//     const pickups = await Pickup.find();
//     res.status(200).json({ message: "Pickups fetched successfully", pickups });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching pickups", error });
//   }
// });

// //Get a pickup by pickupId
// router.get("/pickup/:pickupId", async (req, res) => {
//   try {
//     const pickup = await Pickup.findOne({ pickupId: req.params.pickupId });
//     if (!pickup) {
//       return res.status(404).json({ message: "Pickup not found" });
//     }
//     res.status(200).json({ success: true, pickup });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching pickup", error });
//   }
// });

// //Add a new pickup
// router.post("/pickup/save", async (req, res) => {
//   try {
//     const pickup = new Pickup(req.body);
//     const savedPickup = await pickup.save();
//     res.status(201).json({ message: "Pickup saved successfully", savedPickup });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving pickup", error });
//   }
// });

// //Update a pickup by pickupId
// router.put("/pickupUpdate/:pickupId", async (req, res) => {
//   try {
//     const pickup = await Pickup.findOne({ pickupId: req.params.pickupId });
//     if (!pickup) {
//       return res.status(404).json({ message: "Pickup not found" });
//     }
//     Object.assign(pickup, req.body);
//     const updatedPickup = await pickup.save();
//     res.status(200).json({ message: "Pickup updated successfully", updatedPickup });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating pickup", error });
//   }
// });

// //Delete a pickup by pickupId
// router.delete("/pickupDelete/:pickupId", async (req, res) => {
//   try {
//     const result = await Pickup.deleteOne({ pickupId: req.params.pickupId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Pickup not found" });
//     }
//     res.status(200).json({ message: "Pickup deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting pickup", error });
//   }
// });


// //Deliver CRUD Operations
// //Get all deliveries
// router.get("/deliveries", async (req, res) => {
//   try {
//     const deliveries = await Deliver.find();
//     res.status(200).json({ message: "Deliveries fetched successfully", deliveries });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching deliveries", error });
//   }
// });

// //Get a delivery by deliverId
// router.get("/delivery/:deliverId", async (req, res) => {
//   try {
//     const delivery = await Deliver.findOne({ deliverId: req.params.deliverId });
//     if (!delivery) {
//       return res.status(404).json({ message: "Delivery not found" });
//     }
//     res.status(200).json({ success: true, delivery });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching delivery", error });
//   }
// });


// //Add a new delivery
// router.post("/delivery/save", async (req, res) => {
//   try {
//     const delivery = new Deliver(req.body);
//     const savedDelivery = await delivery.save();
//     res.status(201).json({ message: "Delivery saved successfully", savedDelivery });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving delivery", error });
//   }
// });

// //Update a delivery by deliverId
// router.put("/deliveryUpdate/:deliverId", async (req, res) => {
//   try {
//     const delivery = await Deliver.findOne({ deliverId: req.params.deliverId });
//     if (!delivery) {
//       return res.status(404).json({ message: "Delivery not found" });
//     }
//     Object.assign(delivery, req.body);
//     const updatedDelivery = await delivery.save();
//     res.status(200).json({ message: "Delivery updated successfully", updatedDelivery });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating delivery", error });
//   }
// });

// //Delete a delivery by deliverId
// router.delete("/deliveryDelete/:deliverId", async (req, res) => {
//   try {
//     const result = await Deliver.deleteOne({ deliverId: req.params.deliverId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Delivery not found" });
//     }
//     res.status(200).json({ message: "Delivery deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting delivery", error });
//   }
// });

// //========================================================================================================================================================

// // Driver CRUD Operations
// // Get all drivers

// router.get("/drivers", async (req, res) => {
//   try {
//     const drivers = await Driver.find();
//     res.status(200).json({ message: "Drivers fetched successfully", drivers });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching drivers", error });
//   }
// });

// // Get a driver by driverId
// router.get("/driver/:driverId", async (req, res) => {
//   try {
//     const driver = await Driver.findOne({ driverId: req.params.driverId });
//     if (!driver) {
//       return res.status(404).json({ message: "Driver not found" });
//     }
//     res.status(200).json({ success: true, driver });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching driver", error });
//   }
// });

// // Receiver CRUD Operations
// // Get all receivers
// router.get("/receivers", async (req, res) => {
//   try {
//     const receivers = await Receiver.find();
//     res.status(200).json({ message: "Receivers fetched successfully", receivers });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching receivers", error });
//   }
// });

// // Get a receiver by receiverId
// router.get("/receiver/:receiverId", async (req, res) => {
//   try {
//     const receiver = await Receiver.findOne({ receiverId: req.params.receiverId });
//     if (!receiver) {
//       return res.status(404).json({ message: "Receiver not found" });
//     }
//     res.status(200).json({ success: true, receiver });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching receiver", error });
//   }
// });
// // Add a new receiver

// router.post("/receiver/save", async (req, res) => {
//   try {
//     const receiver = new Receiver(req.body);
//     const savedReceiver = await receiver.save();
//     res.status(201).json({ message: "Receiver saved successfully", savedReceiver });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving receiver", error });
//   }
// });
// //Update a receiver by receiverId
// router.put("/receiverUpdate/:receiverId", async (req, res) => {
//   try {
//     const receiver = await Receiver.findOne({ receiverId: req.params.receiverId });
//     if (!receiver) {
//       return res.status(404).json({ message: "Receiver not found" });
//     }
//     Object.assign(receiver, req.body);
//     const updatedReceiver = await receiver.save();
//     res.status(200).json({ message: "Receiver updated successfully", updatedReceiver });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating receiver", error });
//   }
// });
// //Delete a receiver by receiverId
// router.delete("/receiverDelete/:receiverId", async (req, res) => {
//   try {
//     const result = await Receiver.deleteOne({ receiverId: req.params.receiverId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Receiver not found" });
//     }
//     res.status(200).json({ message: "Receiver deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting receiver", error });
//   }
// });

// // Staff CRUD Operations
// // Get all staff

// router.get("/staff", async (req, res) => {
//   try {
//     const staff = await Staff.find();
//     res.status(200).json({ message: "Staff fetched successfully", staff });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching staff", error });
//   }
// });

// // Get a staff by staffId
// router.get("/staff/:staffId", async (req, res) => {
//   try {
//     const staff = await Staff.findOne({ staffId: req.params.staffId });
//     if (!staff) {
//       return res.status(404).json({ message: "Staff not found" });
//     }
//     res.status(200).json({ success: true, staff });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching staff", error });
//   }
// });

// // Add a new staff
// router.post("/staff/save", async (req, res) => {
//   try {
//     const staff = new Staff(req.body);
//     const savedStaff = await staff.save();
//     res.status(201).json({ message: "Staff saved successfully", savedStaff });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving staff", error });
//   }
// });

// // Update a staff by staffId
// router.put("/staffUpdate/:staffId", async (req, res) => {
//   try {
//     const staff = await Staff.findOne({ staffId: req.params.staffId });
//     if (!staff) {
//       return res.status(404).json({ message: "Staff not found" });
//     }
//     Object.assign(staff, req.body);
//     const updatedStaff = await staff.save();
//     res.status(200).json({ message: "Staff updated successfully", updatedStaff });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating staff", error });
//   }
// });


// //Delete a staff by staffId
// router.delete("/staffDelete/:staffId", async (req, res) => {
//   try {
//     const result = await Staff.deleteOne({ staffId: req.params.staffId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Staff not found" });
//     }
//     res.status(200).json({ message: "Staff deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting staff", error });
//   }
// });

// // B2BShipment CRUD Operations
// // Get all B2B shipments

// router.get("/b2bShipments", async (req, res) => {
//   try {
//     const shipments = await B2BShipment.find();
//     res.status(200).json({ message: "B2B shipments fetched successfully", shipments });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching B2B shipments", error });
//   }
// });

// //Get a B2B shipment by shipmentId
// router.get("/b2bShipment/:shipmentId", async (req, res) => {
//   try {
//     const shipment = await B2BShipment.findOne({ shipmentId: req.params.shipmentId });
//     if (!shipment) {
//       return res.status(404).json({ message: "B2B shipment not found" });
//     }
//     res.status(200).json({ success: true, shipment });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching B2B shipment", error });
//   }
// });

// // Add a new B2B shipment
// router.post("/b2bShipment/save", async (req, res) => {
//   try {
//     const shipment = new B2BShipment(req.body);
//     const savedShipment = await shipment.save();
//     res.status(201).json({ message: "B2B shipment saved successfully", savedShipment });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving B2B shipment", error });
//   }
// });

// // Update a B2B shipment by shipmentId
// router.put("/b2bShipmentUpdate/:shipmentId", async (req, res) => {
//   try {
//     const shipment = await B2BShipment.findOne({ shipmentId: req.params.shipmentId });
//     if (!shipment) {
//       return res.status(404).json({ message: "B2B shipment not found" });
//     }
//     Object.assign(shipment, req.body);
//     const updatedShipment = await shipment.save();
//     res.status(200).json({ message: "B2B shipment updated successfully", updatedShipment });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating B2B shipment", error });
//   }
// });


// //Delete a B2B shipment by shipmentId

// router.delete("/b2bShipmentDelete/:shipmentId", async (req, res) => {
//   try {
//     const result = await B2BShipment.deleteOne({ shipmentId: req.params.shipmentId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "B2B shipment not found" });
//     }
//     res.status(200).json({ message: "B2B shipment deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting B2B shipment", error });
//   }
// });

// // Payment CRUD Operations
// // Get all payments
// router.get("/payments", async (req, res) => {
//   try {
//     const payments = await Payment.find();
//     res.status(200).json({ message: "Payments fetched successfully", payments });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching payments", error });
//   }
// });


// //Get a payment by paymentId
// router.get("/payment/:paymentId", async (req, res) => {
//   try {
//     const payment = await Payment.findOne({ paymentId: req.params.paymentId });
//     if (!payment) {
//       return res.status(404).json({ message: "Payment not found" });
//     }
//     res.status(200).json({ success: true, payment });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching payment", error });
//   }
// });

// //Add a new payment
// router.post("/payment/save", async (req, res) => {
//   try {
//     const payment = new Payment(req.body);
//     const savedPayment = await payment.save();
//     res.status(201).json({ message: "Payment saved successfully", savedPayment });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving payment", error });
//   }
// });

// //Update a payment by paymentId
// router.put("/paymentUpdate/:paymentId", async (req, res) => {
//   try {
//     const payment = await Payment.findOne({ paymentId: req.params.paymentId });
//     if (!payment) {
//       return res.status(404).json({ message: "Payment not found" });
//     }
//     Object.assign(payment, req.body);
//     const updatedPayment = await payment.save();
//     res.status(200).json({ message: "Payment updated successfully", updatedPayment });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating payment", error });
//   }
// });
// //Delete a payment by paymentId
// router.delete("/paymentDelete/:paymentId", async (req, res) => {
//   try {
//     const result = await Payment.deleteOne({ paymentId: req.params.paymentId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Payment not found" });
//     }
//     res.status(200).json({ message: "Payment deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting payment", error });
//   }
// });



// // Inquiry CRUD Operations
// // Get all inquiries
// router.get("/inquiries", async (req, res) => {
//   try {
//     const inquiries = await Inquiry.find();
//     res.status(200).json({ message: "Inquiries fetched successfully", inquiries });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching inquiries", error });
//   }
// });

// //Get an inquiry by inquiryId
// router.get("/inquiry/:inquiryId", async (req, res) => {
//   try {
//     const inquiry = await Inquiry.findOne({ inquiryId: req.params.inquiryId });
//     if (!inquiry) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }
//     res.status(200).json({ success: true, inquiry });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching inquiry", error });
//   }
// });

// //Add a new inquiry
// router.post("/inquiry/save", async (req, res) => {
//   try {
//     const inquiry = new Inquiry(req.body);
//     const savedInquiry = await inquiry.save();
//     res.status(201).json({ message: "Inquiry saved successfully", savedInquiry });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving inquiry", error });
//   }
// });

// //Update an inquiry by inquiryId
// router.put("/inquiryUpdate/:inquiryId", async (req, res) => {
//   try {
//     const inquiry = await Inquiry.findOne({ inquiryId: req.params.inquiryId });
//     if (!inquiry) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }
//     Object.assign(inquiry, req.body);
//     const updatedInquiry = await inquiry.save();
//     res.status(200).json({ message: "Inquiry updated successfully", updatedInquiry });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating inquiry", error });
//   }
// });

// //Delete an inquiry by inquiryId
// router.delete("/inquiryDelete/:inquiryId", async (req, res) => {
//   try {
//     const result = await Inquiry.deleteOne({ inquiryId: req.params.inquiryId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Inquiry not found" });
//     }
//     res.status(200).json({ message: "Inquiry deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting inquiry", error });
//   }
// });

// //Branch CRUD Operations
// // Get all branches
// router.get("/branches", async (req, res) => {
//   try {
//     const branches = await Branch.find();
//     res.status(200).json({ message: "Branches fetched successfully", branches });
//     console.log("All branches Fetched");
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching branches", error });
//   }
// });


// //Get a branch by branchId
// router.get("/branch/:branchId", async (req, res) => {
//   try {
//     const branch = await Branch.findOne({ branchId: req.params.branchId });
//     if (!branch) {
//       return res.status(404).json({ message: "Branch not found" });
//     }
//     res.status(200).json({ success: true, branch });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching branch", error });
//   }
// });


// // Add a new branch
// router.post("/branch/save", async (req, res) => {
//   try {
//     const branch = new Branch(req.body);
//     const savedBranch = await branch.save();
//     res.status(201).json({ message: "Branch saved successfully", savedBranch });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving branch", error });
//   }
// });

// //Update a branch by branchId
// router.put("/branchUpdate/:branchId", async (req, res) => {
//   try {
//     const branch = await Branch.findOne({ branchId: req.params.branchId });
//     if (!branch) {
//       return res.status(404).json({ message: "Branch not found" });
//     }
//     Object.assign(branch, req.body);
//     const updatedBranch = await branch.save();
//     res.status(200).json({ message: "Branch updated successfully", updatedBranch });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating branch", error });
//   }
// });

// //Delete a branch by branchId
// router.delete("/branchDelete/:branchId", async (req, res) => {
//   try {
//     const result = await Branch.deleteOne({ branchId: req.params.branchId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Branch not found" });
//     }
//     res.status(200).json({ message: "Branch deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting branch", error });
//   }
// });



// // Add a new driver

// router.post("/driver/save", async (req, res) => {
//   try {
//     const driver = new Driver(req.body);
//     const savedDriver = await driver.save();
//     res.status(201).json({ message: "Driver saved successfully", savedDriver });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving driver", error });
//   }
// });


// // Update a driver by driverId
// router.put("/driverUpdate/:driverId", async (req, res) => {
//   try {
//     const driver = await Driver.findOne({ driverId: req.params.driverId });
//     if (!driver) {
//       return res.status(404).json({ message: "Driver not found" });
//     }
//     Object.assign(driver, req.body);
//     const updatedDriver = await driver.save();
//     res.status(200).json({ message: "Driver updated successfully", updatedDriver });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating driver", error });
//   }
// });

// //Delete a driver by driverId
// router.delete("/driverDelete/:driverId", async (req, res) => {
//   try {
//     const result = await Driver.deleteOne({ driverId: req.params.driverId });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Driver not found" });
//     }
//     res.status(200).json({ message: "Driver deleted successfully", result });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting driver", error });
//   }
// });


// module.exports = router;