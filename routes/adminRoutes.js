const express = require("express");
// const { Admin } = require("../models/models");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateAdmin = require("../middlewares/authMiddleware");
const getCount =require("../middlewares/getCount");
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
  ParcelAssignedToB2BShipment,
} = require("../models/models");


const fetchAllAdmin = require("../controllers/adminControllers/fetchAllAdmin");
const adminLogin = require("../controllers/adminControllers/adminLogin");
const checkAuthenticity = require("../controllers/adminControllers/checkAuthenticity");
const registerAdmin = require("../controllers/adminControllers/registerAdmin");
const adminLogout = require("../controllers/adminControllers/adminLogout");


// Server route (add this to your backend)
router.get('/status', authenticateAdmin, checkAuthenticity);


// Admin Registration

router.post("/register", authenticateAdmin,registerAdmin);

// Admin Login
router.post("/login", adminLogin);



router.post("/logout", authenticateAdmin, adminLogout);


// router.get("/dashboard", authenticateAdmin, (req, res) => {
//   res.json({ message: "Welcome to Admin Dashboard", admin: req.admin });
// });



// Admin CRUD Operations
// Get all admins
router.get("/all", authenticateAdmin,fetchAllAdmin);

//Get an admin by adminId
router.get("/:adminId", authenticateAdmin, async (req, res) => {
  try {
    const admin = findAdmin(req.params.adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin", error });
  }
});



//Update an admin by adminId
router.put("/update/:adminId", authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminId: req.params.adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    Object.assign(admin, req.body);
    const updatedAdmin = await admin.save();
    res
      .status(200)
      .json({ message: "Admin updated successfully", updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error updating admin", error });
  }
});

// Delete an admin by adminId
router.delete("/delete/:adminId", authenticateAdmin, async (req, res) => {
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

router.get("/chart/data",authenticateAdmin,async (req,res)=>{
  const orderPlacedCount=await getCount(Parcel);
  res.status(200).json({message:"Chart Data fetched successfully",orderPlacedCount: orderPlacedCount});
  console.log(orderPlacedCount);
})

module.exports = router;
