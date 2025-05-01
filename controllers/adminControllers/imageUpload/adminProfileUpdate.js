// middleware/adminProfileUpdate.js
const Admin = require("../../../models/AdminModel");

const adminProfileUpdate = async (req, res, next) => {
  try {
    const { public_id, userId } = req.uploadData;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      userId,
      { profilePicLink: public_id },
      { new: true, runValidators: true },
    );

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    console.log("Profile picture updated successfully");
    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicLink: updatedAdmin.profilePicLink,
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Database update error:", error);
    // next({
    //   status: 500,
    //   message: "Failed to update profile",
    //   error: error.message,
    // });
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

module.exports = adminProfileUpdate;
