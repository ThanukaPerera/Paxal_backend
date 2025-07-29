const express = require("express");
const { getCheckoutSession } = require("../controllers/paymentController");
const calculatePayment = require("../controllers/priceCalc");


const router = express.Router();

router.post("/checkout", getCheckoutSession);
router.get("/get-price",calculatePayment)

module.exports = router;
