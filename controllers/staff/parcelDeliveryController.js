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

    return res.status(200).json(parcels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching parcels", error });
  }
};

// update "doorstep" deivery parcels when assigned to a delivery schedule
const updateParcelStatusToDeliveryDispatched = async (req, res) => {
  try {
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

    return res.status(200).json({
      message: "Parcel status updated - delivery dispatched",
      updatedParcel,
    });
    
  } catch (error) {
    return res.status(500).json({
      message: "Error in updating parcel status to delivery dispatched",
      error,
    });
  }
}

module.exports = {
  getAllDoorstepDeliveryParcels,
  getAllCollectionCenterDeliveryParcels,
  updateParcelStatusToDeliveryDispatched
}