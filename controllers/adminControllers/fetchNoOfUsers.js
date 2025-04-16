const Customer = require("../../models/UserModel");
const Staff = require("../../models/StaffModel");
const Admin = require("../../models/AdminModel");
const Driver = require("../../models/DriverModel");
const getCount = require("../../utils/getCount");

const fetchNoOfUsers = async (req, res) => {
    try {
        
        const userType = req.query.user; // String, e.g., "Admin"
        // Mapping string to Mongoose model
        const SchemaMap = { Customer, Staff, Admin, Driver };
        const Schema = SchemaMap[userType];

        if (!Schema) {
            return res.status(400).json({ error: "Invalid user type" });
        }

        const count = await getCount(Schema);

         // Find the earliest record and get its creation date
         const earliestUser = await Schema.findOne().sort({ createdAt: 1 }).select("createdAt");

         const since = earliestUser ? earliestUser.createdAt : null;
 
         console.log(userType, "count is", count, "since", since, "Sent to Frontend...");

        res.json({ user:userType, count:count,since:since });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = fetchNoOfUsers;
