const VehicleSchedule = require("../../models/VehicleScheduleModel");
const Staff = require("../../models/StaffModel");
const Parcel = require("../../models/ParcelModel");
const Vehicle = require("../../models/VehicleModel");
const getParcelProperties = require("../../utils/parcelDetails");

// get all delivery schedules created from the branch
const getAllDeliveryScedules = async (req, res) => {
  try {
    // Find the branch.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // Find the delivery schedules created from the branch.
    const schedules = await VehicleSchedule.find({
      type: "delivery",
      branch: branch_id,
    })
      .populate("vehicle", "vehicleId")
      .populate({
        path: "assignedParcels",
        select: "deliveryInformation",
      });

    const schedulesData = schedules.map((schedule) => {
      const parcelCount = schedule.assignedParcels.length;

      //Get unique delivery cities.
      const deliveryCities = schedule.assignedParcels
        .map((parcel) => parcel?.deliveryInformation?.deliveryCity)
        .filter(Boolean);

      const uniqueCities = [...new Set(deliveryCities)];

      const vehicleId = schedule.vehicle;

      return {
        scheduleId: schedule._id,
        vehicleId,
        parcelCount,
        deliveryCities: uniqueCities,
        scheduleDate: schedule.scheduleDate,
        timeSlot: schedule.timeSlot,
      };
    });

    return res.json(schedulesData);
  } catch (error) {
    res.status(500).json({ message: "Error getting vehicle schedules", error });
  }
};

// create a new delivery schedule
const createNewDeliverySchedule = async (req, res) => {
  try {
    console.log("Creating a new delivery schedule...");
    // Find the branch.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // Get the parcel to be assigned to the new schedule.
    const { parcelId } = req.body;

    if (!parcelId) {
      return res.status(400).json({ message: "Parcel ID is required" });
    }

    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Get parcel weight and volume to check if the vehicle has enough space.
    console.log("Getting parcel information...");
    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    // Set delivery date to be 2 days ahead.
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    deliveryDate.setHours(0, 0, 0, 0);

    // Day bound for querying schedules.
    // Search from the time day start and to the time day ends.
    const startOfDay = new Date(deliveryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(deliveryDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("Searching for an available vehicle...");
    // First check for morning availablity then evening availability.
    for (const timeSlot of ["08:00 - 12:00", "13:00 - 17:00"]) {
      // Find vehicles already booked in that slot
      const busyIds = await VehicleSchedule.find({
        scheduleDate: { $gte: startOfDay, $lte: endOfDay },
        timeSlot,
      }).distinct("vehicle");

      // Pick the first free vehicle
      const vehicle = await Vehicle.findOne({
        _id: { $nin: busyIds },
        vehicleType: "pickupDelivery",
        assignedBranch: parcel.to,
        capableWeight: { $gte: parcelWeight },
        capableVolume: { $gte: parcelVolume },
        available: true
      });

      if (vehicle) {
        console.log(
          "Creating a new delivery schedule for the found vehicle..."
        );

        //Create  and save the schedule
        const newSchedule = await VehicleSchedule.create({
          vehicle: vehicle._id,
          scheduleDate: deliveryDate,
          timeSlot,
          type: "delivery",
          assignedParcels: [parcel._id],
          totalVolume: parcelVolume,
          totalWeight: parcelWeight,
          branch: branch_id,
        });

        const newDeliverySchedule = await VehicleSchedule.findById(
          newSchedule._id
        )
          .populate("vehicle")
          .populate("assignedParcels", "deliveryInformation");

        console.log(
          "New delivery schedule has been created and parcels was assigned"
        );
        return res.status(201).json({
          success: true,
          message: "Parcel is assigned to a newly created schedule",
          newDeliverySchedule,
        });
      }
      // If that slot is full try the next one.
    }

    //If none of the slots had availability.
    console.log("No available vehicle for a delivery schedule");
    return res.status(400).json({ message: "No available vehicle" });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Error creating new delivery schedule",
        error,
      });
  }
};

// assign parcel to an exisitng delivery schedule
const assignParcelToExistingDeliverySchedule = async (req, res) => {
  try {
    const { parcelId, scheduleId } = req.body;

    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // find the schedule
    const schedule = await VehicleSchedule.findById(scheduleId).populate(
      "vehicle"
    );

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if parcel is already assigned to this schedule to prevent re assigning.
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
        message:
          "There is not enough available space in the schedule to assign the parcel",
        details: {
          requiredWeight: parcelWeight,
          availableWeight: remainingWeight,
          requiredVolume: parcelVolume,
          availableVolume: remainingVolume,
        },
      });
    }

    // If the schedule has enough space assign the parcel to the schedule.
    schedule.assignedParcels.push(parcel._id);
    schedule.totalWeight += parcelWeight;
    schedule.totalVolume += parcelVolume;

    await schedule.save();
    return res
      .status(200)
      .json({
        success: true,
        message: "Parcel is assigned to a schedule",
        schedule,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error in assigning parcel to the schedule",
        error,
      });
  }
};

// Remove the parcel from an assigned schedule
const cancelDeliveryAssignment = async (req, res) => {
  try {
    const { parcelId, scheduleId } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    // Search for both parcel and schedule.
    const [deliverySchedule, parcel] = await Promise.all([
      VehicleSchedule.findById(scheduleId),
      Parcel.findOne({ parcelId }),
    ]);

    if (!deliverySchedule) {
      return res.status(404).json({ message: "Delivery schedule not found" });
    }

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    // Remove the parcel and update volume,weight.
    deliverySchedule.assignedParcels.pull(parcel._id);
    deliverySchedule.totalVolume -= parcelVolume;
    deliverySchedule.totalWeight -= parcelWeight;

    // If there are no parcels left, delete the schedule.
    if (deliverySchedule.assignedParcels.length === 0) {
      await VehicleSchedule.findByIdAndDelete(scheduleId);
      console.log("Vehicle Schedule deleted because it had no parcels.");
    } else {
      await deliverySchedule.save();
      console.log("Delivery Schedule updated:", deliverySchedule);
    }

    return res
      .status(200)
      .json({ success: true, message: "Parcel removed successfully" });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// check if the parcel is assigned.
const checkParcelAssignment = async (req, res) => {
  try {
    console.log("Checking parcel assignment to a delivery schedule...");
    const { parcelId } = req.query;
    const parcel = await Parcel.findOne({ parcelId });

    const schedule = await VehicleSchedule.findOne({
      assignedParcels: parcel._id,
      type: "delivery",
    });

    return res.json({ isAssigned: !!schedule, scheduleId: schedule?._id });
  } catch (error) {
    return res.status(500).json({ message: "Check failed", error });
  }
};

// Create an express delivery schedule
const createExpressDeliverySchedule = async (req, res) => {
  try {
    console.log("Creating a new express delivery schedule...");

    // Find the branch.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // Get the parcel to be assigned to the new schedule.
    const { parcelId, deliveryDate, timeSlot } = req.body;

    if (!parcelId || !deliveryDate || !timeSlot) {
      return res
        .status(400)
        .json({
          message: "Parcel ID, delivery date, and time slot are required",
        });
    }

    // Validate delivery date.
    const deliveryDateObj = new Date(deliveryDate);
    if (isNaN(deliveryDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid delivery date format" });
    }
    deliveryDateObj.setHours(0, 0, 0, 0);

    // Get the parcel.
    const parcel = await Parcel.findOne({ parcelId });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Get parcel weight and volume to check if the vehicle has enough space.
    console.log("Getting parcel information...");
    const itemSize = parcel.itemSize;
    const { parcelWeight, parcelVolume } = getParcelProperties(itemSize);

    // Day bound for querying schedules.
    // Search from the time day start and to the time day ends.
    const startOfDay = new Date(deliveryDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(deliveryDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(
      `Searching for an available vehicle on ${deliveryDate} in slot: ${timeSlot}`
    );

    // Find vehicles already booked in that date and time slot.
    const busyIds = await VehicleSchedule.find({
      scheduleDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
    }).distinct("vehicle");

    // Pick the first free vehicle
    const vehicle = await Vehicle.findOne({
      _id: { $nin: busyIds },
      vehicleType: "pickupDelivery",
      assignedBranch: parcel.to,
      capableWeight: { $gte: parcelWeight },
      capableVolume: { $gte: parcelVolume },
      available: true
    });

    if (vehicle) {
      console.log("Creating a new delivery schedule for the found vehicle...");

      //Create  and save the schedule
      const newSchedule = await VehicleSchedule.create({
        vehicle: vehicle._id,
        scheduleDate: deliveryDate,
        timeSlot,
        type: "delivery",
        assignedParcels: [parcel._id],
        totalVolume: parcelVolume,
        totalWeight: parcelWeight,
        branch: branch_id,
      });

      const newDeliverySchedule = await VehicleSchedule.findById(
        newSchedule._id
      )
        .populate("vehicle")
        .populate("assignedParcels", "deliveryInformation");

      console.log(
        "New delivery schedule has been created and parcels was assigned"
      );
      return res.status(201).json({
        success: true,
        message: "Parcel is assigned to a newly created schedule",
        newSchedule: newDeliverySchedule,
      });
    }

    //If no vehicle is availble
    console.log("No available vehicle for the selected delivery slot");
    return res
      .status(400)
      .json({ message: "No available vehicle for this date/time slot" });
  } catch (error) {
    console.error("Error creating express delivery schedule:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error creating express delivery schedule",
        error,
      });
  }
};

module.exports = {
  getAllDeliveryScedules,
  createNewDeliverySchedule,
  assignParcelToExistingDeliverySchedule,
  cancelDeliveryAssignment,
  checkParcelAssignment,
  createExpressDeliverySchedule,
};
