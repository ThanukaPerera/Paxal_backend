const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate both admin and staff users
 * This allows both admin and staff to access the same routes
 */
const authenticateAdminOrStaff = (req, res, next) => {
  try {
    // Check for admin token first
    const adminToken = req.cookies.AdminToken;
    const staffToken = req.cookies.StaffToken;
    
    if (adminToken) {
      // Try to verify admin token
      try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
        req.admin = decoded;
        req.userType = 'Admin';
        return next();
      } catch (err) {
        // Admin token invalid, continue to check staff token
      }
    }
    
    if (staffToken) {
      // Try to verify staff token
      try {
        const decoded = jwt.verify(staffToken, process.env.JWT_SECRET);
        req.staff = decoded;
        req.userType = 'Staff';
        return next();
      } catch (err) {
        // Staff token invalid
      }
    }
    
    // No valid token found
    return res.status(401).json({ 
      code: 'ACCESS_TOKEN_MISSING',
      message: 'Authentication required' 
    });
    
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

module.exports = {
  authenticateAdminOrStaff
};
