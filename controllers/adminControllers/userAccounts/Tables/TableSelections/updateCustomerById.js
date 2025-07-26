const User = require("../../../../../models/userModel");
const mongoose = require("mongoose");

const updateCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; // Already validated by Zod middleware

    // Validate input
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Customer ID is required" 
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid customer ID format" 
      });
    }

    // Check if customer exists
    const existingCustomer = await User.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Check for duplicate email (if email is being updated)
    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailExists = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: id } 
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use"
        });
      }
    }

    // Check for duplicate NIC (if NIC is being updated)
    if (updateData.nic && updateData.nic !== existingCustomer.nic) {
      const nicExists = await User.findOne({ 
        nic: updateData.nic, 
        _id: { $ne: id } 
      });
      
      if (nicExists) {
        return res.status(400).json({
          success: false,
          message: "NIC is already in use"
        });
      }
    }

    // Update the customer
    const updatedCustomer = await User.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select("-password -profilePicLink -__v");

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Format the response data
    const userData = {
      ...updatedCustomer.toObject(),
      name: `${updatedCustomer.fName || ''} ${updatedCustomer.lName || ''}`.trim(),
    };

    res.status(200).json({ 
      success: true,
      message: "Customer updated successfully",
      userData
    });

  } catch (error) {
    console.error("Error updating customer data:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} is already in use`
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Internal server error. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = updateCustomerById;
