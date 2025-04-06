// config/cloudinaryConfig.js
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
console.log(cloudinary.config());

module.exports = cloudinary;
