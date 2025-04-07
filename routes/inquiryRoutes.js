const express = require("express");
const router = express.Router();
const { sendInquiry, getAllInquiries, getOneInquiry, sendReply, updateAsSolved } = require("../controllers/inquiryControllers");

// SEND A INQUIRY
router.post("/send-inquiry", sendInquiry);

//GET ALL INQUIRIES
router.get("/get-all-inquiries", getAllInquiries);

// GET ONE INQUIRY
router.get("/get-one-inquiry", getOneInquiry);

// REPLY TO INQUIRY
router.post("/reply-to-inquiry", sendReply);

// UPDATE AS SOLVED
router.post("/update-as-solved", updateAsSolved);

module.exports = router;