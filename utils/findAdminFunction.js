const {Admin}=require("../models/AdminModel");


//This will only use for BACKEND
const findAdminFunction = async(adminId) => {
    const reqAdmin = await Admin.findOne({adminId});
    return reqAdmin;
}

module.exports=findAdminFunction;

