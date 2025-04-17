const express = require("express");
const { getOneUser } = require("../../controllers/staff/userController");
const router = express.Router();

// GET USER INFORMATION
router.get('/get-user', getOneUser);

module.exports = router;