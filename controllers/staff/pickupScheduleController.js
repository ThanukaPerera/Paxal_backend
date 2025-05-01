const VehicleSchedule = require("../../models/VehicleScheduleModel");
const Parcel = require("../../models/ParcelModel");
const Vehicle = require("../../models/vehicleModel");
const Staff = require("../../models/StaffModel");
const getParcelProperties = require("../../utils/parcelDetails");

// get all pickup schedules for a selected day
const getAllPickupSchedulesForDate = async (req, res) => {
  try {
    const { pickupDate, pickupTime } = req.query;
    if (!pickupDate || !pickupTime) {
      return res.status(400).json({ message: 'Missing pickupDate or pickupTime' });
    }
    console.log("Getting pickup schedules for: ", pickupDate, pickupTime);


    // Find the branch requesting schedules.
    const staff_id = req.staff._id.toString();
    console.log("staff id",staff_id)
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;
    
    console.log("branch id",branch_id)
    
    // Find pickup schedules created from the branch
    const schedules = await VehicleSchedule.find({
      scheduleDate: new Date(pickupDate),
      timeSlot: pickupTime,
      type: "pickup",
      branch: branch_id
    })
      .populate("vehicle")
      .populate({
        path: "assignedParcels",
        select: "pickupInformation",
      }).lean();

      console.log(schedules)

    const schedulesData = schedules.map((schedule) => {
      // number of parcels assigned to the schedule
      const parcelCount = schedule.assignedParcels.length;

      // Get unique pickup cities.
      const pickupCities = schedule.assignedParcels
        .map((parcel) => parcel?.pickupInformation?.city)
        .filter(Boolean);

      const uniqueCities = [...new Set(pickupCities)];

      const vehicleId = schedule.vehicle;

      return {
        scheduleId: schedule._id,
        vehicleId,
        parcelCount,
        pickupCities: uniqueCities,
      };
    });

    console.log("Available pickup schedules", schedulesData)
    return res.json(schedulesData);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error getting vehicle schedules", error });
  }
};

// assign the pickup to an exisitng pickup schedule
const assignparcelToExsistingPickup = async (req, res) => {
  try {
    const { parcelId, scheduleId } = req.body;

    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    const schedule = await VehicleSchedule.findById(scheduleId).populate(
      "vehicle"
    );
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if parcel is already assigned to this schedule to prevent reassigning.
    if (schedule.assignedParcels.includes(parcel._id)) {
      return res.json({
        message: "Parcel is already assigned to this schedule",
      });
    }

    // Check if the existing schedules has enough space.
    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    const remainingWeight =
      schedule.vehicle.capableWeight - schedule.totalWeight;
    const remainingVolume =
      schedule.vehicle.capableVolume - schedule.totalVolume;

    const canFit =
      remainingWeight >= parcelWeight && remainingVolume >= parcelVolume;

    if (!canFit) {
      return res.json({
        message: "Parcel dose not fit the schedule",
        details: {
          requiredWeight: parcelWeight,
          availableWeight: remainingWeight,
          requiredVolume: parcelVolume,
          availableVolume: remainingVolume,
        },
      });
    }

    // If the schedule has enough space assign parcel to the schedule.
    schedule.assignedParcels.push(parcel._id);
    schedule.totalWeight += parcelWeight;
    schedule.totalVolume += parcelVolume;

    await schedule.save();
    return res
      .status(200)
      .json({ message: "Parcel is assigned to a pickup schedule", schedule });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Error in assigning parcel to the pickup schedule",
        error,
      });
  }
};

// Create a new pickup schedule and assign the parcel
const createNewPickupSchedule = async (req, res) => {
  try {
    // Find the branch.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // Find the parcel to be assigned.
    const { parcelId } = req.body;

    if (!parcelId) {
      return res.status(400).json({ message: "Parcel ID is required" });
    }

    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }


    // Find the pickup date and time for the parcel
    // it can be used as schedule date and time.
    const { pickupDate, pickupTime } = parcel.pickupInformation;
    if (!pickupDate || !pickupTime) {
      return res
        .status(400)
        .json({ message: "Parcel missing pickup information" });
    }

    // Find parcel volume,weight
    // so it can be used to check if the vehicle has enough spacce.
    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    // Find alredy scheduled vehicles to prevent re-scheduling.
    const scheduledVehicleIds = await VehicleSchedule.find({
      scheduleDate: pickupDate,
      timeSlot: pickupTime,
    }).distinct("vehicle");
    console.log("---scheduled vehicels---", scheduledVehicleIds);

    // Find an availble vehicle from the branch.
    const vehicle = await Vehicle.findOne({
      vehicleType: "pickupDelivery",
      capableWeight: { $gte: parcelWeight },
      capableVolume: { $gte: parcelVolume },
      // assignedBranch: parcel.from,
      _id: { $nin: scheduledVehicleIds },
      // available: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: "No availble vehicle" });
    }

    // create the schedule
    const schedule = new VehicleSchedule({
      vehicle: vehicle._id,
      scheduleDate: pickupDate,
      timeSlot: pickupTime,
      type: "pickup",
      assignedParcels: [parcel._id],
      totalWeight: parcelWeight,
      totalVolume: parcelVolume,
      branch: branch_id,
    });

    const savedSchedule = await schedule.save();

    console.log("pickup schedule created", savedSchedule);

    const newSchedule = await VehicleSchedule.findById(savedSchedule._id)
      .populate("vehicle")
      .populate({
        path: "assignedParcels",
        select: "pickupInformation",
      });

      
    return res.status(201).json({
        success:true,
        message: "Parcel is assigned to a newly created schedule",
        newSchedule,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success:false, message: "Error creating new pickup schedule", error });
  }
};

// remove the parcel from an assigne schedule
const cancelPickupAssignment = async (req, res) => {
  try {
    const { parcelId } = req.body;
    const { scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    // find schedule and parcel
    const [pickupSchedule, parcel] = await Promise.all([
      VehicleSchedule.findById(scheduleId),
      Parcel.findOne({ parcelId }),
    ]);

    if (!pickupSchedule) {
      return res.status(400).json({ message: "Pickup schedule not found" });
    }

    if (!parcel) {
      return res.status(400).json({ message: "Parcel not found" });
    }

    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    // Remove the parcel and update the total volume  and weight for the schedule.
    pickupSchedule.assignedParcels.pull(parcel._id);
    pickupSchedule.totalVolume -= parcelVolume;
    pickupSchedule.totalWeight -= parcelWeight;

    // If there are no parcels left, delete the schedule.
    if (pickupSchedule.assignedParcels.length === 0) {
      await VehicleSchedule.findByIdAndDelete(scheduleId);
      console.log("Vehicle Schedule deleted because it had no parcels.");
    } else {
      await pickupSchedule.save();
      console.log("Vehicle Schedule updated:", pickupSchedule);
    }

    return res.status(200).json({ message: "Parcel removed successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Server error, please try again later",
        error: error.message,
      });
  }
};

// check if the parcel is assigned.
const checkParcelAssignment = async (req, res) => {
  try {
    const { parcelId } = req.body;
    const schedule = await VehicleSchedule.findOne({
      assignedParcels: parcelId,
      type: "pickup",
    });

    return res.json({ isAssigned: !!schedule, scheduleId: schedule?._id });
  } catch (error) {
    return res.status(500).json({ message: "Check failed", error });
  }
};

module.exports = {
  getAllPickupSchedulesForDate,
  assignparcelToExsistingPickup,
  createNewPickupSchedule,
  cancelPickupAssignment,
  checkParcelAssignment,
};
