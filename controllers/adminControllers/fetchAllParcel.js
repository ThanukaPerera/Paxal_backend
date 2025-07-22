const Parcel = require("../../models/parcelModel");
const Receiver = require("../../models/receiverModel"); // Assuming you have a Receiver model

const fetchAllParcel = async (req, res) => {
  console.log("Fetching all parcels...");
  try {
    // const parcels = await Parcel.find()
    //   .lean()
    //   .select("-__v -updatedAt")
    //   .populate(
    //     "senderId",
    //     "-customerId -nic -customerFullName -password -createdAt -updatedAt -__v -province -district -city"
    //   )
    //   .populate("receiverId", "-__v")
    //   .populate("orderPlacedStaffId", "-__v")
    //   .populate("shipmentId", "-__v");

    const parcels = await Parcel.find()
      .lean()
      .select("-__v -updatedAt")
      .populate({
        path: "senderId",
        select:
          "-customerId -nic -customerFullName -password -createdAt -updatedAt -__v -province -district -city",
        match: { _id: { $exists: true } },
      })
      .populate({
        path: "receiverId",
        select: "-__v",
        match: { _id: { $exists: true } },
      })
      .populate("orderPlacedStaffId", "-__v")
      .populate("shipmentId", "-__v");

    const filteredData = parcels.map((parcel) => ({
      ...parcel,
      senderId: parcel.senderId?._id,
      senderName: `${parcel.senderId?.fName} ${parcel.senderId?.lName}`,
      senderEmail: parcel.senderId?.customerContact,
      senderEmail: parcel.senderId?.customerEmail,
      senderAddress: parcel.senderId?.customerAddress,
      // staffId:parcel.orderPlacedStaffId?.staffId,
      // staffName:parcel.orderPlacedStaffId?.name,
      // shipmentId:parcel.shipmentId?._id,
      // shipmentId:parcel.shipmentId?.shipmentId,
      deliveryAddress: parcel.deliveryInformation,
      itemSize: parcel.parcelSize || parcel.itemSize,
      shipmentMethod: parcel.shipmentMethod || parcel.shippingMethod,
    }));

    res.status(200).json(filteredData);
  } catch (error) {
    console.log("Error fetching", error);
    res.status(500).json({ message: "Fetching error", error });
  }
};

module.exports = fetchAllParcel;
