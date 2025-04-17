const jwt = require("jsonwebtoken");
require('dotenv').config();


const authenticateAdmin = async(req, res, next) => {
  try {
    const token = req.cookies.AdminToken; // Get token from cookies
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    // const decoded=await jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    //   if (err) {
    //     return res.status(403).json({ message: "Unauthorized: Invalid token" });
    //   }
    //   req.admin = decoded; // Store admin data in request
    //   console.log(req.admin.email, "Authenticated");
    //   next();
    // });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    
    next();
  } catch (error) {
    console.log("Authorization error",error);
    return res.status(403).json({ message: "Forbidden/Unauthorized: Invalid token" });
  }
};






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

module.exports = {
  authenticateAdmin,
  authenticateStaff,
};
