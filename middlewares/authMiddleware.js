const jwt = require("jsonwebtoken");

const authenticateAdmin = async(req, res, next) => {
  try {
    const token = req.cookies.AdminToken; // Get token from cookies
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded=await jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Unauthorized: Invalid token" });
      }
      req.admin = decoded; // Store admin data in request
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Authentication error", error });
  }
};

module.exports = authenticateAdmin;
