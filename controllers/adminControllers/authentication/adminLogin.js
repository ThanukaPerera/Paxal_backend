const Admin = require("../../../models/AdminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "1d"; // 7 days
const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email, Admin not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Generate tokens with consistent expiration times
    const accessToken = jwt.sign(
      {
        _id: admin._id,
        adminId: admin.adminId,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        _id: admin._id,
        adminId: admin.adminId,
        email: admin.email,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Set cookies with appropriate security settings
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
    };

    res.cookie("AdminToken", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });

    res.cookie("AdminRefreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    // Decode token to get expiration time for client
    const decodedAccessToken = jwt.decode(accessToken);
    const expiresAt = decodedAccessToken.exp * 1000;

    return res.status(200).json({
      message: "Login successful",
      admin: { name: admin.name, email: admin.email },
      expiresAt,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
  }
};

module.exports = adminLogin;

// const Admin = require("../../models/AdminModel");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({
//         // 400 - Bad Request: Missing required fields
//         message: "Email and password are required",
//       });
//     }
//     // Find admin by email
//     const admin = await Admin.findOne({ email });

//     if (!admin) {
//       return res
//         .status(401)
//         .json({ message: "Invalid email, Admin not Found" }); // 401 - Unauthorized: Admin not found
//     }

//     // Compare password
//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid password" });
//     }
//     try {
//       // When admin logs in successfully
//         // Generate JWT Token
//       const accessToken = jwt.sign({ _id: admin._id,adminId: admin.adminId,email: admin.email, }, process.env.JWT_SECRET, { expiresIn: '15s' });
//       const refreshToken = jwt.sign({ _id: admin._id, adminId: admin.adminId, email: admin.email, }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

//       res.cookie('AdminToken', accessToken, {
//         httpOnly: true,
//         secure: true,
//         sameSite: 'strict',
//         maxAge: 15 * 60 * 1000
//       });
//       res.cookie('AdminRefreshToken', refreshToken, {
//         httpOnly: true,
//         secure: true,
//         sameSite: 'strict',
//         maxAge: 7 * 24 * 60 * 60 * 1000
//       });
//       res.status(200).json({
//         message: "Login successful",
//         admin: { name: admin.name, email: admin.email },
//       });
//       console.log(admin.adminId, admin.name, "Login Successfully",req.ip);
//     } catch (jwtError) {
//       console.error("JWT Error:", jwtError);
//       return res.status(500).json({
//         message: "Authentication system error",
//       });
//     }
//   } catch (error) {
//     console.error("Login error:", error); // Log for debugging
//     res
//       .status(500)
//       .json({ message: "Internal server error. Please try again later." });
//   }
// };

// module.exports = adminLogin;
