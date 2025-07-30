  const  Parcel  = require("../../../models/parcelModel");
const mongoose = require("mongoose");

  // Define stage groups
  const stageGroups = {
    "Initial Stage": ["OrderPlaced", "PendingPickup"],
    "In Transit": ["PickedUp", "ArrivedAtDistributionCenter", "ShipmentAssigned", "InTransit"],
    "At Collection Center": ["ArrivedAtCollectionCenter", "DeliveryDispatched"],
    "Delivery Conclusion": ["Delivered","NotAccepted", "WrongAddress", "Return"]
  };

  const getParcelCountByGroup = async (req, res) => {
    try {
      // Extract query parameters for filtering
      const { startDate, endDate, branchId } = req.query;
      console.log("Query Parameters:", { startDate, endDate, branchId });

      // Build match criteria
      const matchCriteria = {};

      // Add date range filter if provided
      if (startDate || endDate) {
        matchCriteria.createdAt = {};
        if (startDate) {
          matchCriteria.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          // Add one day to endDate to include the entire end date
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          matchCriteria.createdAt.$lte = endDateTime;
        }
      }

      // Add branch filter if provided and not 'all'
      if (branchId && branchId !== 'all') {
        try {
          // Convert branchId to ObjectId if it's a valid ObjectId string
          const branchObjectId = new mongoose.Types.ObjectId(branchId);
          // Filter by parcels that originate from the selected branch
          matchCriteria.from = branchObjectId;
        } catch (error) {
          console.warn("Invalid branchId format:", branchId);
          // If branchId is not a valid ObjectId, try direct string comparison
          matchCriteria.from = branchId;
        }
      }

      // Build aggregation pipeline
      const pipeline = [];
      
      // Add match stage if there are criteria
      if (Object.keys(matchCriteria).length > 0) {
        pipeline.push({ $match: matchCriteria });
      }

      // Add group stage
      pipeline.push({ $group: { _id: "$status", count: { $sum: 1 } } });

      // Aggregate parcel counts for each status
      const counts = await Parcel.aggregate(pipeline);

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
