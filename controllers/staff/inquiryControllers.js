const Inquiry = require("../../models/InquiryModel");


// //SEND INQUIRY BY CUSTOMER
// const sendInquiry = async(req,res) => {
//     try {
//         // find last inquiry ID and generate the next one
//         const lastInquiry = await Inquiry.findOne().sort({inquiryId: -1}).lean();
//         let nextInquiryId = "INQUIRY001"; // default inquiry ID if no inquiry exists

//         if (lastInquiry) {
//             const lastIdNumber = parseInt(
//                 lastInquiry.inquiryId.replace("INQUIRY",""),10
//             );
//             nextInquiryId = `INQUIRY${String(lastIdNumber + 1).padStart(3, "0")}`;
//         }

//         // find the customer object ID
//         const customer = await Customer.findOne({customerId: req.params.customer});
//         const customerRef = customer._id;

//         // create a new inquiry with the new inquiry ID
//         const inquiryData = {
//             ...req.body,
//             inquiryId: nextInquiryId,
//             status: "not",
//             customerId: customerRef
//         }

//         const inquiry = new Inquiry(inquiryData);
//         const sentInquiry = await inquiry.save();

//         res.status(200).json({message:"Inquiry is sent", sentInquiry})
//     } catch (error) {
//         res.status(500).json({message:"Error sending inquiry", error});
//     }
// }

// GET ALL INQUIRIES
const getAllInquiries = async(req, res) => {

    try {
        const inquiries = await Inquiry.find().sort({createdAt: -1})
        res.status(200).json(inquiries);
    } catch (error) {
        res.status(500).json({message:"Error fetching inquiries", error});
    }

}

// GET ONE INQUIRY
const getOneInquiry = async(req,res) => {
    try {
        const inquiry = await Inquiry.findOne({inquiryId: req.params.inquiryId});
        if (!inquiry) {
            return res.status(404).json({message: "Inquiry not found"});
        }
        res.status(200).json(inquiry);
    } catch (error) {
        res.status(500).json({message:"Error fetching the inquiry", error});
        
    }
}

// SEND REPLY BY STAFF
const sendReply = async(req,res) => {
    try {
        const replyData = {
            ...req.body,
            status: "solved"
        }

        const filter = {inquiryId: req.params.inquiryId}
        const inquiry = await Inquiry.findOneAndUpdate(filter, replyData, {new:true});

        // send the email
        const {name, email, parcelTrackingNo} = await Inquiry.findOne({inquiryId});

        res.status(200).json("Reply is sent", inquiry);
    } catch (error) {
        res.status(500).json({message:"Error sending reply", error});
    }
}


module.exports = {

    getAllInquiries,
    getOneInquiry,
    sendReply,

}