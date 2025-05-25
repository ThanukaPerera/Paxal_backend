// controllers/adminController.js or similar
const Shipment = require('../../../models/B2BShipmentModel');

const flattenShipment = (shipment) => {
  return {
    _id: shipment._id,
    shipmentId: shipment.shipmentId,
    deliveryType: shipment.deliveryType,

    sourceCenterId: shipment.sourceCenter?._id,
    sourceCenterBranchId: shipment.sourceCenter?.branchId,
    sourceCenterLocation: shipment.sourceCenter?.location,
    sourceCenterContact: shipment.sourceCenter?.contact,

    route: shipment.route?.map(id => id.toString()),

    currentLocation: shipment.currentLocation?.toString(),

    totalTime: shipment.totalTime,
    totalDistance: shipment.totalDistance,
    totalWeight: shipment.totalWeight,
    totalVolume: shipment.totalVolume,
    parcelCount: shipment.parcelCount,

    status: shipment.status,

    parcels: shipment.parcels?.map(id => id.toString()),

    createdByCenter: shipment.createdByCenter,
    createdByStaff: shipment.createdByStaff?.toString(),
    createdAt: shipment.createdAt,

    assignedDriver: shipment.assignedDriver?.toString(),
    assignedVehicle: shipment.assignedVehicle?.toString(),

    arrivalTimes: shipment.arrivalTimes?.map(a => ({
      center: a.center,
      time: a.time,
    })),
  };
};

const fetchShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate('sourceCenter')
      .populate('currentLocation')
      .populate('assignedDriver')
      .populate('assignedVehicle')
      .populate('createdByStaff')
      .populate('parcels')
      .populate('createdByCenter');

    const flattened = shipments.map(flattenShipment);
    console.log(flattened)
    res.status(200).json({ success: true, userData: flattened });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching shipments" });
  }
};

module.exports = fetchShipments
