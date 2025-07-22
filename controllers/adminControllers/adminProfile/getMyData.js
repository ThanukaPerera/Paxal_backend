const Admin = require("../../../models/AdminModel");

const getMyData = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const myData = await Admin.findById(adminId)
      .select("-password -adminId -__v -updatedAt")
      .exec();
    res
      .status(200)
      .json({
        status: "success",
        message: "Profile Data fetched successfully",
        myData,
      });
  } catch (error) {
    res
      .status(500)
      .json({ status: "failed", message: "Cannot fetch profile data", error });
  }
};

module.exports = getMyData;
