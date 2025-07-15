const Parcel = require("../../models/ParcelModel");
const Staff = require("../../models/StaffModel");

// get all "doorstep" receiving type parcels
const getAllDoorstepDeliveryParcels = async (req, res) => {
  try {
    
    // Find the branch requesting parcels.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // find the parcels
    const parcels = await Parcel.find({
      status: "ArrivedAtCollectionCenter",
      receivingType: "doorstep",
      to: branch_id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(parcels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching parcels", error });
  }
};

// get all "collection_center" receiving type parcels
const getAllCollectionCenterDeliveryParcels = async (req, res) => {
  try {
    
    // Find the branch requesting parcels.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // find the parcels with populated data
    const parcels = await Parcel.find({
      status: "ArrivedAtCollectionCenter",
      to: branch_id,
      receivingType: "collection_center",

    })
    .populate({path:"receiverId", select:"receiverFullName receiverContact"})
    .populate({path:"paymentId", select:"paymentStatus amount"})
    .sort({ createdAt: -1 });
c
    return res.status(200).json({message:"test1", parcels});
  } catch (error) {
    return res.status(500).json({ message: "Error fetching parcels", error });
  }
};

// update "doorstep" deivery parcels when assigned to a delivery schedule
const updateParcelStatusToDeliveryDispatched = async (req, res) => {
  try {

    console.log("Updating parcel status to delivery dispatched...");
    const {parcelId} = req.body;

    // Get the staff who handle the delivery assignment.
    const staff_id = req.staff._id;

    // Update the parcel status and save the staff who handle it.
    const updatedDeliveryParcel = {
          status: "DeliveryDispatched",
          deliveryInformation: { staffId: staff_id },
    };
    
    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updatedDeliveryParcel,
      { new: true }
    );

    console.log("Updated parcel status to delivery dispatched");  
    
    return res.status(200).json({
      success:true,
      message: "Parcel status updated - delivery dispatched",
      updatedParcel
    });
    
  } catch (error) {
    console.log("Error in updating parcel to delivery dispatched status", error);
    return res.status(500).json({
      success:false,
      message: "Error in updating parcel status to delivery dispatched",
      error,
    });
  }
}

// update parcel status when receiver collected the parcel from the branch
const updateParcelAsDelivered = async(req, res) => {
  try {
    const {parcelId} = req.body;

    const parcelData = {
      status: "Delivered"
    }

    //Find the parcel and update the status.
    const filter = { parcelId: parcelId };
    await Parcel.findOneAndUpdate(filter, parcelData, {new: true,});

    return res.status(200).json({success:true, message: `Parcel ${parcelId} has been delivered successfully`})
    
  } catch (error) {
    console.log("Error in parcel delivery: ", error);
    return res.status(500).json({success:false, message:"Error in updating parcel status to delivered"});
  }
}

// get "doorstep delivery" parcels stats
const getDoorstepDeliveryStats = async (req, res) => {
  try {
    // Find the branch using staff ID.
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

     // Count the number of pending door-step deliveries.
    const pendingDoorstepDeliveries = await Parcel.countDocuments({
      status: "ArrivedAtCollectionCenter",
      receivingType: "doorstep",
      to: branch_id,
    });

    return res.status(200).json({ pendingDoorstepDeliveries: pendingDoorstepDeliveries});
  } catch (error) {
    console.error("Error fetching door-step delivery stats:", error);
    return res.status(500).json({ message: "Error fetching door-step delivery  stats", error });
  }
};

// get "collection center delivery" parcels stats
const getCollectionCenterDeliveryStats = async (req, res) => {
  try {
    // Find the branch using staff ID.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

     // Count the number of pending collection center deliveries.
    const pendingCollectionCenterDeliveries = await Parcel.countDocuments({
      status: "ArrivedAtCollectionCenter",
      receivingType: "collection_center",
      to: branch_id,
    });

    return res.status(200).json({ pendingCollectionCenterDeliveries: pendingCollectionCenterDeliveries});
  } catch (error) {
    console.error("Error fetching collection center delivery stats:", error);
    return res.status(500).json({ message: "Error fetching collection center delivery stats", error });
  }
}


module.exports = {
  getAllDoorstepDeliveryParcels,
  getAllCollectionCenterDeliveryParcels,
  updateParcelStatusToDeliveryDispatched,
  updateParcelAsDelivered,
  getDoorstepDeliveryStats,
  getCollectionCenterDeliveryStats,
}