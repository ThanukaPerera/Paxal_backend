const jwt = require("jsonwebtoken");

require('dotenv').config();


const authenticateStaff = async(req, res, next) => {
  try {
    const token = req.cookies.StaffToken; // Get token from cookies
    console.log(token)
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded =  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Unauthorized: Invalid token" });
      }
      
      req.staff = decoded; // Store staff data in request
      
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Authentication error", error });
  }
};

module.exports = authenticateStaff;