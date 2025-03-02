const {
    Customer,
    Parcel,
    Shipping,
    Pickup,
    Deliver,
    Receiver,
    Staff,
    B2BShipment,
    Payment,
    Driver,
    Admin,
    Inquiry,
    Branch,
    ParcelAssignedToB2BShipment,
  } = require("../models/models");


const getCount=async(Schema,condition)=>{
    const count= await Schema.countDocuments({status:'OrderPlaced'});
    return count;
}
module.exports = getCount;


