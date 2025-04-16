const  Staff  = require("../../models/StaffModel");
const bcrypt = require("bcryptjs");
const findAdminFunction = require("../../utils/findAdminFunction");

const registerStaff = async (req, res) => {
    try {
        const adminId = req.admin?.adminId;
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        const response = await findAdminFunction(adminId);
        if (!response || !response._id) {
            return res.status(400).json({ message: "Admin not found" });
        }

        console.log("Admin response", response._id);
        const adminName = response.name;
        

        // Find last staff ID and generate the next one
        const lastStaff = await Staff.findOne().sort({ staffId: -1 }).lean();
        let nextStaffId = "STAFF001";

        if (lastStaff) {
            const lastIdNumber = parseInt(lastStaff.staffId.replace("STAFF", ""), 10);
            nextStaffId = `STAFF${String(lastIdNumber + 1).padStart(3, "0")}`;
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(req.body.password, 12);

        
        const status = 'active';

        // Create new staff with generated ID and status
        const staffData = {
            ...req.body,
            staffId: nextStaffId,
            password: hashedPassword,
            adminId: response._id, // Ensure the correct admin ObjectId is assigned
            status, // Adding the status field
        };

        const staff = new Staff(staffData);
        const savedStaff = await staff.save();
        console.log(adminId, adminName, "Registered Staff", staffData);
        res.status(201).json({ message: "Staff registered successfully", savedStaff });
    } catch (error) {
        console.error("Staff registration error:", error);
        res.status(500).json({ message: "Error registering staff", error });
    }
};

module.exports = registerStaff;
