  const  Parcel  = require("../../../models/parcelModel");

  // Define stage groups
  const stageGroups = {
    "Initial Stage": ["OrderPlaced", "PendingPickup"],
    "In Transit": ["PickedUp", "ArrivedAtDistributionCenter", "ShipmentAssigned", "InTransit"],
    "At Collection Center": ["ArrivedAtCollectionCenter", "DeliveryDispatched"],
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
