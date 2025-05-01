const jwt = require("jsonwebtoken");

const authenticateMobileJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.MOBILE_JWT_SECRET); // Verify token
    req.user = decoded; // Attach decoded payload to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authenticateMobileJWT;
