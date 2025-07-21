//mobile.js
const express = require("express");
const Driver = require("../models/DriverModel");
const Parcel  = require("../models/ParcelModel");
//const Pickup  = require("../models/PickupSchema");
const  VehicleSchedule  = require("../models/VehicleScheduleModel");
const  Vehicle = require("../models/VehicleModel");  
const  Receiver  = require("../models/receiverModel");
const User  = require("../models/userModel");
const Payment  = require("../models/PaymentModel");
const notificationController = require('../controllers/notificationController');


const mongoose = require("mongoose");

const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const authMiddleware=require("../middleware/auth");



// Register a new driver (Save username & password directly)
router.post("/driver/login", async (req, res) => {
  try {
      const { email, password } = req.body;

      console.log(`Login attempt for: ${email}`); // Log the attempt

      const driver = await Driver.findOne({ email });
      if (!driver) {
          console.log(`Login failed - driver not found: ${email}`);
          return res.status(401).json({ 
              success: false,
              message: "Invalid credentials" 
          });
      }

      const isMatch = await bcrypt.compare(password, driver.password);
      
      if (!isMatch) {
          console.log(`Login failed - invalid password for: ${email}`);
          return res.status(401).json({ 
              success: false,
              message: "Invalid credentials" 
          });
      }

      console.log(`Login successful for driver: ${email}`); 
      
        // Generate JWT token 
    
        const token = jwt.sign(
          { driverId: driver._id, email: driver.email },
          process.env.MOBILE_JWT_SECRET , 
          { expiresIn: '3h' }
      );


      const driverData = driver.toObject();
      delete driverData.password;

      res.status(200).json({ 
          success: true,
          message: "Login successful", 
          token,
          driverId: driver._id,
          driver: driverData
      });

  } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
          success: false,
          message: "Error during login",
          error: process.env.NODE_ENV === 'development' ? error.message : null
      });
  }
});


//To get vehicleId
router.get('/driver_vehicle', authMiddleware, async (req, res) => {
  try {
    const driverId  = req.user.driverId;

    // 1. Find the driver (with populate)
    const driver = await Driver.findById(driverId).populate('vehicleId');

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (!driver.vehicleId) {
      return res.status(404).json({ message: "No vehicle assigned" });
    }

    res.json({
      success: true,
      message: "Vehicle details retrieved",
      data: {
        vehicle: {
          id: driver.vehicleId._id,
          
        }
      }
    });

  } catch (error) {
    console.error('[Driver Vehicle Error]', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});


router.get('/vehicle-parcels', authMiddleware, async (req, res) => {
  try {
    const { vehicleId, scheduleDate } = req.query;

    if (!vehicleId || !scheduleDate) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId and scheduleDate are required',
      });
    }

    const schedules = await VehicleSchedule.find({
      vehicle: vehicleId,
      scheduleDate: {
        $gte: new Date(`${scheduleDate}T00:00:00`),
        $lte: new Date(`${scheduleDate}T23:59:59`),
      },
    }).populate({
      path: 'assignedParcels',
      populate: [
        { path: 'senderId', model: 'User', select: 'fName lName contact address' },
        { path: 'receiverId', model: 'Receiver', select: 'receiverFullName receiverContact' },
        { path: 'paymentId', model: 'Payment', select: 'paymentMethod amount paymentStatus' },
      ],
    });

    if (!schedules.length) {
      return res.json({
        success: true,
        data: { morningParcels: [], eveningParcels: [] },
      });
    }

    const formattedParcels = schedules.flatMap((schedule) =>
      schedule.assignedParcels.map((parcel) => {
        const isPickup = parcel.status === 'PendingPickup';
        const userData = isPickup
          ? {
              name: `${parcel.senderId?.fName || ''} ${parcel.senderId?.lName || ''}`.trim(),
              phone: parcel.senderId?.contact,
              address: parcel.pickupInformation?.address,
            }
          : {
              name: parcel.receiverId?.receiverFullName,
              phone: parcel.receiverId?.receiverContact,
              address: parcel.deliveryInformation?.deliveryAddress,
            };

        return {
          _id: parcel._id,
          parcelId: parcel.parcelId,
          trackingNo: parcel.trackingNo,
          status: parcel.status,
          isPickup,
          timeSlot: schedule.timeSlot,
          scheduleDate: schedule.scheduleDate,
          customerName: userData.name || 'N/A',
          phone: userData.phone || 'Not provided',
          address: userData.address || 'Not provided',
          payment: {
            method: parcel.paymentId?.paymentMethod || (isPickup ? 'Online' : 'COD'),
            amount: parcel.paymentId?.amount || 0,
            paymentStatus: parcel.paymentId?.paymentStatus || 'pending',
          },
        };
      })
    );

    const morningParcels = formattedParcels.filter((p) =>
      String(p.timeSlot).includes('08:00 - 12:00')
    );

    const eveningParcels = formattedParcels.filter((p) =>
      String(p.timeSlot).includes('13:00 - 17:00')
    );

    res.json({
      success: true,
      data: { morningParcels, eveningParcels },
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});


router.post("/updateParcelStatus", authMiddleware, async (req, res) => {
  try {
    const { parcelId, status, paymentMethod, isPaid, amount } = req.body;

    const parcel = await Parcel.findOne({ parcelId: parcelId }).populate("paymentId");
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (status === 'PickedUp' && parcel.status !== 'PendingPickup') {
      return res.status(400).json({ message: `Invalid status change from ${parcel.status} to PickedUp` });
    }

    if (status === 'Delivered' && parcel.status !== 'DeliveryDispatched') {
      return res.status(400).json({ message: `Invalid status change from ${parcel.status} to Delivered` });
    }

    if (status === 'Delivered' && paymentMethod === 'COD') {
      if (!isPaid) {
        return res.status(400).json({ message: "Payment must be collected for COD parcels" });
      }
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid payment amount is required for COD parcels" });
      }
    }

    const updateData = {
      status,
      ...(status === 'Delivered' && { deliveredAt: new Date() })
    };

    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId: parcelId },
      updateData,
      { new: true }
    );

    // Payment logic for COD
    if (status === 'Delivered') {
      try {
        let payment;

        if (parcel.paymentId) {
          payment = await Payment.findById(parcel.paymentId);
          if (payment) {
            payment.paymentStatus = 'paid';
            payment.paidAt = new Date();
            payment.paymentMethod = paymentMethod || payment.paymentMethod;
            payment.amount = amount || payment.amount;
            payment.parcelId = payment.parcelId || parcel._id;
            await payment.save();
          }
        } else if (paymentMethod === 'COD') {
          payment = new Payment({
            paymentMethod: 'COD',
            paymentStatus: 'paid',
            amount: amount,
            paidAt: new Date(),
            parcelId: parcel._id
          });
          await payment.save();
          parcel.paymentId = payment._id;
          await parcel.save();
        }

        console.log('Payment processed:', payment ? payment._id : 'No payment needed');
      } catch (paymentError) {
        console.error('Payment update error:', paymentError);
        return res.status(500).json({
          success: false,
          message: "Parcel updated but payment processing failed",
          error: paymentError.message
        });
      }
    }

    // Notification logic added here
    try {
      const userId = parcel.senderId; // Sender is the customer
      let message = '';
      let type = '';

      if (status === 'PickedUp') {
        message = `Your parcel #${parcel.parcelId} has been picked up`;
        type = 'parcel_picked_up';
      } else if (status === 'Delivered') {
        message = `Your parcel #${parcel.parcelId} has been delivered`;
        type = 'parcel_delivered';
      }

      if (userId && message) {
        await notificationController.createNotification(
          userId,
          message,
          type,
          { id: parcel._id, type: 'Parcel' }
        );
        console.log(`Notification sent to user ${userId}: ${message}`);
      }
    } catch (notifyErr) {
      console.error('Notification creation failed:', notifyErr);
    }

    return res.status(200).json({
      success: true,
      message: `Parcel status updated to ${status}`,
      data: updatedParcel
    });

  } catch (error) {
    console.error("Error updating parcel status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});


//Profile picture upload
router.put("/drivers/:email/profilepicture",authMiddleware, async (req, res) => {
  try {
      const { profilePicture } = req.body;
      if (!profilePicture) {
          return res.status(400).json({ message: "No image provided" });
      }

      const updatedDriver = await Driver.findOneAndUpdate(
          { email: req.params.email }, 
          { profilePicture: profilePicture }, 
          { new: true } // Return updated document
      );

      if (!updatedDriver) {
          return res.status(404).json({ message: "Driver not found" });
      }

      res.status(200).json(updatedDriver);
  } catch (error) {
      console.error("Error saving profile picture:", error);
      res.status(500).json({ message: "Server error", error });
  }
});

  // Fetch driver details by email
  router.get("/driver/email/:email",authMiddleware, async (req, res) => {
    try {
      const driver = await Driver.findOne({ email: req.params.email });
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.status(200).json(driver);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

    // Fetch all parcels with receiver details
router.get('/parcels',authMiddleware, async (req, res) => {
    try {
      const parcels = await Parcel.find({})
        .populate('receiverId', 'fullName address') 
        .select('parcelId trackingNo receiverId status'); 
      res.json(parcels);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch parcels' });
    }
  });


router.get('/pickup-summary',authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.query;
    
    // 1. First validate the ID format
    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid driver ID format',
        receivedId: driverId
      });
    }

    // 2. Use new keyword with ObjectId
    const pickups = await Pickup.find({ 
      driverId: new mongoose.Types.ObjectId(driverId) 
    }).populate('parcelId', 'status');

    // 3. Calculate counts
    const assignedCount = pickups.length;
    const pickedUpCount = pickups.filter(p => 
      p.pickedUpTime || p.parcelId?.status === 'PickedUp'
    ).length;

    res.json({
      success: true,
      assignedCount,
      pickedUpCount,
      pendingCount: assignedCount - pickedUpCount
    });

  } catch (error) {
    console.error('Pickup summary error:', {
      error: error.message,
      query: req.query,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Database operation failed'
    });
  }
});

  router.get('/delivery-summary',authMiddleware, async (req, res) => {
    try {
      const { driverId } = req.query;
  
      // 1. Get all parcels assigned to this driver for delivery
      const parcels = await Parcel.find({
        deliveryDriver: driverId,
        status: { $in: ['Ready for Delivery', 'Out for Delivery', 'Delivered'] }
      });
  
      // 2. Calculate counts
      const assignedCount = parcels.length;
      const deliveredCount = parcels.filter(p => 
        p.status === 'Delivered'
      ).length;
      const pendingCount = assignedCount - deliveredCount;
  
      res.json({
        success: true,
        assignedCount,
        deliveredCount,
        pendingCount
      });
  
    } catch (error) {
      console.error('Delivery summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch delivery summary'
      });
    }
  });

  
  router.get('/pickup-parcels',authMiddleware, async (req, res) => {
    try {
        const { driverId } = req.query;
        
        // Validate ID exists
        if (!driverId) {
            return res.status(400).json({ 
                success: false,
                error: 'driverId is required' 
            });
        }

        // Convert custom ID to ObjectId if needed
        let queryId;
        if (driverId.match(/^DRIVER\d+$/)) {
            const driver = await Driver.findOne({ customId: driverId }).select('_id');
            if (!driver) {
                return res.status(404).json({
                    success: false,
                    error: 'Driver not found' 
                });
            }
            queryId = driver._id;
        } else if (mongoose.Types.ObjectId.isValid(driverId)) {
            queryId = driverId;
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid driver ID format'
            });
        }

        // Fetch parcels with population
        const pickups = await Pickup.find({ driverId: queryId })
            .populate({
                path: 'parcelId',
                select: 'trackingNo receiverName pickupAddress status'
            })
            .lean();

        // Transform response
        const parcels = pickups.map(p => ({
            ...p.parcelId,
            pickupId: p._id,
            pickedUpTime: p.pickedUpTime
        }));

        res.json({ 
            success: true,
            parcels 
        });

    } catch (error) {
        console.error('Pickup parcels error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pickup parcels',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});


router.post('/driver/logout', authMiddleware, async (req, res) => {
  try {
    // If you are using token blacklisting, add the token to the blacklist here
    const token = req.headers.authorization?.split(' ')[1];
  

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log out',
    });
  }
});

// Get completed deliveries for a driver

router.get('/driver/:driverId/completed-deliveries', authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.params;

    //  Get the driver's vehicle ID
    const driver = await Driver.findById(driverId).populate('vehicleId');
    if (!driver || !driver.vehicleId) {
      return res.status(404).json({ message: 'Driver or vehicle not found' });
    }

    const vehicleId = driver.vehicleId._id;

    //  Find all schedules for that vehicle
    const schedules = await VehicleSchedule.find({ vehicle: vehicleId }).populate({
      path: 'assignedParcels',
      populate: [
        { path: 'senderId', model: 'User', select: 'fName lName contact address' },
        { path: 'receiverId', model: 'Receiver', select: 'receiverFullName receiverContact' },
        { path: 'paymentId', model: 'Payment', select: 'paymentMethod amount paymentStatus' },
      ]
    });

    //  Filter for delivered parcels
    const deliveredParcels = schedules.flatMap(schedule =>
      schedule.assignedParcels
        .filter(parcel => parcel.status === 'Delivered')
        .map(parcel => ({
          _id: parcel._id,
          parcelId: parcel.parcelId,
          trackingNo: parcel.trackingNo,
          status: parcel.status,
          deliveredAt: parcel.updatedAt,
          customerName: parcel.receiverId?.receiverFullName || 'N/A',
          address: parcel.deliveryInformation?.deliveryAddress || 'Not provided',
          phone: parcel.receiverId?.receiverContact || 'Not provided',
          payment: {
            method: parcel.paymentId?.paymentMethod || 'COD',
            amount: parcel.paymentId?.amount || 0,
            status: parcel.paymentId?.paymentStatus || 'pending'
          }
        }))
    );

    res.status(200).json({
      success: true,
      data: deliveredParcels
    });
  } catch (error) {
    console.error('Error fetching completed parcels:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


//   Get completed pickups for a driver

router.get('/driver/:driverId/completed-pickups', authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Get the driver's vehicle
    const driver = await Driver.findById(driverId).populate('vehicleId');
    if (!driver || !driver.vehicleId) {
      return res.status(404).json({ message: 'Driver or vehicle not found' });
    }

    const vehicleId = driver.vehicleId._id;

    // Get schedules assigned to that vehicle
    const schedules = await VehicleSchedule.find({ vehicle: vehicleId }).populate({
      path: 'assignedParcels',
      populate: [
        { path: 'senderId', model: 'User', select: 'fName lName contact address' },
        { path: 'receiverId', model: 'Receiver', select: 'receiverFullName receiverContact' },
        { path: 'paymentId', model: 'Payment', select: 'paymentMethod amount paymentStatus' },
      ]
    });

    // Filter for PickedUp parcels (i.e., completed pickups)
    const pickedUpParcels = schedules.flatMap(schedule =>
      schedule.assignedParcels
        .filter(parcel => parcel.status === 'PickedUp')
        .map(parcel => ({
          _id: parcel._id,
          parcelId: parcel.parcelId,
          trackingNo: parcel.trackingNo,
          status: parcel.status,
          pickedUpAt: parcel.updatedAt,
          customerName: `${parcel.senderId?.fName || ''} ${parcel.senderId?.lName || ''}`.trim() || 'N/A',
          address: parcel.pickupInformation?.address || 'Not provided',
          phone: parcel.senderId?.contact || 'Not provided',
          payment: {
            method: parcel.paymentId?.paymentMethod || 'Online',
            amount: parcel.paymentId?.amount || 0,
            status: parcel.paymentId?.paymentStatus || 'pending'
          }
        }))
    );

    res.status(200).json({
      success: true,
      data: pickedUpParcels
    });
  } catch (error) {
    console.error('Error fetching completed pickups:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


  module.exports = router;