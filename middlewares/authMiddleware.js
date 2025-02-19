const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from 'Bearer <token>'
  if (!token) {
    return res.status(403).json({ message: "Access denied, no token provided" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.admin = verified; // Attach admin info to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" ,error});
  }
};      

module.exports = authenticateAdmin;
