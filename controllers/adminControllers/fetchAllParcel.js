const  Parcel  = require("../../models/parcelModels");
const fetchAllParcel = async(req,res) => {
    
    try{
        const parcels=await Parcel.find().lean().select("-__v -updatedAt").populate("senderId","-customerId -nic -customerFullName -password -createdAt -updatedAt -__v -province -district -city").populate("receiverId","-__v").populate("orderPlacedStaffId","-__v").populate("shipmentId","-__v");

       
//     const filteredData = parcels.map(parcel => ({
//         // objectId:parcel._id,
//         parcelId:parcel.parcelId,
//         trackingNo:parcel.trackingNo,
//         // qrCodeNo:parcel.qrCodeNo,
//         itemType:parcel.itemType,
//         itemSize:parcel.itemSize,
//         submittingType:parcel.submittingType,
//         receivingType:parcel.receivingType,
//         shippingMethod:parcel.shippingMethod,
//         latestLocation:parcel.latestLocation,
//         status:parcel.status,
//         createdAt: parcel.createdAt ? parcel.createdAt.toISOString().split("T")[0] : null,
//         // senderObjectId:parcel.senderId?._id,
        // senderId:parcel.senderId?.customerId,
        // senderName:parcel.senderId?.fullName,
        // staffId:parcel.orderPlacedStaffId?.staffId,
        // staffName:parcel.orderPlacedStaffId?.name,
        // shipmentId:parcel.shipmentId?._id,
        // shipmentId:parcel.shipmentId?.shipmentId,
        

//     }));
// ;
    const filteredData=parcels.map(parcel=>({
        ...parcel,
        senderId:parcel.senderId?._id,
        senderName: `${parcel.senderId?.fName} ${parcel.senderId?.lName}`,
        senderEmail:parcel.senderId?.customerContact,
        senderEmail:parcel.senderId?.customerEmail,
        senderAddress:parcel.senderId?.customerAddress,
        // staffId:parcel.orderPlacedStaffId?.staffId,
        // staffName:parcel.orderPlacedStaffId?.name,
        // shipmentId:parcel.shipmentId?._id,
        // shipmentId:parcel.shipmentId?.shipmentId,
        deliveryAddress:parcel.deliveryInformation,
        itemSize:parcel.parcelSize|| parcel.itemSize,
        shipmentMethod:parcel.shipmentMethod || parcel.shippingMethod,

    }))

    res.status(200).json(filteredData);
    }
    catch(error){
        console.log("Error fetching",error);
        res.status(500).json({message:"Fetching error",error});
    }
}

module.exports=fetchAllParcel;