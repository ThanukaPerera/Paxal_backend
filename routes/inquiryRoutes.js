const express = require("express");
const router = express.Router();
const { createInquiry } = require("../controllers/inquiryController");

// POST /api/inquiries - Create new inquiry
router.post("/postinquiry", createInquiry);

module.exports = router;
