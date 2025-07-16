const express = require('express');
const router = express.Router();
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware");
const { 
    getRepliedInquiries, 
    getAllNewInquiries, 
    getOneInquiry, 
    getOneRepliedInquiry, 
    replyToInquiry, 
    getInquiryStats
} = require('../../controllers/staff/inquiryControllers');

// get all replied inquiries
router.get("/get-replied-inquiries", authenticateStaff, getRepliedInquiries);

// get all new inquiries
router.get("/get-all-new-inquiries", authenticateStaff, getAllNewInquiries);

// get one new inquiry
router.get("/get-one-inquiry/:inquiryId", authenticateStaff, getOneInquiry);

// get one replied inquiry
router.get("/get-one-replied-inquiry/:inquiryId", authenticateStaff, getOneRepliedInquiry);

// send a reply to and inquiry
router.post("/reply-to-inquiry/:inquiryId", authenticateStaff, replyToInquiry);

// get inquiry stats
router.get("/get-inquiry-stats", authenticateStaff, getInquiryStats);

module.exports = router;