const User = require("../../../../../models/userModel");
const Parcel = require("../../../../../models/parcelModel");
const mongoose = require("mongoose");

const fetchCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

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

    const customer = await User.findById(id)
      .select("-fullName -password -profilePicLink -updatedAt -__v")
      .lean()
      .exec();

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    const parcels = await Parcel.find({ senderId: id })
      .select("parcelId status createdAt updatedAt")
      .lean()
      .exec();
    if (!parcels) {
      return res.status(404).json({
        success: false,
        message: "No parcels found for this customer"
      });
    }

    const userData = {
      ...customer,
      name: `${customer.fName || ''} ${customer.lName || ''}`.trim(),
      contact: customer.contact || '',
      address: [customer.address, customer.city, customer.district, customer.province]
        .filter(part => part && part.trim())
        .join(', ') || ''
    };

    res.status(200).json({ 
      success: true,
      userData,
      parcels
    });
  } catch (error) {
    console.error("Error fetching customer data:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = fetchCustomerById;