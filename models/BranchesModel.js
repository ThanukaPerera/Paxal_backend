const mongoose = require("mongoose");

const branchSchema=new mongoose.Schema({
    branchId:{type:String,required:true,unique:true},
    location:{type:String,required:true},
    contact:{type:String,required:true}
  },
  { timestamps: true })


  module.exports=mongoose.model("Branch",branchSchema);

