const Parcel = require("../../../models/parcelModel");
const Payment = require("../../../models/PaymentModel");

const fetchParcelById = async (req, res) => {
    try {
        const parcelId = req.params.id;
        // Validate input
        if (!parcelId || typeof parcelId !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid parcel ID provided"
            });
        }

        // Find parcel by custom ID
        const parcel = await Parcel.findOne({ parcelId: parcelId }).select("-__v").populate("senderId","-password -__v -resetPasswordOTP -resetPasswordOTPExpires").populate("receiverId","-__v").populate("paymentId","-__v").populate("from","-__v").populate("to","-__v").lean().exec();

        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: "Parcel not found"
            });
        }

        res.status(200).json({
            success: true,
            data: parcel
        });

    } catch (error) {
        console.error("Error fetching parcel:", error);
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = fetchParcelById;