const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate admin users via access token
 */
const authenticateAdmin = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.AdminToken;
    
    if (!token) {
      return res.status(401).json({ 
        code: 'ACCESS_TOKEN_MISSING',
        message: 'Authentication required' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach admin data to request for use in route handlers
    req.admin = decoded;
    
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired' 
      });
    }
    
    return res.status(401).json({ 
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token' 
    });
  }
};
const authenticateStaff = async(req, res, next) => {
  try {
    const token = req.cookies.StaffToken; // Get token from cookies
   
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded =  jwt.verify(token, process.env.JWT_SECRET);
      req.staff = decoded; // Store staff data in request
      
      next();
    ;
  } catch (error) {
    res.status(500).json({ message: "Authentication error", error });
  }
};

module.exports = {
  authenticateAdmin,
  authenticateStaff,
};








// const jwt = require("jsonwebtoken");
// require('dotenv').config();


// const authenticateAdmin = async(req, res, next) => {
//   try {
//     const token = req.cookies.AdminToken; // Get token from cookies
//     if (!token) {
//       return res.status(401).json({ message: "No token provided" });
//     }
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     req.admin = decoded;
    
//     next();
//   } catch (err) {
//     if (err.name === "TokenExpiredError") {
//       console.log("Token expired");
//       return res.status(403).json({ message: "Token expired",code: "TOKEN_EXPIRED" });
//     }

//     return res.status(403).json({ message: "Invalid token",code: "INVALID_TOKEN" });
    
//   }
// };






// const authenticateStaff = async(req, res, next) => {
//   try {
//     const token = req.cookies.StaffToken; // Get token from cookies
//     console.log(token)
//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized: No token provided" });
//     }

//     // Verify token
//     const decoded =  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//       if (err) {
//         return res.status(403).json({ message: "Unauthorized: Invalid token" });
//       }
      
//       req.staff = decoded; // Store staff data in request
      
//       next();
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Authentication error", error });
//   }
// };

// module.exports = {
//   authenticateAdmin,
//   authenticateStaff,
// };
