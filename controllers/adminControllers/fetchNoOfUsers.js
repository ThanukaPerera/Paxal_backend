const Staff = require("../../models/StaffModel");
const Driver = require("../../models/DriverModel");
const Admin = require("../../models/AdminModel");
const Customer = require("../../models/userModel");
const getCount = require("../../utils/getCount");

const fetchNoOfUsers = async (req, res) => {
    try {
        
        const userType = req.query.user; // String, e.g., "Admin"
        const dateParam = req.query.date; // Optional date parameter for historical data
        
        // Mapping string to Mongoose model
        const SchemaMap = { Admin, Customer, Driver, Staff };
        const Schema = SchemaMap[userType];

        if (!Schema) {
            return res.status(400).json({ message:"Bad Request",error: "Invalid user type" });
        }

        let count;
        let condition = {};

        // If date parameter is provided, get count for users created up to that date
        if (dateParam) {
            const targetDate = new Date(dateParam);
            
            // Validate date
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ message: "Bad Request", error: "Invalid date format" });
            }
            
            // Set end of day for the target date
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            condition = { createdAt: { $lte: endOfDay } };
            count = await getCount(Schema, condition);
            
            return res.status(200).json({ 
                message: "Historical User Count Fetched Successfully",
                user: userType, 
                count: count,
                date: dateParam,
                isHistorical: true
            });
        } else {
            // Get current total count
            count = await getCount(Schema);

            // Find the earliest record and get its creation date
            const earliestUser = await Schema.findOne().sort({ createdAt: 1 }).select("createdAt");
            const since = earliestUser ? earliestUser.createdAt : null;

            return res.status(200).json({ 
                message: "User Count Fetched Successfully",
                user: userType, 
                count: count,
                since: since
            });
        }
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }

   try{
     const count = await getCount(Schema);

    // Find the earliest record and get its creation date
    const earliestUser = await Schema.findOne()
      .sort({ createdAt: 1 })
      .select("createdAt");

    const since = earliestUser ? earliestUser.createdAt : null;

    res
      .status(200)
      .json({
        message: "User Count Fetched Successfully",
        user: userType,
        count: count,
        since: since,
      });
   }
   catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = fetchNoOfUsers;
