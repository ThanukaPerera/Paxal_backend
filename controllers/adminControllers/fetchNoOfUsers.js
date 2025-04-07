const { Admin, Customer, Driver, Staff } = require("../../models/models");
const getCount = require("../../utils/getCount");

const fetchNoOfUsers = async (req, res) => {
    try {
        
        const userType = req.query.user; // String, e.g., "Admin"
        // Mapping string to Mongoose model
        const SchemaMap = { Admin, Customer, Driver, Staff };
        const Schema = SchemaMap[userType];

        if (!Schema) {
            return res.status(400).json({ message:"Bad Request",error: "Invalid user type" });
        }

        const count = await getCount(Schema);

         // Find the earliest record and get its creation date
         const earliestUser = await Schema.findOne().sort({ createdAt: 1 }).select("createdAt");

         const since = earliestUser ? earliestUser.createdAt : null;
 
         

        res.status(200).json({ message:"User Count Fetched Successfully",user:userType, count:count,since:since });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = fetchNoOfUsers;
