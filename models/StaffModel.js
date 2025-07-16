const mongoose=require("mongoose");

const staffSchema = new mongoose.Schema(
    {
      staffId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      nic: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      profilePicLink: { type: String, required: false },
      contactNo: { type: String, required: true }, 
      status: { type: String, enum: ["active", "inactive"], required: true }, // Enum for status
      branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, // Reference to Branch
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // Reference to Admin
      password: { type: String, required: true }, // AWS token
      resetPasswordToken: {type: String, required:false},
      resetPasswordTokenExpires: {type: Date, required: false},
    },
    { timestamps: true }
  );

module.exports=mongoose.model("Staff",staffSchema);