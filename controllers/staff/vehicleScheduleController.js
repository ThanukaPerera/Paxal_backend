const VehicleSchedule = require("../../models/VehicleScheduleModel");
const Parcel = require("../../models/ParcelModel");
const Vehicle = require("../../models/vehicleModel");
const getParcelProperties = require("../../utils/parcelDetails");

// GET ALL PICKUP SCHEDULES FOR THE GIVEN DAY
const getAllPickupSchedulesForDate = async (req, res) => {
  try {
   
    const { pickupDate, pickupTime } = req.query;
    console.log(pickupDate, pickupTime);
    const schedules = await VehicleSchedule.find({
      scheduleDate: new Date(pickupDate),
      timeSlot: pickupTime,
      type: "pickup",
    }).populate("vehicle")
    .populate({
        path: 'assignedParcels',
        select: 'pickupInformation', 
    });

    const schedulesData = schedules.map( (schedule) => {
        const parcelCount = schedule.assignedParcels.length;

        //Get unique pickup cities
        const pickupCities = schedule.assignedParcels
        .map((parcel) => parcel?.pickupInformation?.city)
        .filter(Boolean);

        const uniqueCities = [...new Set(pickupCities)];

        const vehicleId = schedule.vehicle
        
      return {
        vehicleId,
        parcelCount,
        pickupCities: uniqueCities,
      };
    })
    console.log(schedulesData)
    res.json(schedulesData);
  } catch (error) {
    res.status(500).json({ message: "Error getting vehicle schedules", error });
  }
};

// ASSIGN PARCEL TO AND EXSITING PICKUP
const assignparcelToExsistingPickup = async (req, res) => {
  try {
    const { parcelId } = req.body;
    const { scheduleId } = req.body;

    const parcel = await Parcel.findOne({ parcelId });

    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    const schedule = await VehicleSchedule.findById(scheduleId).populate(
      "vehicle"
    );

    // Check if the existing schedules has enough space
    const remainingWeight =
      schedule.vehicle.capableWeight - schedule.totalWeight;
    const remainingVolume =
      schedule.vehicle.capableVolume - schedule.totalVolume;

    const canFit =
      remainingWeight >= parcelWeight && remainingVolume >= parcelVolume;

    if (!canFit) {
      return res.json({ message: "Parcel dose not fit the schedule" });
    }

    // Assign parcel to the schedule
    schedule.assignedParcels.push(parcel._id);
    schedule.totalWeight += parcelWeight;
    schedule.totalVolume += parcelVolume;

    // Update parcel status
    parcel.status = "PendingPickup";

    // Save both
    await Promise.all([schedule.save(), parcel.save()]);

    res
      .status(200)
      .json({ message: "parcel is assigned to a schedule", schedule });
  } catch (error) {
    res
      .status(500)
      .json({ message: "error in assigning parcel to the schedule", error });
  }
};

// CREATE A NEW PICKUP SCEDULE

const createNewPickupSchedule = async (req, res) => {
  try {
    const { parcelId } = req.body;

    const parcel = await Parcel.findOne({ parcelId });
    const { pickupDate, pickupTime } = parcel.pickupInformation;

    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    // Find alredy scheduled vehicles
    const scheduledVehicleIds = await VehicleSchedule.find({
      scheduleDate: pickupDate,
      timeSlot: pickupTime,
    }).distinct("vehicle");

    // Find an availble vehicle
    const vehicle = await Vehicle.findOne({
      vehiclType: "pickupDelivery",
      capableWeight: { $gte: parcelWeight },
      capableVolume: { $gte: parcelVolume },
      assignedBranch: parcel.from,
      _id: { $nin: scheduledVehicleIds },
      available: true,
    });

    if (!vehicle) {
      res.json({ message: "No availble vehicle" });
    }

    const schedule = new VehicleSchedule({
      vehicle: vehicle._id,
      scheduleDate: pickupDate,
      timeSlot: pickupTime,
      type: "pickup",
      assignedParcels: [parcel._id],
      totalWeight: parcelWeight,
      totalVolume: parcelVolume,
    });

    const savedSchedule = await schedule.save();

    res
      .status(200)
      .json({
        message: "Parcel is assigned to a newly created schedule",
        schedule,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating new pickup schedule", error });
  }
};

module.exports = {
  getAllPickupSchedulesForDate,
  assignparcelToExsistingPickup,
  createNewPickupSchedule,
};
