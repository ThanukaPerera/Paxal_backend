// const mongoose = require("mongoose");
// const validator = require("validator");
// const bcrypt=require('bcrypt');



// const userSchema = new mongoose.Schema({
//     fName: { type: String, required: true },
//     lName: { type: String, required: true },
//     email: { type: String, required: true, unique: true ,validate:[validator.isEmail,"Please provide a valide email"]},
//     password: { type: String, required: true }, // AWS token
//     passwordconfirm:{ type:String ,required:true,validate:{
//       validator:function(el){
//               return el===this.password;
//     },
//         message:"Password are not same",},},
//     isVerify: { type: Boolean,default:false,},
//     otp:{type:String, default:null ,},
//     otpExpires:{type:Date, default:null,},
//     resetPasswordOTP:{type:String ,default:null,},
//     resetPasswordOTPExpires:{ type:Date  ,default:null,},
//     createdAt:{type:String, default:Date.now,},
//     fullname: { type: String, required: false },
//     nic: { type: String, required: false, unique: false },
//     contact: { type: String, required: false },
    
//     profilePic: { type: String, required: false,default: null },
//     address: { type: String, required: false },
//     landmark: { type: String, required: false },
//     type: { type: String, enum: ["office", "home"], required: false }, // Enum for address type
//     city: { type: String, required: false },
//     district: { type: String, required: false },
//     province: { type: String, required: false },
//     zone: { type: String, required: false },
   

  
    
// },
// { timestamps: true }
// );

// userSchema.pre("save",async function (next) {
//     if(!this.isModified("password")) return next();

//     this.password=await bcrypt.hash(this.password,12);

//     this.passwordconfirm=undefined;
//     next();
    
// });

// userSchema.methods.correctPassword=async function(password,userPassword) {
//     return await bcrypt.compare(password,userPassword)
// };


// const User=mongoose.model("User",userSchema);
// module.exports=User;



const mongoose = require('mongoose');
const validator = require("validator");


const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false, unique: true },
    nic: { type: String, required: true, unique: false },
    fName: { type: String, required: false },
    lName: { type: String, required: false },
    contact: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: { type: String, required: true },
    passwordconfirm: {
      type: String,
      required: false,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Password are not same",
      },
    },
    isVerify: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpires: { type: Date, default: null },
    profilePicLink: { type: String, required: false, default: null },
    address: { type: String, required: false },
    district: { type: String, required: false },
    province: { type: String, required: false },
    city: { type: String, required: false },
  },
  { timestamps: true }
);


module.exports=mongoose.model("User",userSchema);


