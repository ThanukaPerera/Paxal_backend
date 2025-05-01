const Shipment = require("../../../models/B2BShipmentModel");

const fetchShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().select("-__v").lean();

    const userData = shipments;
    res.status(200).json({ status: "success", userData });
  } catch (error) {}
};

module.exports = fetchShipments;
