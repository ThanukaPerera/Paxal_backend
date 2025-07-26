// const  Parcel  = require("../../../models/parcelModel");

// const barChart = async (req, res) => {
//     try {
//         const parcels = await Parcel.find();
//         console.log("Fetched parcels for bar chart:", parcels.length);

//         const chartData = Object.values(
//             parcels.reduce((acc, parcel) => {
//                 if (!parcel.createdAt) return acc; // Skip if createdAt is missing
//                 const date = new Date(parcel.createdAt).toISOString().split("T")[0]; // Convert to YYYY-MM-DD

//                 if (!acc[date]) {
//                     acc[date] = { date, parcelCount: 0 };
//                 }

//                 acc[date].parcelCount += 1; // Count parcels for each date

//                 return acc;
//             }, {})
//         ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort in ascending order

        
//         console.log(chartData)
//         res.status(200).json({status:"success",message:"Chart data fetched successfully",chartData});
//     } catch (error) {
//         console.error("Error fetching bar chart data:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

// module.exports = barChart;

const Parcel = require("../../../models/parcelModel");
const { toZonedTime, format } = require("date-fns-tz");
const { convertUTCToColomboTime } = require("../../../utils/admin/convertUTCToColomboTime");

const barChart = async (req, res) => {
  try {
    const parcels = await Parcel.find();
    console.log("Fetched parcels for bar chart:", parcels.length);

    const chartData = Object.values(
      parcels.reduce((acc, parcel) => {
        if (!parcel.createdAt) return acc;

        // Convert UTC date to Colombo time and format as YYYY-MM-DD
        const dateKey = convertUTCToColomboTime(parcel.createdAt, "yyyy-MM-dd");

        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, parcelCount: 0 };
        }

        acc[dateKey].parcelCount += 1;
        return acc;
      }, {})
    ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

    console.log(chartData);

    res.status(200).json({
      status: "success",
      message: "Chart data fetched successfully",
      chartData,
    });
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = barChart;