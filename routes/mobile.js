//mobile.js
const express = require("express");
const Driver = require("../models/DriverModel");
const Parcel  = require("../models/parcelModel");
//const Pickup  = require("../models/PickupSchema");
const  VehicleSchedule  = require("../models/VehicleScheduleModel");
const  Vehicle = require("../models/VehicleModel");  
const  Receiver  = require("../models/receiverModel");
const User  = require("../models/userModel");
const Payment  = require("../models/PaymentModel");

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

      console.log(`Login successful for driver: ${email}`); // Success log
      
        // Generate JWT token (expires in 1 day)
       // console.log( process.env.MOBILE_JWT_SECRET);
        const token = jwt.sign(
          { driverId: driver._id, email: driver.email },
          process.env.MOBILE_JWT_SECRET , // Use a strong secret in production
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

    // 2. Return vehicle details
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

  
// Fetch Parcel Counts (Assigned, Picked Up, Pending)
router.get("/parcel-counts",authMiddleware, async (req, res) => {
    try {
        const assignedCount = await Parcel.countDocuments({ status: 'PendingPickup' });
        const pickedUpCount = await Parcel.countDocuments({ status: 'PickedUp' });
        const pendingCount = assignedCount - pickedUpCount;

        console.log('Assigned:', assignedCount);
        console.log('Picked Up:', pickedUpCount);
        console.log('Pending Pickup:', pendingCount);  
                // Send the counts as a response
        res.status(200).json({
            success: true,
            assignedCount,
            pickedUpCount,
            pendingCount
        });
    } catch (error) {
        console.error('Error fetching parcel counts:', error);
        res.status(500).json({ message: "Error fetching parcel counts", error });
    }
});

router.post("/updateParcelStatus", authMiddleware, async (req, res) => {
  try {
    const { parcelId, status, paymentMethod, isPaid, amount } = req.body;

    const parcel = await Parcel.findOne({ parcelId }).populate('paymentId');
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (status === 'PickedUp' && parcel.status !== 'PendingPickup') {
      return res.status(400).json({
        message: `Invalid status change from ${parcel.status} to PickedUp`,
      });
    }

    if (status === 'Delivered' && parcel.status !== 'DeliveryDispatched') {
      return res.status(400).json({
        message: `Invalid status change from ${parcel.status} to Delivered`,
      });
    }

    if (status === 'Delivered' && paymentMethod === 'COD' && !isPaid) {
      return res.status(400).json({
        message: 'Payment must be collected for COD parcels',
      });
    }

    const updateData = { status };
    if (status === 'Delivered') {
      updateData.deliveredAt = new Date();
    }

    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updateData,
      { new: true }
    );

    if (status === 'Delivered' && parcel.paymentId) {
      const payment = await Payment.findById(parcel.paymentId);
      if (payment) {
        payment.paymentStatus = 'paid';
        payment.paidAt = new Date();
        payment.paymentMethod = paymentMethod || payment.paymentMethod;
        payment.amount = amount || payment.amount;
        await payment.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Parcel status updated to ${status}`,
      data: updatedParcel,
    });
  } catch (error) {
    console.error('Error updating parcel status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
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
        .populate('receiverId', 'fullName address') // Populate receiver's name and address
        .select('parcelId trackingNo receiverId status'); // Select only required fields
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

  module.exports = router;