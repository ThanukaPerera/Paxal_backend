const Staff =require("../../../../../models/StaffModel");
const mongoose = require("mongoose");

const fetchStaffById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid staff ID" });
    }

    try {
        const staff = await Staff.findById({_id:id}).select("-password -__v").populate("branchId" ,"location").populate("adminId" ,"name").lean().exec();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }
        res.status(200).json(staff);
    } catch (error) {
        console.error("Error fetching staff by ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = fetchStaffById;
