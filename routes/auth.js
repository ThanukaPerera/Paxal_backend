  const express = require("express");
  const { Admin } = require("../models/models");
  const router = express.Router();
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");

  // async function verifyPassword(plainTextPassword, storedHash) {
  //   const isMatch = await bcrypt.compare(plainTextPassword, storedHash);
  //   return isMatch;
  // }

  router.post("/register", async (req, res) => {
    try {
      // Find last admin ID and generate the next one
      const lastAdmin = await Admin.findOne().sort({ adminId: -1 }).lean();
      let nextAdminId = "ADMIN001"; // Default ID if no admins exist

      if (lastAdmin) {
        const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADMIN", ""), 10);
        nextAdminId = `ADMIN${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // Create new admin with the generated ID
      const adminData = { ...req.body, adminId: nextAdminId, password: hashedPassword, };
      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();
      res.status(201).json({ message: "Admin registered", savedAdmin });
      console.log(req.body);
    } catch (error) {
      res.status(500).json({ message: "Error registering admin", error });
    }
  });

  // const AdminData = await Admin.findOne();
  // const fetchedPassword = AdminData.password;

  // const match = await verifyPassword("Dilakshana1@", fetchedPassword);
  // if (match) {
  //   console.log("Password matched");
  // } else {
  //   console.log("Password unmatched");
  // }

  // Admin Login
  router.post("/login", async (req, res) => {
    try {
      
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email });

      if (!admin) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { adminId: admin.adminId, email: admin.email },
        process.env.JWT_SECRET || "your_secret_key", // Use a strong secret in production
        { expiresIn: "20s" }
      );

      res.status(200).json({ message: "Login successful", token });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error });
    }
  });

  const authenticateAdmin = require("../middlewares/authMiddleware");

  router.get("/dashboard", authenticateAdmin, (req, res) => {
    res.json({ message: "Welcome to Admin Dashboard", admin: req.admin });
  });






  // Admin CRUD Operations
// Get all admins
router.get("/all", async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ message: "Admins fetched successfully", admins });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins", error });
  }
});

//Get an admin by adminId
router.get("/:adminId", async (req, res) => {
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
router.post("/save", async (req, res) => {
  try {
    const admin = new Admin(req.body);
    const savedAdmin = await admin.save();
    res.status(201).json({ message: "Admin saved successfully", savedAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error saving admin", error });
  }
});

//Update an admin by adminId
router.put("/update/:adminId", async (req, res) => {
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
router.delete("/delete/:adminId", async (req, res) => {
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
