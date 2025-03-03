const {Admin}=require("../models/models");

const findAdmin = async(adminId) => {
    const reqAdmin = await Admin.findOne({adminId});
    return reqAdmin;
}

module.exports=findAdmin;

