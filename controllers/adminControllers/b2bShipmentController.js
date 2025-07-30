const B2BShipment = require('../../models/B2BShipmentModel');
const Parcel = require('../../models/parcelModel');
const Vehicle = require('../../models/VehicleModel');
const Driver = require('../../models/driverModel');
const Branch = require('../../models/BranchesModel');
const mongoose = require('mongoose');

/**
 * Get all B2B shipments with filters and pagination
 */
const getAllB2BShipments = async (req, res) => {
  try {
    const {
      status,
      deliveryType,
      sourceCenter,
      assignedVehicle,
      assignedDriver,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (deliveryType) {
      filter.normalizedDeliveryType = deliveryType;
    }

    if (sourceCenter) {
      filter.sourceCenter = sourceCenter;
    }

    if (assignedVehicle) {
      filter.assignedVehicle = assignedVehicle;
    }

    if (assignedDriver) {
      filter.assignedDriver = assignedDriver;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const skip = (page - 1) * limit;
    const total = await B2BShipment.countDocuments(filter);

    const shipments = await B2BShipment.find(filter)
      .populate({
        path: 'sourceCenter',
        select: 'branchId location contact'
      })
      .populate({
        path: 'route',
        select: 'branchId location contact'
      })
      .populate({
        path: 'currentLocation',
        select: 'branchId location contact'
      })
      .populate({
        path: 'assignedVehicle',
        select: 'vehicleId registrationNo vehicleType capableVolume capableWeight available',
        populate: {
          path: 'assignedBranch currentBranch',
          select: 'branchId location contact'
        }
      })
      .populate({
        path: 'assignedDriver',
        select: 'driverId name email contactNo licenseId',
        populate: {
          path: 'branchId',
          select: 'branchId location contact'
        }
      })
      .populate({
        path: 'parcels',
        select: 'parcelId trackingNo itemType itemSize status shippingMethod from to',
        populate: [
          {
            path: 'from',
            select: 'branchId location'
          },
          {
            path: 'to',
            select: 'branchId location'
          }
        ]
      })
      .populate({
        path: 'createdByCenter',
        select: 'branchId location contact'
      })
      .populate({
        path: 'createdByStaff',
        select: 'staffId name email contactNo'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get drivers for vehicles and add parcel size information
    const vehicleIds = shipments
      .map(s => s.assignedVehicle?._id)
      .filter(Boolean);
    
    const driversForVehicles = await Driver.find({ vehicleId: { $in: vehicleIds } })
      .populate('branchId', 'branchId location contact')
      .lean();
    
    const vehicleDriverMap = {};
    driversForVehicles.forEach(driver => {
      vehicleDriverMap[driver.vehicleId.toString()] = driver;
    });

    // Add parcel size details and vehicle driver information
    const processedShipments = shipments.map(shipment => {
      const shipmentObj = shipment.toObject();
      
      // Add driver assigned to vehicle
      if (shipmentObj.assignedVehicle?._id) {
        const vehicleDriver = vehicleDriverMap[shipmentObj.assignedVehicle._id.toString()];
        shipmentObj.vehicleDriver = vehicleDriver ? {
          driverId: vehicleDriver.driverId,
          name: vehicleDriver.name,
          email: vehicleDriver.email,
          contactNo: vehicleDriver.contactNo,
          licenseId: vehicleDriver.licenseId,
          branchId: vehicleDriver.branchId
        } : null;
      }

      // Add parcel size details
      if (shipmentObj.parcels) {
        shipmentObj.parcels = shipmentObj.parcels.map(parcel => {
          const getParcelProperties = (itemSize) => {
            switch (itemSize) {
              case "small":
                return { parcelWeight: 2, parcelVolume: 0.2 };
              case "medium":
                return { parcelWeight: 5, parcelVolume: 0.5 };
              default:
                return { parcelWeight: 10, parcelVolume: 1 };
            }
          };
          
          const sizeProperties = getParcelProperties(parcel.itemSize);
          return {
            ...parcel,
            ...sizeProperties
          };
        });
      }
      
      return shipmentObj;
    });

    // Calculate summary statistics
    const summary = {
      totalShipments: total,
      totalParcels: processedShipments.reduce((sum, shipment) => sum + shipment.parcelCount, 0),
      totalWeight: processedShipments.reduce((sum, shipment) => sum + shipment.totalWeight, 0),
      totalVolume: processedShipments.reduce((sum, shipment) => sum + shipment.totalVolume, 0),
      totalDistance: processedShipments.reduce((sum, shipment) => sum + shipment.totalDistance, 0),
      shipmentsByStatus: await getStatusBreakdown(filter),
      shipmentsByDeliveryType: await getDeliveryTypeBreakdown(filter),
      shipmentsWithVehicles: processedShipments.filter(s => s.assignedVehicle).length,
      shipmentsWithDrivers: processedShipments.filter(s => s.assignedDriver || s.vehicleDriver).length
    };

    res.status(200).json({
      success: true,
      data: {
        shipments: processedShipments,
        summary,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching B2B shipments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch B2B shipments',
      error: error.message
    });
  }
};

/**
 * Get B2B shipment by ID with full details
 */
const getB2BShipmentById = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await B2BShipment.findById(shipmentId)
      .populate({
        path: 'sourceCenter',
        select: 'branchId location contact'
      })
      .populate({
        path: 'route',
        select: 'branchId location contact'
      })
      .populate({
        path: 'currentLocation',
        select: 'branchId location contact'
      })
      .populate({
        path: 'assignedVehicle',
        select: 'vehicleId registrationNo vehicleType capableVolume capableWeight available',
        populate: {
          path: 'assignedBranch currentBranch',
          select: 'branchId location contact'
        }
      })
      .populate({
        path: 'assignedDriver',
        select: 'driverId name email contactNo licenseId',
        populate: {
          path: 'branchId',
          select: 'branchId location contact'
        }
      })
      .populate({
        path: 'parcels',
        populate: [
          {
            path: 'senderId',
            select: 'name email contactNo'
          },
          {
            path: 'receiverId',
            select: 'name email contactNo'
          },
          {
            path: 'from',
            select: 'branchId location'
          },
          {
            path: 'to',
            select: 'branchId location'
          }
        ]
      })
      .populate({
        path: 'createdByCenter',
        select: 'branchId location contact'
      })
      .populate({
        path: 'createdByStaff',
        select: 'staffId name email contactNo'
      });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'B2B shipment not found'
      });
    }

    // Get driver assigned to vehicle and add parcel size information
    let vehicleDriver = null;
    if (shipment.assignedVehicle?._id) {
      vehicleDriver = await Driver.findOne({ vehicleId: shipment.assignedVehicle._id })
        .populate('branchId', 'branchId location contact')
        .lean();
    }

    const shipmentObj = shipment.toObject();
    
    // Add vehicle driver information
    if (vehicleDriver) {
      shipmentObj.vehicleDriver = {
        driverId: vehicleDriver.driverId,
        name: vehicleDriver.name,
        email: vehicleDriver.email,
        contactNo: vehicleDriver.contactNo,
        licenseId: vehicleDriver.licenseId,
        branchId: vehicleDriver.branchId
      };
    }

    // Add parcel size details
    if (shipmentObj.parcels) {
      shipmentObj.parcels = shipmentObj.parcels.map(parcel => {
        const getParcelProperties = (itemSize) => {
          switch (itemSize) {
            case "small":
              return { parcelWeight: 2, parcelVolume: 0.2 };
            case "medium":
              return { parcelWeight: 5, parcelVolume: 0.5 };
            default:
              return { parcelWeight: 10, parcelVolume: 1 };
          }
        };
        
        const sizeProperties = getParcelProperties(parcel.itemSize);
        return {
          ...parcel,
          ...sizeProperties
        };
      });
    }

    res.status(200).json({
      success: true,
      data: shipmentObj
    });

  } catch (error) {
    console.error('Error fetching B2B shipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch B2B shipment',
      error: error.message
    });
  }
};

/**
 * Get B2B shipments by status
 */
const getB2BShipmentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { deliveryType, sourceCenter } = req.query;

    const filter = { status };
    
    if (deliveryType) {
      filter.normalizedDeliveryType = deliveryType;
    }
    
    if (sourceCenter) {
      filter.sourceCenter = sourceCenter;
    }

    const shipments = await B2BShipment.find(filter)
      .populate('sourceCenter', 'branchId location contact')
      .populate('assignedVehicle', 'vehicleId registrationNo vehicleType')
      .populate('assignedDriver', 'driverId name contactNo')
      .populate('parcels', 'parcelId trackingNo itemType status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: shipments
    });

  } catch (error) {
    console.error('Error fetching B2B shipments by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch B2B shipments by status',
      error: error.message
    });
  }
};

/**
 * Get B2B shipments by branch (source center)
 */
const getB2BShipmentsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { status, deliveryType } = req.query;

    const filter = { sourceCenter: branchId };
    
    if (status) {
      filter.status = status;
    }
    
    if (deliveryType) {
      filter.normalizedDeliveryType = deliveryType;
    }

    const shipments = await B2BShipment.find(filter)
      .populate('sourceCenter', 'branchId location contact')
      .populate('assignedVehicle', 'vehicleId registrationNo vehicleType')
      .populate('assignedDriver', 'driverId name contactNo')
      .populate('parcels', 'parcelId trackingNo itemType status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: shipments
    });

  } catch (error) {
    console.error('Error fetching B2B shipments by branch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch B2B shipments by branch',
      error: error.message
    });
  }
};

/**
 * Get B2B shipment statistics
 */
const getB2BShipmentStats = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], period = 'day' } = req.query;

    let startDate, endDate;
    const queryDate = new Date(date);

    switch (period) {
      case 'week':
        startDate = new Date(queryDate.setDate(queryDate.getDate() - queryDate.getDay()));
        endDate = new Date(queryDate.setDate(queryDate.getDate() - queryDate.getDay() + 6));
        break;
      case 'month':
        startDate = new Date(queryDate.getFullYear(), queryDate.getMonth(), 1);
        endDate = new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0);
        break;
      default: // day
        startDate = new Date(date);
        endDate = new Date(date + 'T23:59:59.999Z');
    }

    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const [
      totalShipments,
      statusStats,
      deliveryTypeStats,
      branchStats,
      capacityStats
    ] = await Promise.all([
      B2BShipment.countDocuments(dateFilter),
      getStatusBreakdown(dateFilter),
      getDeliveryTypeBreakdown(dateFilter),
      getBranchBreakdown(dateFilter),
      getCapacityStats(dateFilter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        date,
        totalShipments,
        statusBreakdown: statusStats,
        deliveryTypeBreakdown: deliveryTypeStats,
        branchBreakdown: branchStats,
        capacityStats
      }
    });

  } catch (error) {
    console.error('Error fetching B2B shipment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch B2B shipment statistics',
      error: error.message
    });
  }
};

/**
 * Update B2B shipment status
 */
const updateB2BShipmentStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Verified', 'In Transit', 'Dispatched', 'Completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
      });
    }

    const shipment = await B2BShipment.findByIdAndUpdate(
      shipmentId,
      { status },
      { new: true, runValidators: true }
    ).populate('sourceCenter assignedVehicle assignedDriver parcels');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'B2B shipment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shipment status updated successfully',
      data: shipment
    });

  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipment status',
      error: error.message
    });
  }
};

/**
 * Assign vehicle to B2B shipment
 */
const assignVehicleToShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { vehicleId } = req.body;

    // Check if vehicle exists and is available
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (!vehicle.available) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available'
      });
    }

    const shipment = await B2BShipment.findByIdAndUpdate(
      shipmentId,
      { assignedVehicle: vehicleId },
      { new: true, runValidators: true }
    ).populate('sourceCenter assignedVehicle assignedDriver parcels');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'B2B shipment not found'
      });
    }

    // Update vehicle availability
    await Vehicle.findByIdAndUpdate(vehicleId, { available: false });

    res.status(200).json({
      success: true,
      message: 'Vehicle assigned to shipment successfully',
      data: shipment
    });

  } catch (error) {
    console.error('Error assigning vehicle to shipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign vehicle to shipment',
      error: error.message
    });
  }
};

/**
 * Assign driver to B2B shipment
 */
const assignDriverToShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { driverId } = req.body;

    // Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const shipment = await B2BShipment.findByIdAndUpdate(
      shipmentId,
      { assignedDriver: driverId },
      { new: true, runValidators: true }
    ).populate('sourceCenter assignedVehicle assignedDriver parcels');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'B2B shipment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Driver assigned to shipment successfully',
      data: shipment
    });

  } catch (error) {
    console.error('Error assigning driver to shipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver to shipment',
      error: error.message
    });
  }
};

// Helper functions
const getStatusBreakdown = async (filter) => {
  const pipeline = [
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ];
  
  const result = await B2BShipment.aggregate(pipeline);
  return result.reduce((acc, item) => {
    acc[item._id.toLowerCase()] = item.count;
    return acc;
  }, {});
};

const getDeliveryTypeBreakdown = async (filter) => {
  const pipeline = [
    { $match: filter },
    { $group: { _id: '$normalizedDeliveryType', count: { $sum: 1 } } }
  ];
  
  const result = await B2BShipment.aggregate(pipeline);
  return result.reduce((acc, item) => {
    acc[item._id.toLowerCase()] = item.count;
    return acc;
  }, {});
};

const getBranchBreakdown = async (filter) => {
  const pipeline = [
    { $match: filter },
    { $group: { _id: '$sourceCenter', count: { $sum: 1 } } },
    { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
    { $unwind: '$branch' },
    { $project: { _id: 1, count: 1, branchName: '$branch.location' } }
  ];
  
  return await B2BShipment.aggregate(pipeline);
};

const getCapacityStats = async (filter) => {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: null,
        totalWeight: { $sum: '$totalWeight' },
        totalVolume: { $sum: '$totalVolume' },
        totalParcels: { $sum: '$parcelCount' },
        totalDistance: { $sum: '$totalDistance' },
        averageWeight: { $avg: '$totalWeight' },
        averageVolume: { $avg: '$totalVolume' }
      }
    }
  ];
  
  const result = await B2BShipment.aggregate(pipeline);
  return result[0] || {
    totalWeight: 0,
    totalVolume: 0,
    totalParcels: 0,
    totalDistance: 0,
    averageWeight: 0,
    averageVolume: 0
  };
};

module.exports = {
  getAllB2BShipments,
  getB2BShipmentById,
  getB2BShipmentsByStatus,
  getB2BShipmentsByBranch,
  getB2BShipmentStats,
  updateB2BShipmentStatus,
  assignVehicleToShipment,
  assignDriverToShipment
};
