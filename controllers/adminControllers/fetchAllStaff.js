const { Staff } = require("../../models/models");

const fetchAllStaff = async (req, res) => {
  console.log("Staff");
  try {
    const staffs = await Staff.find()
      .select("-password -staffId -__v -updatedAt")
      .populate("branchId", "-branchId -__v")
      .populate(
        "adminId",
        "-adminId -password -email -contactNo -createdAt -profilePicLink -__v -updatedAt -nic"
      )
      .exec();
    const filteredData = staffs.map((staff) => ({
      _id: staff._id,
      name: staff.name,
      nic: staff.nic,
      email: staff.email,
      contactNo: staff.contactNo,
      status:staff.status,
      branchId: staff.branchId?._id,
      branchLocation: staff.branchId?.location,
      branchContactNo: staff.branchId?.contact, // Extracting location from branchId
      adminId: staff.adminId?._id, // Extracting adminId only
      adminName: staff.adminId?.name, // Extracting admin name
      createdAt: staff.createdAt,
    }));
    const userData = filteredData;
    console.log(userData);
    res.status(200).json({ message: "Staff fetched successfully", userData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error });
  }
};

module.exports = fetchAllStaff;
