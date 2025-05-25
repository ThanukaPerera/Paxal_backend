const Admin = require("../../../../models/AdminModel");

const verifyOTPLogged = async (req, res) => {
  const email = req.admin.email;
  const otp = req.body.otp;

  console.log("Received request data:", email, otp);
  console.log("Verifying OTP....");
  console.log("One-Time-Password:", otp);
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("Admin not found");
      return res.status(404).json({ message: "Admin not found" });
    }
    console.log("Admin found:", admin.name);

    if (
      admin.resetCode !== parseInt(otp) ||
      Date.now() > admin.resetCodeExpires
    ) {
      console.log("Invalid or expired reset code");
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    console.log("OTP verified successfully");
    res
      .status(200)
      .json({ success: true, message: "Reset code verified successfully" });
  } catch (err) {
    console.error("Error verifying reset code:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = verifyOTPLogged;
