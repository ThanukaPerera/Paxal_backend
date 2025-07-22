// middleware/adminImageUpload.js
const cloudinary = require("../../cloudinary/cloudinaryConfig");

const adminImageUpload = async (req, res, next) => {
  try {
    const { image } = req.body;
    const userId = req.admin._id;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(image, {
      upload_preset: "unsigned_upload",
      public_id: `admin_${userId}_${Date.now()}`,
      allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
    });

    req.uploadData = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      userId: userId,
    };
    console.log(
      "Image Uploaded to cloudinary successfully",
      uploadResult.public_id,
    );
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

module.exports = adminImageUpload;

// router.post("/upload", async (req, res) => {
//   try {
//     const { image } = req.body;
//     if (!image) return res.status(400).json({ message: "No image provided" });

//     // Correct upload method and remove .then
//     const uploadResult = await cloudinary.uploader.upload(image, {
//       upload_preset: "unsigned_upload",
//       public_id: `avatar_${Date.now()}`, // Simplified public_id
//       allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
//     });

//     res.status(200).json({
//       message: "Image uploaded successfully",
//       url: uploadResult.secure_url,
//       result: uploadResult
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: "Image upload failed", error });
//   }
// });
