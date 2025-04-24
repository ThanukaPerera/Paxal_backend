const Inquiry=require("../models/InquiryModel");
const { v4: uuidv4 } = require('uuid');


const createInquiry = async (req, res) => {
  try {
    const { name, email, parcelTrackingNo, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and message are required fields'
      });
    }

    // Create new inquiry
    const newInquiry = new Inquiry({
      inquiryId: `INQ-${uuidv4().substring(0, 8).toUpperCase()}`,
      name,
      email,
      parcelTrackingNo,
      message,
      status: 'new'
    });

    // Save to database
    await newInquiry.save();

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully',
      data: {
        inquiryId: newInquiry.inquiryId,
        status: newInquiry.status
      }
    });

  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry',
      error: error.message
    });
  }
};

module.exports = {
  createInquiry
};