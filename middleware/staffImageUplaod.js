const cloudinary = require("../cloudinary/cloudinaryConfig");

const staffImageUpload = async (req, res, next) => {
  try {
    const { image } = req.body;
    const userId = req.staff._id; 
    

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }
    
    const uploadResult = await cloudinary.uploader.upload(image, {
      upload_preset: "unsigned_upload",
      public_id: `staff_${userId}_${Date.now()}`,
      allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
    });
    
    req.uploadData = {
      url: uploadResult.secure_url,
      public_id:uploadResult.public_id,
      userId:userId,
    };
    console.log("Image Uploaded to cloudinary successfully",uploadResult.public_id);
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    next({
      status: 500,
      message: "Image upload failed",
      error: error.message,
    });
  }
};

module.exports = staffImageUpload;