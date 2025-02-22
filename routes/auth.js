  const express = require("express");
  const { Admin } = require("../models/models");
  const router = express.Router();
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const authenticateAdmin = require("../middlewares/authMiddleware");

 

  router.post("/register",authenticateAdmin, async (req, res) => {
    try {
      // Find last admin ID and generate the next one
      const lastAdmin = await Admin.findOne().sort({ adminId: -1 }).lean();
      let nextAdminId = "ADMIN001"; // Default ID if no admins exist

      if (lastAdmin) {
        const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADMIN", ""), 10);
        nextAdminId = `ADMIN${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 12);

      // Create new admin with the generated ID
      const adminData = { ...req.body, adminId: nextAdminId, password: hashedPassword, };
      const admin = new Admin(adminData);
      console.log("Admin registered",adminData);
      const savedAdmin = await admin.save();
      res.status(201).json({ message: "Admin registered", savedAdmin });
    } catch (error) {
      res.status(500).json({ message: "Error registering admin", error });
    }
  });


  // Admin Login
  router.post("/login", async (req, res) => {
    console.log("");
    try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email });

      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT Token
      const token = jwt.sign({ adminId: admin.adminId, email: admin.email },process.env.JWT_SECRET, { expiresIn: "1h" });// Use a strong secret in production
      res.cookie("AdminToken",token,{httpOnly:true,secure:process.env.NODE_ENV ==="production",sameSite:"Strict",maxAge:60*60*1000});
      res.status(200).json({ message: "Login successful"});
    } catch (error) {
      console.error("Login error:", error); // Log for debugging
      res.status(500).json({ message: "Something went wrong. Try again later." });
    }
  });

  router.post("/logout",authenticateAdmin,(req,res)=>{
      res.clearCookie("AdminToken");
      res.status(200).json({message:"Logged out Successfully"});
  });

  

  router.get("/dashboard", authenticateAdmin, (req, res) => {
    res.json({ message: "Welcome to Admin Dashboard", admin: req.admin });
  });






  // Admin CRUD Operations
// Get all admins
router.get("/all", authenticateAdmin,async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ message: "Admins fetched successfully", admins });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins", error });
  }
});

//Get an admin by adminId
router.get("/:adminId",authenticateAdmin, async (req, res) => {
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

// //Add a new admin
// router.post("/save",authenticateAdmin, async (req, res) => {
//   try {
//     const admin = new Admin(req.body);
//     const savedAdmin = await admin.save();
//     res.status(201).json({ message: "Admin saved successfully", savedAdmin });
//   } catch (error) {
//     res.status(500).json({ message: "Error saving admin", error });
//   }
// });

//Update an admin by adminId
router.put("/update/:adminId",authenticateAdmin, async (req, res) => {
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
router.delete("/delete/:adminId",authenticateAdmin, async (req, res) => {
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




  module.exports = router;
