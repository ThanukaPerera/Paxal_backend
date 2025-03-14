// const { Parcel } = require("../../models/models");

// const fetchChartData = async (req, res) => {
//   try {
//     const parcelStages = [
//       "OrderPlaced",
//       "PendingPickup",
//       "PickedUp",
//       "ArrivedAtDistributionCentre",
//       "ShipmentAssigned",
//       "InTransit",
//       "ArrivedAtCollectionCentre",
//       "DeliveryDispatched",
//       "Delivered",
//       "NotAccepted",
//       "WrongAddress",
//       "Return"
//     ];

//     // Aggregate to count parcels in each stage
//     const stageCounts = await Parcel.aggregate([
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     // Convert result into an object with default values
//     const result = parcelStages.reduce((acc, stage) => {
//       acc[stage] = 0; // Default value if not found
//       return acc;
//     }, {});

//     // Map the counts to the result object
//     stageCounts.forEach(({ _id, count }) => {
//       result[_id] = count;
//     });

//     res.status(200).json({ message: "Chart Data fetched successfully", stageCounts: result });
//   } catch (error) {
//     console.error("Error fetching chart data:", error);
//     res.status(500).json({ message: "Error fetching chart data", error: error.message });
//   }
// };

// module.exports = fetchChartData;


const { Parcel } = require("../../models/models");

const parcelStages = [
  "OrderPlaced",
  "PendingPickup",
  "PickedUp",
  "ArrivedAtDistributionCentre",
  "ShipmentAssigned",
  "InTransit",
  "ArrivedAtCollectionCentre",
  "DeliveryDispatched",
  "Delivered",
  "NotAccepted",
  "WrongAddress",
  "Return"
];

// Function to retrieve parcel count for each status
const getParcelCountByStatus = async (req, res) => {
  try {
    // Get count of parcels for each status
    const counts = await Parcel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Convert to chartData format
    const chartData = parcelStages.map((status, index) => {
      const statusData = counts.find((item) => item._id === status);
      return {
        status, 
        count: statusData ? statusData.count : 0,
        
      };
    });

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching parcel count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports =  getParcelCountByStatus ;
