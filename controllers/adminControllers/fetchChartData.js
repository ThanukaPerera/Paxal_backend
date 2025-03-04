const {Parcel}=require('../../models/models');
const getCount =require("../../utils/getCount");
const fetchChartData = async (req,res)=>{
    const orderPlacedCount=await getCount(Parcel);
    res.status(200).json({message:"Chart Data fetched successfully",orderPlacedCount: orderPlacedCount});
    console.log(orderPlacedCount);
  }

module.exports=fetchChartData;