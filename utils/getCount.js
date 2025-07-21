// const {
//     Customer,
//     Parcel,
//     Shipping,
//     Pickup,
//     Deliver,
//     Receiver,
//     Staff,
//     B2BShipment,
//     Payment,
//     Driver,
//     Admin,
//     Inquiry,
//     Branch,
//     ParcelAssignedToB2BShipment,
//   } = require("../models/models");
  const User = require("../models/userModel")
  const Staff = require("../models/StaffModel")


const getCount=async(Schema,condition)=>{
    const count= await Schema.countDocuments(condition);
    return count;
}
module.exports = getCount;


