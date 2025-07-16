const Inquiry = require("../../models/InquiryModel");
const Staff = require("../../models/StaffModel");
const Parcel = require("../../models/ParcelModel");
const { sendInquiryReplyEmail } = require("../../emails/emails");

// retrieve all replied inquiries
const getRepliedInquiries = async (req, res) => {
  try {
    // Find the branch that requests the inquiries.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // Find all parcels registered to the branch and get the tracking number.
    const parcels = await Parcel.find({ from: branch_id })
      .select("trackingNo")
      .lean();
    const trackingNumbers = parcels.map((parcel) => parcel.trackingNo);

    // Find inquiries that belong to the branch (matching those tracking numbers).
    const inquiries = await Inquiry.find({
      parcelTrackingNo: { $in: trackingNumbers },
      status: "solved",
    });

    return res.status(200).json(inquiries);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching inquiries", error });
  }
};

//get new inquiries received to the branch
const getAllNewInquiries = async (req, res) => {
  try {
    // FInd the branch that requests the inquiries.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    // Find all parcels registered to the branch and get the tracking number.
    const parcels = await Parcel.find({ from: branch_id })
      .select("trackingNo")
      .lean();
    const trackingNumbers = parcels.map((parcel) => parcel.trackingNo);

    // Find inquiries that belong to the branch (matching those tracking numbers).
    const inquiries = await Inquiry.find({
      parcelTrackingNo: { $in: trackingNumbers },
      status: "new",
    });

    return res.status(200).json(inquiries);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching inquiries", error });
  }
};

// get one new inquiry details by inquiryId
const getOneInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findOne({ inquiryId: req.params.inquiryId });

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    return res.status(200).json(inquiry);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching the inquiry", error });
  }
};

// get one replied inquiry details by inquiryId
const getOneRepliedInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findOne({
      inquiryId: req.params.inquiryId,
    }).populate("staffId", "name staffId");

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    return res.status(200).json(inquiry);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching the inquiry", error });
  }
};

// send a reply to an inquiry
const replyToInquiry = async (req, res) => {
  try {
    // Find the staff who replied to the inquiry.
    const staff_id = req.staff._id.toString();

    const inquiryId = req.params.inquiryId;

    const replyData = {
      ...req.body,
      status: "solved",
      staffId: staff_id,
    };

    // Update the inquiry.
    const filter = { inquiryId: inquiryId };
    const inquiry = await Inquiry.findOneAndUpdate(filter, replyData, {
      new: true,
    });

    // Find the details of the inquiry to be sent in the email.
    const updatedInquiry = await Inquiry.findOne({
      inquiryId: inquiryId,
    }).populate("staffId", "name");
    const { parcelTrackingNo, name, email, createdAt, message, reply } =
      updatedInquiry;
    const staffName = updatedInquiry.staffId.name;

    // Send the email.
    const result = await sendInquiryReplyEmail(
      email,
      parcelTrackingNo,
      name,
      reply,
      createdAt,
      message,
      staffName
    );
    if (!result.success) {
      console.log("Error in sending the inquiry reply email", result);
    }

    console.log("Inquiry reply sent");
    return res
      .status(200)
      .json({ success: true, message: "Inquiry reply sent successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error sending reply", error });
  }
};

// Get inquiry stats
const getInquiryStats = async (req, res) => {
  try {
    // Find the branch using staff ID.
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find all parcels registered to the branch and get the tracking number.
    const parcels = await Parcel.find({ from: branch_id })
      .select("trackingNo")
      .lean();
    const trackingNumbers = parcels.map((parcel) => parcel.trackingNo);


    // Count the number of new inquiries made today.
    const inquiriesToday = await Inquiry.countDocuments({
      parcelTrackingNo: { $in: trackingNumbers },
      status: "new",
      createdAt: { $gte: startOfToday, $lt: endOfToday },
    });

     // Count the number of pending inquiries.
    const pendingInquiries= await Inquiry.countDocuments({
      parcelTrackingNo: { $in: trackingNumbers },
      status: "new",
    });

    
    return res.status(200).json({ inquiriesToday: inquiriesToday, pendingInquiries: pendingInquiries });
  } catch (error) {
    console.error("Error fetching inquiry stats:", error);
    return res.status(500).json({ message: "Error fetching inquiry stats", error });
  }
};

module.exports = {
  getRepliedInquiries,
  getAllNewInquiries,
  getOneInquiry,
  getOneRepliedInquiry,
  replyToInquiry,
  getInquiryStats
};
