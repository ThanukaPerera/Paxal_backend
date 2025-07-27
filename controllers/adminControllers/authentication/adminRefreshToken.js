const jwt=require('jsonwebtoken');
// Constants for token configuration
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes in milliseconds


/**
 * Refreshes the admin's access token using a valid refresh token
 */
const adminRefreshToken = (req, res) => {
  const refreshToken = req.cookies.AdminRefreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ 
      code: 'REFRESH_TOKEN_MISSING',
      message: 'No refresh token provided' 
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Generate new access token with standard claims
    const newAccessToken = jwt.sign(
      { 
        _id: decoded._id, 
        adminId: decoded.adminId, 
        email: decoded.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  
    // Get expiration timestamp for client-side refresh scheduling
    const decodedAccessToken = jwt.decode(newAccessToken);
    const expiresAt = decodedAccessToken.exp * 1000; // Convert to milliseconds
   
  
    // Set the new access token as a cookie with consistent settings
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.cookie('AdminToken', newAccessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE
    });
    console.log("Token refreshed")
    return res.status(200).json({ 
      message: 'Token refreshed successfully',
      expiresAt 
    });
  
  } catch (err) {
    console.error("Refresh token error:", err.message);
    
    // Clear both cookies on error
    res.clearCookie('AdminToken');
    res.clearCookie('AdminRefreshToken');
    
    return res.status(403).json({
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid or expired refresh token'
    });
  }
};


module.exports = { adminRefreshToken };



// const adminRefreshToken = (req, res) => {
  
//   const refreshToken = req.cookies.AdminRefreshToken;
//   if (!refreshToken) {
//     return res.status(401).json({ 
//       code: 'REFRESH_TOKEN_MISSING',
//       message: 'No refresh token provided' 
//     });
//   }

//   try {
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     console.log(decoded)
//     const newAccessToken = jwt.sign(
//       { _id: decoded._id, adminId: decoded.adminId, email: decoded.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '15m' }
//     );
  
//     // Decode new access token to get expiration time
//     const decodedAccessToken = jwt.decode(newAccessToken);
//     const expiresAt = decodedAccessToken.exp * 1000;
  
//     console.log("Token refreshed!", expiresAt);
  
//     res.cookie('AdminToken', newAccessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 15 * 60 * 1000
//     });
  
//     res.status(200).json({ 
//       message: 'Token refreshed',
//       expiresAt 
//     });
  
//   } catch (err) {
//     console.error(err);
//     res.status(403).json({
//       code: 'INVALID_REFRESH_TOKEN',
//       message: 'Invalid refresh token'
//     });
//   }
  
//   console.log("Token refreshed!");
// };
 
// module.exports = { adminRefreshToken };
 
 
 
//  // // In your authController.js
//   // const adminRefreshToken = (req, res) => {

  
//   //     const refreshToken = req.cookies.AdminRefreshToken;
//   //     if (!refreshToken) {
//   //       return res.status(401).json({ message: 'No refresh token provided' });
//   //     }

//   //   //Verify refresh token
//   //     jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
//   //       if (err) {
//   //         return res.status(403).json({ message: 'Invalid refresh token' });
//   //       }
//   //       //Refresh admin token
//   //       const newAccessToken = jwt.sign(
//   //         { _id: decoded._id, adminId: decoded.adminId, email: decoded.email },
//   //         process.env.JWT_SECRET,
//   //         { expiresIn: '15m' }
//   //       );
    
//   //       res.cookie('AdminToken', newAccessToken, {
//   //         httpOnly: true,
//   //         secure: true,
//   //         sameSite: 'strict',
//   //         maxAge: 15 * 60 * 1000 // 15 minutes
//   //       });
    
//   //       res.status(200).json({ message: 'Token refreshed', expiresAt: decoded.exp * 1000 });
//   //     });
//   //   };
    
    // module.exports = { adminRefreshToken };