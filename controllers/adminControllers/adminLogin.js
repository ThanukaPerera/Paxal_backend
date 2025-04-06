const {Admin}=require("../../models/models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminLogin =async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find admin by email
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ message: "Invalid email, Admin not Found" });
      }
      
      // Compare password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password"  });
      }
      // Generate JWT Token
      const token = jwt.sign(
        { _id:admin._id,adminId: admin.adminId, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }); // Use a strong secret in production
      res.cookie("AdminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 60 * 60 * 1000,
      });
      res.status(200).json({ message: "Login successful",admin: { name: admin.name, email: admin.email }});
      console.log(admin.adminId,admin.name,"Login Successfully");
    } catch (error) {
      console.error("Login error:", error); // Log for debugging
      res.status(500).json({ message: "Something went wrong. Try again later." });
    }
  };

  module.exports=adminLogin;

