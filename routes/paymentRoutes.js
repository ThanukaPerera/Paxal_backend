const express = require("express");
const { getCheckoutSession } = require("../controllers/paymentController");

const router = express.Router();

router.post("/checkout", getCheckoutSession);

module.exports = router;
