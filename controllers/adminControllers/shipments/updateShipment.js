const Shipment = require("../../../models/B2BShipmentModel");

const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Optional: You can add specific validations or uniqueness checks here
    // Example: prevent updating to a shipmentId that already exists on another document (if needed)
    // const existing = await Shipment.findOne({ shipmentId: updateData.shipmentId, _id: { $ne: id } });
    // if (existing) {
    //   return res.status(400).json({ status: "error", message: "Shipment ID already exists" });
    // }

    const updatedShipment = await Shipment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedShipment) {
      return res.status(404).json({
        status: "error",
        message: "Shipment not found"
      });
    }

    res.json({
      status: "success",
      message: "Shipment updated successfully",
      shipment: updatedShipment
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error during shipment update",
      error: error.message
    });
  }
};

module.exports = updateShipment;
