Parcel = require("../../../models/parcelModel");

const trackStatuses = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;

    // Find a single parcel matching the ID
    const parcel = await Parcel.findOne({ parcelId: parcelId })
      .select("createdAt from submittingType")
      .populate("from", "location")
      .lean()
      .exec();

    if (!parcel) {
      return res
        .status(404)
        .json({ status: "error", message: "Parcel not found" });
    }
    const handledBy =
      parcel?.submittingType === "pickup" ? "User (Pickup)" : "Branch";
    const note = "-";

    const timeData = [
      {
        status: "order placed",
        time: parcel?.createdAt,
        location: parcel?.from?.location,
        handledBy,
        note,
      },
    ];

    res.status(200).json({ status: "success", timeData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = trackStatuses;
