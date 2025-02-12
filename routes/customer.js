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



// Parcels
// Get all parcels
router.get("/parcels", async (req, res) => {
  try {
    const parcels = await Parcel.find();
    res.status(200).json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching parcels", error });
  }
});

// Get a parcel by parcelId
router.get("/parcel/:parcelId", async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }
    res.status(200).json({
      success: true,
      existingParcels: parcel,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching parcel", error });
  }
});

// Add a new parcel
router.post("/parcel/save", async (req, res) => {
  console.log("Received data:", req.body);
  try {
    const parcel = new Parcel(req.body);
    const savedParcel = await parcel.save();
    console.log(savedParcel);
    res.status(201).json({message:"Parcel saved successfully",savedParcel});
  } catch (error) {
    res.status(500).json({ message: "Error saving parcel", error });
  }
});



// Update a parcel by parcelId
router.put("/parcelUpdate/:parcelId", async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Update parcel with provided data
    Object.assign(parcel, req.body);

    const updatedParcel = await parcel.save();
    res.status(200).json({message:"Parcel updated successfully",updatedParcel});
  } catch (error) {
    res.status(500).json({ message: "Error updating parcel", error });
  }
});

//parcel delete

router.delete("/parcelDelete/:parcelId", async (req, res) => {
  try {
    const parcelId = req.params.parcelId;
    console.log("Received parcelId for deletion:", parcelId);

    // Attempt deletion
    const result = await Parcel.deleteOne({ parcelId });
    console.log("Deletion result:", result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.status(200).json({ message: "Parcel deleted successfully" ,result});
  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({ message: "Error deleting parcel", error: error.message });
  }
});





//Customer
//get all customers
router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json({message:"Customer Details fetched successfully",customers});
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
  }
});

//Get selected customer
router.get("/customer/:customerId",async(req,res)=>{
  try{
    const customer = await Customer.findOne({customerId:req.params.customerId});
    if(!customer){
      return res.status(404).json({message:"Customer not found"});
    }
    res.status(200).json({
      success:true,
      existingCustomers:customer
    })
  }
  catch(error){
    res.status(500).json({message:"Error fetching parcel",error})
  }
})


// add Customer
router.post("/customer/save", async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    return res.status(200).json({success: "Customer saved successfully",newCustomer});
  } catch (error) {
    return res.status(400).json({ message: "Error saving parcel", error });
  }
});


// Update a customer by customerId
router.put("/customerUpdate/:customerId",async(req,res)=>{
  try{
    const customer = await Customer.findOne({customerId:req.params.customerId});
    if(!customer){
      return res.status(404).json({message:"Customer not found"});
    }

    Object.assign(customer,req.body);
    const updatedCustomer = await customer.save();
    res.status(200).json({message:"Customer updated successfully",updatedCustomer});
  }
  catch(error){
    res.status(500).json({message:"Error updating customer",error});
  }
});



//Customer delete

router.delete("/customerDelete/:customerId",async(req,res)=>{
  try{
    const customerId=req.params.customerId;
    
    const result = await Customer.deleteOne({customerId});
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer deleted successfully" ,result});
  }
  catch(error){
    res.status(404).json({message:"Error deleting customer",error:error.message})
  }
});


//Shipping
//get all shipping
router.get("/shippings", async (req, res) => {
  try {
    const shippings = await Shipping.find();
    res.status(200).json({ message: "Shippings fetched successfully", shippings });
  } catch (error) {
    res.status(500).json({ message: "Error fetching shippings", error });
  }
});

//get an specific shipping
router.get("/shipping/:shippingId", async (req, res) => {
  try {
    const shipping = await Shipping.findOne({ shippingId: req.params.shippingId });
    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }
    res.status(200).json({ success: true, shipping });
  } catch (error) {
    res.status(500).json({ message: "Error fetching shipping", error });
  }
});

//add shipping
router.post("/shipping/save", async (req, res) => {
  try {
    const shipping = new Shipping(req.body);
    const savedShipping = await shipping.save();
    res.status(200).json({ message: "Shipping saved successfully", savedShipping });
  } catch (error) {
    res.status(500).json({ message: "Error saving shipping", error });
  }
});

//Update a shipping by shippingId
router.put("/shippingUpdate/:shippingId", async (req, res) => {
  try {
    const shipping = await Shipping.findOne({ shippingId: req.params.shippingId });
    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }
    Object.assign(shipping, req.body);
    const updatedShipping = await shipping.save();
    res.status(200).json({ message: "Shipping updated successfully", updatedShipping });
  } catch (error) {
    res.status(500).json({ message: "Error updating shipping", error });
  }
});

//Delete a shipping by shippingId
router.delete("/shippingDelete/:shippingId", async (req, res) => {
  try {
    const result = await Shipping.deleteOne({ shippingId: req.params.shippingId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Shipping not found" });
    }
    res.status(200).json({ message: "Shipping deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting shipping", error });
  }
});

//Pickup CRUD Operations
//Get all pickups
router.get("/pickups", async (req, res) => {
  try {
    const pickups = await Pickup.find();
    res.status(200).json({ message: "Pickups fetched successfully", pickups });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pickups", error });
  }
});

//Get a pickup by pickupId
router.get("/pickup/:pickupId", async (req, res) => {
  try {
    const pickup = await Pickup.findOne({ pickupId: req.params.pickupId });
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }
    res.status(200).json({ success: true, pickup });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pickup", error });
  }
});

//Add a new pickup
router.post("/pickup/save", async (req, res) => {
  try {
    const pickup = new Pickup(req.body);
    const savedPickup = await pickup.save();
    res.status(201).json({ message: "Pickup saved successfully", savedPickup });
  } catch (error) {
    res.status(500).json({ message: "Error saving pickup", error });
  }
});

//Update a pickup by pickupId
router.put("/pickupUpdate/:pickupId", async (req, res) => {
  try {
    const pickup = await Pickup.findOne({ pickupId: req.params.pickupId });
    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found" });
    }
    Object.assign(pickup, req.body);
    const updatedPickup = await pickup.save();
    res.status(200).json({ message: "Pickup updated successfully", updatedPickup });
  } catch (error) {
    res.status(500).json({ message: "Error updating pickup", error });
  }
});

//Delete a pickup by pickupId
router.delete("/pickupDelete/:pickupId", async (req, res) => {
  try {
    const result = await Pickup.deleteOne({ pickupId: req.params.pickupId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Pickup not found" });
    }
    res.status(200).json({ message: "Pickup deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting pickup", error });
  }
});


//Deliver CRUD Operations
//Get all deliveries
router.get("/deliveries", async (req, res) => {
  try {
    const deliveries = await Deliver.find();
    res.status(200).json({ message: "Deliveries fetched successfully", deliveries });
  } catch (error) {
    res.status(500).json({ message: "Error fetching deliveries", error });
  }
});

//Get a delivery by deliverId
router.get("/delivery/:deliverId", async (req, res) => {
  try {
    const delivery = await Deliver.findOne({ deliverId: req.params.deliverId });
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    res.status(200).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ message: "Error fetching delivery", error });
  }
});


//Add a new delivery
router.post("/delivery/save", async (req, res) => {
  try {
    const delivery = new Deliver(req.body);
    const savedDelivery = await delivery.save();
    res.status(201).json({ message: "Delivery saved successfully", savedDelivery });
  } catch (error) {
    res.status(500).json({ message: "Error saving delivery", error });
  }
});

//Update a delivery by deliverId
router.put("/deliveryUpdate/:deliverId", async (req, res) => {
  try {
    const delivery = await Deliver.findOne({ deliverId: req.params.deliverId });
    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    Object.assign(delivery, req.body);
    const updatedDelivery = await delivery.save();
    res.status(200).json({ message: "Delivery updated successfully", updatedDelivery });
  } catch (error) {
    res.status(500).json({ message: "Error updating delivery", error });
  }
});

//Delete a delivery by deliverId
router.delete("/deliveryDelete/:deliverId", async (req, res) => {
  try {
    const result = await Deliver.deleteOne({ deliverId: req.params.deliverId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Delivery not found" });
    }
    res.status(200).json({ message: "Delivery deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting delivery", error });
  }
});

//========================================================================================================================================================

// Driver CRUD Operations
// Get all drivers

router.get("/drivers", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.status(200).json({ message: "Drivers fetched successfully", drivers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching drivers", error });
  }
});

// Get a driver by driverId
router.get("/driver/:driverId", async (req, res) => {
  try {
    const driver = await Driver.findOne({ driverId: req.params.driverId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.status(200).json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ message: "Error fetching driver", error });
  }
});

// Receiver CRUD Operations
// Get all receivers
router.get("/receivers", async (req, res) => {
  try {
    const receivers = await Receiver.find();
    res.status(200).json({ message: "Receivers fetched successfully", receivers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching receivers", error });
  }
});

// Get a receiver by receiverId
router.get("/receiver/:receiverId", async (req, res) => {
  try {
    const receiver = await Receiver.findOne({ receiverId: req.params.receiverId });
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    res.status(200).json({ success: true, receiver });
  } catch (error) {
    res.status(500).json({ message: "Error fetching receiver", error });
  }
});
// Add a new receiver

router.post("/receiver/save", async (req, res) => {
  try {
    const receiver = new Receiver(req.body);
    const savedReceiver = await receiver.save();
    res.status(201).json({ message: "Receiver saved successfully", savedReceiver });
  } catch (error) {
    res.status(500).json({ message: "Error saving receiver", error });
  }
});
//Update a receiver by receiverId
router.put("/receiverUpdate/:receiverId", async (req, res) => {
  try {
    const receiver = await Receiver.findOne({ receiverId: req.params.receiverId });
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    Object.assign(receiver, req.body);
    const updatedReceiver = await receiver.save();
    res.status(200).json({ message: "Receiver updated successfully", updatedReceiver });
  } catch (error) {
    res.status(500).json({ message: "Error updating receiver", error });
  }
});
//Delete a receiver by receiverId
router.delete("/receiverDelete/:receiverId", async (req, res) => {
  try {
    const result = await Receiver.deleteOne({ receiverId: req.params.receiverId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    res.status(200).json({ message: "Receiver deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting receiver", error });
  }
});

// Staff CRUD Operations
// Get all staff

router.get("/staff", async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json({ message: "Staff fetched successfully", staff });
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error });
  }
});

// Get a staff by staffId
router.get("/staff/:staffId", async (req, res) => {
  try {
    const staff = await Staff.findOne({ staffId: req.params.staffId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error });
  }
});

// Add a new staff
router.post("/staff/save", async (req, res) => {
  try {
    const staff = new Staff(req.body);
    const savedStaff = await staff.save();
    res.status(201).json({ message: "Staff saved successfully", savedStaff });
  } catch (error) {
    res.status(500).json({ message: "Error saving staff", error });
  }
});

// Update a staff by staffId
router.put("/staffUpdate/:staffId", async (req, res) => {
  try {
    const staff = await Staff.findOne({ staffId: req.params.staffId });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    Object.assign(staff, req.body);
    const updatedStaff = await staff.save();
    res.status(200).json({ message: "Staff updated successfully", updatedStaff });
  } catch (error) {
    res.status(500).json({ message: "Error updating staff", error });
  }
});


//Delete a staff by staffId
router.delete("/staffDelete/:staffId", async (req, res) => {
  try {
    const result = await Staff.deleteOne({ staffId: req.params.staffId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({ message: "Staff deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting staff", error });
  }
});

// B2BShipment CRUD Operations
// Get all B2B shipments

router.get("/b2bShipments", async (req, res) => {
  try {
    const shipments = await B2BShipment.find();
    res.status(200).json({ message: "B2B shipments fetched successfully", shipments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching B2B shipments", error });
  }
});

//Get a B2B shipment by shipmentId
router.get("/b2bShipment/:shipmentId", async (req, res) => {
  try {
    const shipment = await B2BShipment.findOne({ shipmentId: req.params.shipmentId });
    if (!shipment) {
      return res.status(404).json({ message: "B2B shipment not found" });
    }
    res.status(200).json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ message: "Error fetching B2B shipment", error });
  }
});

// Add a new B2B shipment
router.post("/b2bShipment/save", async (req, res) => {
  try {
    const shipment = new B2BShipment(req.body);
    const savedShipment = await shipment.save();
    res.status(201).json({ message: "B2B shipment saved successfully", savedShipment });
  } catch (error) {
    res.status(500).json({ message: "Error saving B2B shipment", error });
  }
});

// Update a B2B shipment by shipmentId
router.put("/b2bShipmentUpdate/:shipmentId", async (req, res) => {
  try {
    const shipment = await B2BShipment.findOne({ shipmentId: req.params.shipmentId });
    if (!shipment) {
      return res.status(404).json({ message: "B2B shipment not found" });
    }
    Object.assign(shipment, req.body);
    const updatedShipment = await shipment.save();
    res.status(200).json({ message: "B2B shipment updated successfully", updatedShipment });
  } catch (error) {
    res.status(500).json({ message: "Error updating B2B shipment", error });
  }
});


//Delete a B2B shipment by shipmentId

router.delete("/b2bShipmentDelete/:shipmentId", async (req, res) => {
  try {
    const result = await B2BShipment.deleteOne({ shipmentId: req.params.shipmentId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "B2B shipment not found" });
    }
    res.status(200).json({ message: "B2B shipment deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting B2B shipment", error });
  }
});

// Payment CRUD Operations
// Get all payments
router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json({ message: "Payments fetched successfully", payments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments", error });
  }
});


//Get a payment by paymentId
router.get("/payment/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment", error });
  }
});

//Add a new payment
router.post("/payment/save", async (req, res) => {
  try {
    const payment = new Payment(req.body);
    const savedPayment = await payment.save();
    res.status(201).json({ message: "Payment saved successfully", savedPayment });
  } catch (error) {
    res.status(500).json({ message: "Error saving payment", error });
  }
});

//Update a payment by paymentId
router.put("/paymentUpdate/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    Object.assign(payment, req.body);
    const updatedPayment = await payment.save();
    res.status(200).json({ message: "Payment updated successfully", updatedPayment });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment", error });
  }
});
//Delete a payment by paymentId
router.delete("/paymentDelete/:paymentId", async (req, res) => {
  try {
    const result = await Payment.deleteOne({ paymentId: req.params.paymentId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.status(200).json({ message: "Payment deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting payment", error });
  }
});

// Admin CRUD Operations
// Get all admins
router.get("/admins", async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ message: "Admins fetched successfully", admins });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins", error });
  }
});

//Get an admin by adminId
router.get("/admin/:adminId", async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminId: req.params.adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin", error });
  }
});

//Add a new admin
router.post("/admin/save", async (req, res) => {
  try {
    const admin = new Admin(req.body);
    const savedAdmin = await admin.save();
    res.status(201).json({ message: "Admin saved successfully", savedAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error saving admin", error });
  }
});

//Update an admin by adminId
router.put("/adminUpdate/:adminId", async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminId: req.params.adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    Object.assign(admin, req.body);
    const updatedAdmin = await admin.save();
    res.status(200).json({ message: "Admin updated successfully", updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error updating admin", error });
  }
});

// Delete an admin by adminId
router.delete("/adminDelete/:adminId", async (req, res) => {
  try {
    const result = await Admin.deleteOne({ adminId: req.params.adminId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting admin", error });
  }
});


// Inquiry CRUD Operations
// Get all inquiries
router.get("/inquiries", async (req, res) => {
  try {
    const inquiries = await Inquiry.find();
    res.status(200).json({ message: "Inquiries fetched successfully", inquiries });
  } catch (error) {
    res.status(500).json({ message: "Error fetching inquiries", error });
  }
});

//Get an inquiry by inquiryId
router.get("/inquiry/:inquiryId", async (req, res) => {
  try {
    const inquiry = await Inquiry.findOne({ inquiryId: req.params.inquiryId });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.status(200).json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ message: "Error fetching inquiry", error });
  }
});

//Add a new inquiry
router.post("/inquiry/save", async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    const savedInquiry = await inquiry.save();
    res.status(201).json({ message: "Inquiry saved successfully", savedInquiry });
  } catch (error) {
    res.status(500).json({ message: "Error saving inquiry", error });
  }
});

//Update an inquiry by inquiryId
router.put("/inquiryUpdate/:inquiryId", async (req, res) => {
  try {
    const inquiry = await Inquiry.findOne({ inquiryId: req.params.inquiryId });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    Object.assign(inquiry, req.body);
    const updatedInquiry = await inquiry.save();
    res.status(200).json({ message: "Inquiry updated successfully", updatedInquiry });
  } catch (error) {
    res.status(500).json({ message: "Error updating inquiry", error });
  }
});

//Delete an inquiry by inquiryId
router.delete("/inquiryDelete/:inquiryId", async (req, res) => {
  try {
    const result = await Inquiry.deleteOne({ inquiryId: req.params.inquiryId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.status(200).json({ message: "Inquiry deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting inquiry", error });
  }
});

//Branch CRUD Operations
// Get all branches
router.get("/branches", async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json({ message: "Branches fetched successfully", branches });
  } catch (error) {
    res.status(500).json({ message: "Error fetching branches", error });
  }
});


//Get a branch by branchId
router.get("/branch/:branchId", async (req, res) => {
  try {
    const branch = await Branch.findOne({ branchId: req.params.branchId });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ message: "Error fetching branch", error });
  }
});


// Add a new branch
router.post("/branch/save", async (req, res) => {
  try {
    const branch = new Branch(req.body);
    const savedBranch = await branch.save();
    res.status(201).json({ message: "Branch saved successfully", savedBranch });
  } catch (error) {
    res.status(500).json({ message: "Error saving branch", error });
  }
});

//Update a branch by branchId
router.put("/branchUpdate/:branchId", async (req, res) => {
  try {
    const branch = await Branch.findOne({ branchId: req.params.branchId });
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    Object.assign(branch, req.body);
    const updatedBranch = await branch.save();
    res.status(200).json({ message: "Branch updated successfully", updatedBranch });
  } catch (error) {
    res.status(500).json({ message: "Error updating branch", error });
  }
});

//Delete a branch by branchId
router.delete("/branchDelete/:branchId", async (req, res) => {
  try {
    const result = await Branch.deleteOne({ branchId: req.params.branchId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json({ message: "Branch deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting branch", error });
  }
});



// Add a new driver

router.post("/driver/save", async (req, res) => {
  try {
    const driver = new Driver(req.body);
    const savedDriver = await driver.save();
    res.status(201).json({ message: "Driver saved successfully", savedDriver });
  } catch (error) {
    res.status(500).json({ message: "Error saving driver", error });
  }
});


// Update a driver by driverId
router.put("/driverUpdate/:driverId", async (req, res) => {
  try {
    const driver = await Driver.findOne({ driverId: req.params.driverId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    Object.assign(driver, req.body);
    const updatedDriver = await driver.save();
    res.status(200).json({ message: "Driver updated successfully", updatedDriver });
  } catch (error) {
    res.status(500).json({ message: "Error updating driver", error });
  }
});

//Delete a driver by driverId
router.delete("/driverDelete/:driverId", async (req, res) => {
  try {
    const result = await Driver.deleteOne({ driverId: req.params.driverId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.status(200).json({ message: "Driver deleted successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Error deleting driver", error });
  }
});




































// // Shipping Routes
// router.post("/shipping/save", async (req, res) => {
//   try {
//     const shipping = new Shipping(req.body);
//     await shipping.save();
//     res.status(201).send(shipping);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Pickup Routes
// router.post("/pickup/save", async (req, res) => {
//   try {
//     const pickup = new Pickup(req.body);
//     await pickup.save();
//     res.status(201).send(pickup);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Deliver Routes
// router.post("/deliver/save", async (req, res) => {
//   try {
//     const deliver = new Deliver(req.body);
//     await deliver.save();
//     res.status(201).send(deliver);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Receiver Routes
// router.post("/receiver/save", async (req, res) => {
//   try {
//     const receiver = new Receiver(req.body);
//     await receiver.save();
//     res.status(201).send(receiver);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Staff Routes
// router.post("/staff/save", async (req, res) => {
//   try {
//     const staff = new Staff(req.body);
//     await staff.save();
//     res.status(201).send(staff);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // B2B Shipment Routes
// router.post("/b2bshipment/save", async (req, res) => {
//   try {
//     const b2bShipment = new B2BShipment(req.body);
//     await b2bShipment.save();
//     res.status(201).send(b2bShipment);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Payment Routes
// router.post("/payment/save", async (req, res) => {
//   try {
//     const payment = new Payment(req.body);
//     await payment.save();
//     res.status(201).send(payment);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Driver Routes
// router.post("/driver/save", async (req, res) => {
//   try {
//     const driver = new Driver(req.body);
//     await driver.save();
//     res.status(201).send(driver);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Admin Routes
// router.post("/admin/save", async (req, res) => {
//   try {
//     const admin = new Admin(req.body);
//     await admin.save();
//     res.status(201).send(admin);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// // Inquiry Routes
// router.post("/inquiry/save", async (req, res) => {
//   try {
//     const inquiry = new Inquiry(req.body);
//     await inquiry.save();
//     res.status(201).send(inquiry);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

// router.post("/branch/save", async (req, res) => {
//   try {
//     const branch = new Branch(req.body);
//     await branch.save();
//     res.status(201).send(branch);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

module.exports = router;

// //Adding Staff
// // {
// //   "staffId": "STAFF001",
// //   "name": "Alice Johnson",
// //   "nic": "123456789V",
// //   "email": "alice.johnson@example.com",
// //   "profilePicLink": "https://example.com/alice.jpg",
// //   "joinedDate": "2023-01-01T00:00:00Z",
// //   "status": "active",
// //   "branchId": "67aab0dbdb18e325006901a5", // Reference to Branch
// //   "adminId": "67aafde715a9b3a9a1daa56b", // Reference to Admin
// //   "password": "hashedpassword123"
// // }

// //Adding Admin
// // {
// //   "adminId":"224150L",
// //   "name":"Nirmal Priyankara",
// //   "nic":"200203601188",
// //   "password":"Sehara",
// //   "profilePicLink":"link",
// //   "email":"priyankarakn@uom.lk",
// //   "contactNo":"0112637561"
// // }

// //Adding Driver

// // {
// //   "driverId": "DRIVER001",
// //   "name": "Sam Smith",
// //   "nic": "987654321V",
// //   "email": "sam.smith@example.com",
// //   "password": "hashedpassword123",
// //   "contact": ["0712345678", "0776543210"],
// //   "licenceId": "LIC001",
// //   "branchId": "67aab0dbdb18e325006901a5" // Reference to Branch
// // }

// //Adding Parcel

// //  {
// //   "parcelId": "PARCEL001",
// //   "trackingNo": "TRACK001",
// //   "qrCodeNo": "QR001",
// //   "itemType": "Electronics",
// //   "itemSize": "medium",
// //   "specialInstructions": "Handle with care",
// //   "submittingType": "pickup",
// //   "receivingType": "doorstep",
// //   "shippingMethod": "express",
// //   "latestLocation": "Colombo",
// //   "senderId": "67aaabc9f7b52d94162f792f", // Reference to Customer
// //   "receiverId": "67aaabe7f7b52d94162f7931", // Reference to Receiver
// //   "orderPlacedTime": "2023-10-01T10:00:00Z",
// //   "orderPlacedStaffId": "67ab02f1296d464c25cb886a" // Reference to Staff
// // }

// //Adding Staff

// // {
// //   "staffId": "STAFF001",
// //   "name": "Alice Johnson",
// //   "nic": "123456789V",
// //   "email": "alice.johnson@example.com",
// //   "profilePicLink": "https://example.com/alice.jpg",
// //   "joinedDate": "2023-01-01T00:00:00Z",
// //   "status": "active",
// //   "branchId": "BRANCH001", // Reference to Branch
// //   "adminId": "ADMIN001", // Reference to Admin
// //   "password": "hashedpassword123"
// // }

// // B2BShipment
// // {
// //   "shipmentId": "B2BSHIP001",
// //   "shipmentType": "B2B",
// //   "distributionBranchId": "67aab0dbdb18e325006901a5", // Reference to Branch
// //   "collectionBranchId": "67aab0dbdb18e325006901a5", // Reference to Branch
// //   "assignedStaffId": "67ab02f1296d464c25cb886a", // Reference to Staff
// //   "driverId": "67aab148db18e325006901a8" // Reference to Driver
// // }

// // To access data from referenced fields (`customerId` and `staffId` in your `inquirySchema`), you need to use **Mongoose's `populate()` method**. Here's how you can retrieve inquiries along with the referenced customer and staff details:

// // ---

// // ### 1️⃣ **Basic Query (Without Populating References)**
// // If you just fetch an inquiry, you'll get only the IDs of referenced documents:
// // ```javascript
// // const Inquiry = require("./models/Inquiry"); // Import your Inquiry model

// // async function getInquiries() {
// //   const inquiries = await Inquiry.find();
// //   console.log(inquiries);
// // }
// // getInquiries();
// // ```
// // This will return:
// // ```json
// // [
// //   {
// //     "_id": "65a1234567890abcdef12345",
// //     "inquiryId": "INQ12345",
// //     "message": "Where is my parcel?",
// //     "status": "not",
// //     "parcelTrackingNo": "TRK98765",
// //     "inquiryTime": "2024-02-10T10:00:00Z",
// //     "customerId": "65aabcdef1234567890abcde",
// //     "staffId": "65abcdef1234567890abcdef",
// //     "reply": [],
// //     "createdAt": "2024-02-10T10:05:00Z",
// //     "updatedAt": "2024-02-10T10:05:00Z"
// //   }
// // ]
// // ```
// // You can see that `customerId` and `staffId` are just **ObjectIds**.

// // ---

// // ### 2️⃣ **Fetching Data with `populate()`**
// // To get the full customer and staff details instead of just their IDs:

// // ```javascript
// // async function getInquiriesWithDetails() {
// //   const inquiries = await Inquiry.find()
// //     .populate("customerId")  // Fetch full customer details
// //     .populate("staffId");    // Fetch full staff details

// //   console.log(inquiries);
// // }
// // getInquiriesWithDetails();
// // ```
// // This will return:
// // ```json
// // [
// //   {
// //     "_id": "65a1234567890abcdef12345",
// //     "inquiryId": "INQ12345",
// //     "message": "Where is my parcel?",
// //     "status": "not",
// //     "parcelTrackingNo": "TRK98765",
// //     "inquiryTime": "2024-02-10T10:00:00Z",
// //     "customerId": {
// //       "_id": "65aabcdef1234567890abcde",
// //       "name": "John Doe",
// //       "email": "john@example.com",
// //       "phone": "1234567890"
// //     },
// //     "staffId": {
// //       "_id": "65abcdef1234567890abcdef",
// //       "name": "Jane Smith",
// //       "role": "Support Agent"
// //     },
// //     "reply": [],
// //     "createdAt": "2024-02-10T10:05:00Z",
// //     "updatedAt": "2024-02-10T10:05:00Z"
// //   }
// // ]
// // ```
// // Now you get full details instead of just IDs.

// // ---

// // ### 3️⃣ **Selecting Specific Fields from Populated References**
// // If you don’t need all fields from the referenced models, you can select specific fields:
// // ```javascript
// // async function getFilteredInquiries() {
// //   const inquiries = await Inquiry.find()
// //     .populate("customerId", "name email") // Only fetch `name` and `email` from Customer
// //     .populate("staffId", "name role");    // Only fetch `name` and `role` from Staff

// //   console.log(inquiries);
// // }
// // getFilteredInquiries();
// // ```
// // This will return:
// // ```json
// // [
// //   {
// //     "_id": "65a1234567890abcdef12345",
// //     "inquiryId": "INQ12345",
// //     "message": "Where is my parcel?",
// //     "status": "not",
// //     "parcelTrackingNo": "TRK98765",
// //     "inquiryTime": "2024-02-10T10:00:00Z",
// //     "customerId": {
// //       "name": "John Doe",
// //       "email": "john@example.com"
// //     },
// //     "staffId": {
// //       "name": "Jane Smith",
// //       "role": "Support Agent"
// //     },
// //     "reply": [],
// //     "createdAt": "2024-02-10T10:05:00Z",
// //     "updatedAt": "2024-02-10T10:05:00Z"
// //   }
// // ]
// // ```
// // Now, only the `name` and `email` fields from the `customerId` reference and the `name` and `role` fields from `staffId` are included.

// // ---

// // ### 4️⃣ **Filtering Inquiries Based on Status or Parcel Tracking Number**
// // You can filter inquiries while populating references:
// // ```javascript
// // async function getPendingInquiries() {
// //   const inquiries = await Inquiry.find({ status: "not" }) // Filter by status
// //     .populate("customerId", "name email")
// //     .populate("staffId", "name role");

// //   console.log(inquiries);
// // }
// // getPendingInquiries();
// // ```
// // Or if you want to find inquiries related to a specific parcel:
// // ```javascript
// // async function getInquiryByTrackingNo(trackingNo) {
// //   const inquiries = await Inquiry.find({ parcelTrackingNo: trackingNo })
// //     .populate("customerId", "name email")
// //     .populate("staffId", "name role");

// //   console.log(inquiries);
// // }
// // getInquiryByTrackingNo("TRK98765");
// // ```

// // ---

// // ### ✅ **Key Takeaways**
// // 1. Use `.populate("customerId")` to get full details instead of just IDs.
// // 2. Use `.populate("customerId", "name email")` to fetch only specific fields.
// // 3. Combine `.find({ condition })` with `.populate()` to filter and fetch data efficiently.

// // Let me know if you need more details! 🚀

// // Your error is caused by this line in `inquirySchema`:

// // ```js
// // parcelTrackingNo: { type: mongoose.Schema.Types.trackingNo, ref: "Parcel", required: true }
// // ```
// // ### **Issues:**
// // 1. **`mongoose.Schema.Types.trackingNo` does not exist**
// //    - Mongoose only has built-in types like `String`, `Number`, `ObjectId`, etc.
// // 2. **Incorrect use of `ref`**
// //    - `ref` should only be used with `ObjectId`, not `String`.

// // ---

// // ### **Fixed Schema**
// // #### **Option 1: Store `parcelTrackingNo` as a String (Recommended)**
// // ```js
// // const inquirySchema = new mongoose.Schema({
// //   inquiryId: { type: String, required: true, unique: true },
// //   message: { type: String, required: true },
// //   status: { type: String, enum: ["replied", "solved", "not"], required: true },
// //   parcelTrackingNo: { type: String, required: true }, // Store trackingNo as a String
// //   inquiryTime: { type: Date, required: true },
// //   customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
// //   reply: { type: [Object], required: false },
// //   staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: false },
// // }, { timestamps: true });
// // ```
// // ✅ **Why?**
// // - `parcelTrackingNo` is a `String`, just like `trackingNo` in `Parcel`.
// // - You can still query related parcels:
// //   ```js
// //   const inquiry = await Inquiry.findOne({ parcelTrackingNo: "ABC123" });
// //   const parcel = await Parcel.findOne({ trackingNo: inquiry.parcelTrackingNo });
// //   ```

// // ---

// // #### **Option 2: Reference Parcel by `_id`**
// // Modify `inquirySchema` to use `ObjectId` instead:
// // ```js
// // parcelId: { type: mongoose.Schema.Types.ObjectId, ref: "Parcel", required: true },
// // ```
// // ✅ **Pros:** Can use `.populate("parcelId")` to fetch parcel details directly.
// // ❌ **Cons:** You must store `_id` instead of `trackingNo`.

// // ---

// // #### **Final Fix**
// // Change this incorrect line:
// // ```js
// // parcelTrackingNo: { type: mongoose.Schema.Types.trackingNo, ref: "Parcel", required: true }
// // ```
// // to this:
// // ```js
// // parcelTrackingNo: { type: String, required: true }
// // ```
// // This will **stop the crash** and allow your app to run. 🚀
