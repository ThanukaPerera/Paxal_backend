const Parcel = require("../../../models/parcelModel");
const VehicleSchedule = require('../../../models/VehicleScheduleModel'); 

const fetchOrderPlacedTime = async (parcelId) => {
  const parcel = await Parcel.findOne({ parcelId })
    .select("createdAt from submittingType")
    .populate("from", "location")
    .lean()
    .exec();

  if (!parcel) {
    return null;
  }

  const handledBy =
    parcel?.submittingType === "pickup" ? "User (Pickup)" : "Branch";
  const note = "-";

  return {
    status: "order placed",
    time: parcel?.createdAt,
    location: parcel?.from?.location,
    handledBy,
    note,
  };
};

const findSchedulesWithParcel = async (parcelId) => {
  const parcelObj = await Parcel.findOne({ parcelId }).select("_id").lean();
  
  if (!parcelObj) return [];

  const schedules = await VehicleSchedule.find({
    assignedParcels: parcelObj._id
  })
  .populate('vehicle', 'vehicleNumber') 
    .lean();
  return schedules;
};


const trackStatuses = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;
    




    const orderPlacedDetails = await fetchOrderPlacedTime(parcelId);
    const pendingPickupDetails = await findSchedulesWithParcel(parcelId);

    console.log(pendingPickupDetails)

    if (!orderPlacedDetails) {
      return res
        .status(404)
        .json({ status: "error", message: "Parcel not found" });
    }

    const timeData = [orderPlacedDetails];

    res.status(200).json({ status: "success", timeData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = trackStatuses;

// Parcel = require('../../../models/parcelModel');

// fetchOrderPlacedTime=async(parcelId)=>{

//         const parcel = await Parcel.findOne({ parcelId: parcelId }).select("createdAt from submittingType").populate("from","location").lean().exec();

//         if (!parcel) {
//             return res.status(404).json({ status: "error", message: "Parcel not found" });
//         }
//         const handledBy = parcel?.submittingType === 'pickup' ? 'User (Pickup)' : 'Branch';
//         const note='-'
//         return {
//                 status:"order placed",
//                 time:parcel?.createdAt,
//                 location:parcel?.from?.location,
//                 handledBy,
//                 note
//             }
// }

// const trackStatuses =  async(req, res) => {
//     try {
//         const parcelId = req.params.parcelId;

//         const orderPlacedDetails = await fetchOrderPlacedTime(parcelId);

//         const timeData = [
//             orderPlacedDetails
//         ];

//         res.status(200).json({ status: "success", timeData });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ status: "error", message: "Server error" });
//     }
// };

// module.exports = trackStatuses;
