const  Parcel  = require("../../models/ParcelModel");
const fetchAllParcel = async(req,res) => {
    const AdminId=req.admin.adminId;
    const AdminEmail=req.admin.email;
    const parcels=await Parcel.find().populate("senderId").populate("receiverId").populate("orderPlacedStaffId").populate("shipmentId");

    const filteredData = parcels.map(parcel => ({
        // objectId:parcel._id,
        parcelId:parcel.parcelId,
        trackingNo:parcel.trackingNo,
        // qrCodeNo:parcel.qrCodeNo,
        itemType:parcel.itemType,
        itemSize:parcel.itemSize,
        submittingType:parcel.submittingType,
        receivingType:parcel.receivingType,
        shippingMethod:parcel.shippingMethod,
        latestLocation:parcel.latestLocation,
        status:parcel.status,
        createdAt: parcel.createdAt ? parcel.createdAt.toISOString().split("T")[0] : null,
        // senderObjectId:parcel.senderId?._id,
        senderId:parcel.senderId?.customerId,
        senderName:parcel.senderId?.fullName,
        staffId:parcel.orderPlacedStaffId?.staffId,
        staffName:parcel.orderPlacedStaffId?.name,
        shipmentId:parcel.shipmentId?._id,
        shipmentId:parcel.shipmentId?.shipmentId,
        

    }));
;
    
    
    res.status(200).json({parcels:filteredData});
    console.log("All parcels fetched successfully by",AdminId,AdminEmail);
}

module.exports=fetchAllParcel;