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


// const { Parcel } = require("../../models/models");

// const parcelStages = [
//   "OrderPlaced",
//   "PendingPickup",
//   "PickedUp",
//   "ArrivedAtDistributionCentre",
//   "ShipmentAssigned",
//   "InTransit",
//   "ArrivedAtCollectionCentre",
//   "DeliveryDispatched",
//   "Delivered",
//   "NotAccepted",
//   "WrongAddress",
//   "Return"
// ];

// // Function to retrieve parcel count for each status
// const getParcelCountByStatus = async (req, res) => {
//   try {
//     // Get count of parcels for each status
//     const counts = await Parcel.aggregate([
//       { $group: { _id: "$status", count: { $sum: 1 } } }
//     ]);

//     // Convert to chartData format
//     const chartData = parcelStages.map((status, index) => {
//       const statusData = counts.find((item) => item._id === status);
//       return {
//         status, 
//         count: statusData ? statusData.count : 0,
//         percentage:
        
//       };
//     });

//     res.status(200).json(chartData);
//   } catch (error) {
//     console.error("Error fetching parcel count:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// module.exports =  getParcelCountByStatus ;


  // const { Parcel } = require("../../models/models");

  // const parcelStages = [
  //   "OrderPlaced",
  //   "PendingPickup",
  //   "PickedUp",
  //   "ArrivedAtDistributionCentre",
  //   "ShipmentAssigned",
  //   "InTransit",
  //   "ArrivedAtCollectionCentre",
  //   "DeliveryDispatched",
  //   "Delivered",
  //   "NotAccepted",
  //   "WrongAddress",
  //   "Return"
  // ];

  // const getParcelCountByStatus = async (req, res) => {
  //   try {
  //     // Aggregate parcel counts for each status
  //     const counts = await Parcel.aggregate([
  //       { $group: { _id: "$status", count: { $sum: 1 } } }
  //     ]);

  //     // Calculate total parcel count
  //     const totalParcels = counts.reduce((sum, item) => sum + item.count, 0);

  //     // Convert to chartData format with percentage calculation
  //     const chartData = parcelStages.map((status) => {
  //       const statusData = counts.find((item) => item._id === status);
  //       const count = statusData ? statusData.count : 0;
  //       const percentage = totalParcels > 0 ? ((count / totalParcels) * 100).toFixed(2) : 0;

  //       return {
  //         status,
  //         count,
  //         percentage: parseFloat(percentage) // Convert to number
  //       };
  //     });

  //     res.status(200).json(chartData);
  //   } catch (error) {
  //     console.error("Error fetching parcel count:", error);
  //     res.status(500).json({ error: "Internal Server Error" });
  //   }
  // };

  // module.exports = getParcelCountByStatus;

  const { Parcel } = require("../../models/models");

  // Define stage groups
  const stageGroups = {
    "Initial Stage": ["OrderPlaced", "PendingPickup"],
    "In Transit": ["PickedUp", "ArrivedAtDistributionCentre", "ShipmentAssigned", "InTransit"],
    "At Collection Center": ["ArrivedAtCollectionCentre", "DeliveryDispatched"],
    "Issues": ["Delivered","NotAccepted", "WrongAddress", "Return"]
  };

  const getParcelCountByGroup = async (req, res) => {
    try {
      // Aggregate parcel counts for each status
      const counts = await Parcel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      // Calculate total parcel count
      const totalParcels = counts.reduce((sum, item) => sum + item.count, 0);

      // Initialize groupCounts
      const groupCounts = {};

      // Assign default values to each group
      Object.keys(stageGroups).forEach((group) => {
        groupCounts[group] = {
          totalCount: 0,
          percentage: 0,
          subStages: []
        };
      });

      // Map statuses to groups
      counts.forEach(({ _id, count }) => {
        for (const [group, statuses] of Object.entries(stageGroups)) {
          if (statuses.includes(_id)) {
            groupCounts[group].totalCount += count;
            groupCounts[group].subStages.push({
              status: _id,
              count,
              percentage: totalParcels > 0 ? ((count / totalParcels) * 100).toFixed(2) : 0
            });
            break; // Stop after finding the group
          }
        }
      });

      // Calculate percentage for each group
      Object.keys(groupCounts).forEach((group) => {
        groupCounts[group].percentage = totalParcels > 0 
          ? ((groupCounts[group].totalCount / totalParcels) * 100).toFixed(2) 
          : 0;
      });

      // Convert object to array
      const chartData = Object.entries(groupCounts).map(([group, data]) => ({
        group,
        totalCount: data.totalCount,
        // percentage: parseFloat(data.percentage),
        percentage: parseFloat(data.percentage),
        subStages: data.subStages
      }));

      res.status(200).json(chartData);
    } catch (error) {
      console.error("Error fetching parcel count:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  module.exports = getParcelCountByGroup;
