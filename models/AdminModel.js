const mongoose= require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // AWS token
    profilePicLink: { type: String, default:'avatar_1743610267755.jpg',required: false },
    email: { type: String, required: true, unique: true },
    contactNo:{type:String,required:true},
    resetCode: { type: Number },  // Store reset code
    resetCodeExpires: { type: Date }, // Store reset code expiry  
  },
  { timestamps: true }
);

module.exports=mongoose.model('Admin',adminSchema);