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
  } = require("../models/ParcelModel");


const getCount=async(Schema,condition)=>{
    const count= await Schema.countDocuments(condition);
    return count;
}
module.exports = getCount;


