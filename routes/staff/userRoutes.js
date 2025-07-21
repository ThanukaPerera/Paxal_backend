const express = require("express");
const { getOneUser } = require("../../controllers/staff/userController");
const router = express.Router();

// get user information
router.get('/get-user', getOneUser);

module.exports = router;