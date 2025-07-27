// const VehicleSchedule = require("../../../models/VehicleScheduleModel");
// const Vehicle = require("../../../models/VehicleModel");
// const Driver = require("../../../models/driverModel");
// const Branch = require("../../../models/BranchesModel");
// const mongoose = require("mongoose");

// /**
//  * Fetch vehicle schedules by type (pickup or delivery) with minimal route structure
//  * Returns detailed vehicle and driver information
//  */
// const getVehicleSchedulesByType = async (req, res) => {
//   try {
//     const { type } = req.params; // pickup or delivery
//     const {
//       date,           // Specific date (YYYY-MM-DD)
//       branchId,       // Filter by branch
//       timeSlot,       // Filter by time slot
//       status = 'all'  // Filter by status (active, completed, etc.)
//     } = req.query;

//     // Validate type parameter
//     if (!type || !['pickup', 'delivery'].includes(type.toLowerCase())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid type. Must be 'pickup' or 'delivery'"
//       });
//     }

//     // Build filter object
//     const filter = { type: type.toLowerCase() };
    
//     if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
//       filter.branch = branchId;
//     }
    
//     if (timeSlot && ['08:00 - 12:00', '13:00 - 17:00'].includes(timeSlot)) {
//       filter.timeSlot = timeSlot;
//     }
    
//     if (date) {
//       const targetDate = new Date(date);
//       const nextDay = new Date(targetDate);
//       nextDay.setDate(nextDay.getDate() + 1);
      
//       filter.scheduleDate = {
//         $gte: targetDate,
//         $lt: nextDay
//       };
//     }

//     // Fetch schedules with comprehensive details
//     const schedules = await VehicleSchedule.find(filter)
//       .populate({
//         path: 'vehicle',
//         select: 'vehicleId registrationNo vehicleType capableVolume capableWeight available assignedBranch currentBranch',
//         populate: [
//           {
//             path: 'assignedBranch',
//             select: 'branchId location contact'
//           },
//           {
//             path: 'currentBranch', 
//             select: 'branchId location contact'
//           }
//         ]
//       })
//       .populate({
//         path: 'branch',
//         select: 'branchId location contact'
//       })
//       .populate({
//         path: 'assignedParcels',
//         select: 'parcelId trackingNo status itemType itemSize submittingType receivingType senderId receiverId',
//         populate: [
//           {
//             path: 'from',
//             select: 'branchId location contact'
//           },
//           {
//             path: 'to',
//             select: 'branchId location contact'
//           },
//           {
//             path: 'senderId',
//             select: 'name email contactNo'
//           },
//           {
//             path: 'receiverId',
//             select: 'name email contactNo'
//           }
//         ]
//       })
//       .sort({ scheduleDate: 1, timeSlot: 1 })
//       .lean();

    // console.log(`Found ${schedules.length} ${type} schedules`);

//     // Get unique vehicle IDs to fetch their drivers
//     const vehicleIds = [...new Set(schedules.map(schedule => schedule.vehicle?._id).filter(Boolean))];
    
//     // Fetch drivers for all vehicles in one query
//     const drivers = await Driver.find({ 
//       vehicleId: { $in: vehicleIds } 
//     })
//     .populate({
//       path: 'branchId',
//       select: 'branchId location contact'
//     })
//     .lean();

//     // Create a map of vehicleId to driver for quick lookup
//     const vehicleDriverMap = {};
//     drivers.forEach(driver => {
//       vehicleDriverMap[driver.vehicleId.toString()] = driver;
//     });

//     // Process the schedule data with enhanced information
//     const processedSchedules = schedules.map(schedule => {
//       const vehicle = schedule.vehicle;
//       const driver = vehicle ? vehicleDriverMap[vehicle._id.toString()] : null;
      
//       // Calculate utilization percentages
//       const volumeUtilization = vehicle?.capableVolume > 0 ? 
//         ((schedule.totalVolume / vehicle.capableVolume) * 100).toFixed(2) : 0;
//       const weightUtilization = vehicle?.capableWeight > 0 ? 
//         ((schedule.totalWeight / vehicle.capableWeight) * 100).toFixed(2) : 0;

//       // Determine schedule status
//       const currentDate = new Date();
//       const scheduleDateTime = new Date(schedule.scheduleDate);
//       let scheduleStatus = 'upcoming';
      
//       if (scheduleDateTime.toDateString() === currentDate.toDateString()) {
//         scheduleStatus = 'today';
//       } else if (scheduleDateTime < currentDate) {
//         scheduleStatus = 'completed';
//       }

//       return {
//         // Schedule Details
//         scheduleId: schedule._id,
//         type: schedule.type,
//         scheduleDate: schedule.scheduleDate,
//         timeSlot: schedule.timeSlot,
//         status: scheduleStatus,
        
//         // Capacity Information
//         capacity: {
//           totalVolume: schedule.totalVolume,
//           totalWeight: schedule.totalWeight,
//           parcelCount: schedule.assignedParcels?.length || 0,
//           maxVolume: vehicle?.capableVolume || 0,
//           maxWeight: vehicle?.capableWeight || 0,
//           volumeUtilization: `${volumeUtilization}%`,
//           weightUtilization: `${weightUtilization}%`,
//           hasCapacity: vehicle ? 
//             (schedule.totalVolume < vehicle.capableVolume && schedule.totalWeight < vehicle.capableWeight) : false
//         },
        
//         // Vehicle Details
//         vehicle: vehicle ? {
//           vehicleId: vehicle.vehicleId,
//           registrationNo: vehicle.registrationNo,
//           vehicleType: vehicle.vehicleType,
//           available: vehicle.available,
//           assignedBranch: vehicle.assignedBranch ? {
//             branchId: vehicle.assignedBranch.branchId,
//             location: vehicle.assignedBranch.location,
//             contact: vehicle.assignedBranch.contact
//           } : null,
//           currentBranch: vehicle.currentBranch ? {
//             branchId: vehicle.currentBranch.branchId,
//             location: vehicle.currentBranch.location,
//             contact: vehicle.currentBranch.contact
//           } : null
//         } : null,
        
//         // Driver Details
//         driver: driver ? {
//           driverId: driver.driverId,
//           name: driver.name,
//           email: driver.email,
//           contactNo: driver.contactNo,
//           licenseId: driver.licenseId,
//           driverBranch: driver.branchId ? {
//             branchId: driver.branchId.branchId,
//             location: driver.branchId.location,
//             contact: driver.branchId.contact
//           } : null
//         } : {
//           status: 'no_driver_assigned',
//           message: 'No driver assigned to this vehicle'
//         },
        
//         // Schedule Branch
//         scheduleBranch: schedule.branch ? {
//           branchId: schedule.branch.branchId,
//           location: schedule.branch.location,
//           contact: schedule.branch.contact
//         } : null,
        
//         // Assigned Parcels
//         parcels: schedule.assignedParcels?.map(parcel => ({
//           parcelId: parcel.parcelId,
//           trackingNo: parcel.trackingNo,
//           status: parcel.status,
//           itemType: parcel.itemType,
//           itemSize: parcel.itemSize,
//           submittingType: parcel.submittingType,
//           receivingType: parcel.receivingType,
//           route: {
//             from: parcel.from ? {
//               branchId: parcel.from.branchId,
//               location: parcel.from.location
//             } : null,
//             to: parcel.to ? {
//               branchId: parcel.to.branchId,
//               location: parcel.to.location
//             } : null
//           },
//           sender: parcel.senderId ? {
//             name: parcel.senderId.name,
//             email: parcel.senderId.email,
//             contactNo: parcel.senderId.contactNo
//           } : null,
//           receiver: parcel.receiverId ? {
//             name: parcel.receiverId.name,
//             email: parcel.receiverId.email,
//             contactNo: parcel.receiverId.contactNo
//           } : null
//         })) || [],
        
//         // Timestamps
//         createdAt: schedule.createdAt,
//         updatedAt: schedule.updatedAt
//       };
//     });

//     // Generate summary for this type
//     const summary = {
//       totalSchedules: processedSchedules.length,
//       totalParcels: processedSchedules.reduce((sum, schedule) => sum + schedule.capacity.parcelCount, 0),
//       totalVolume: processedSchedules.reduce((sum, schedule) => sum + schedule.capacity.totalVolume, 0),
//       totalWeight: processedSchedules.reduce((sum, schedule) => sum + schedule.capacity.totalWeight, 0),
//       schedulesWithDrivers: processedSchedules.filter(s => s.driver.driverId).length,
//       schedulesWithoutDrivers: processedSchedules.filter(s => !s.driver.driverId).length,
//       statusBreakdown: {
//         upcoming: processedSchedules.filter(s => s.status === 'upcoming').length,
//         today: processedSchedules.filter(s => s.status === 'today').length,
//         completed: processedSchedules.filter(s => s.status === 'completed').length
//       }
//     };

//     return res.status(200).json({
//       success: true,
//       message: `${type.charAt(0).toUpperCase() + type.slice(1)} schedules fetched successfully`,
//       data: {
//         type: type.toLowerCase(),
//         schedules: processedSchedules,
//         summary,
//         filters: {
//           date: date || null,
//           branchId: branchId || null,
//           timeSlot: timeSlot || null
//         }
//       }
//     });

//   } catch (error) {
//     console.error(`Error fetching ${type} schedules:`, error);
//     return res.status(500).json({
//       success: false,
//       message: `Failed to fetch ${type} schedules`,
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };

// module.exports = getVehicleSchedulesByType;


const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const Driver = require("../../../models/driverModel");
const Branch = require("../../../models/BranchesModel");
const mongoose = require("mongoose");

/**
 * Helper function to parse and validate date input
 * Returns a proper Date object or null if invalid
 */
const parseDate = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    // Handle different date input formats
    let date;
    
    if (typeof dateInput === 'string') {
      // Check if it's in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(year, month - 1, day); // Month is 0-indexed in JS
      } else {
        // Try parsing as ISO string or other formats
        date = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      date = new Date(dateInput);
    } else {
      date = new Date(dateInput);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input:', dateInput);
      return null;
    }
    
    // Reset time to start of day in local timezone
    date.setHours(0, 0, 0, 0);
    return date;
  } catch (error) {
    console.error('Error parsing date:', dateInput, error);
    return null;
  }
};

/**
 * Helper function to create date range for filtering
 * Returns start and end of day in local timezone
 */
const createDateRange = (dateInput) => {
  const startDate = parseDate(dateInput);
  if (!startDate) return null;
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1); // Next day
  
  return {
    $gte: startDate,
    $lt: endDate
  };
};

/**
 * Generate user-friendly schedule identifier
 */
const generateScheduleDisplayId = (schedule, vehicle, type) => {
  const vehicleReg = vehicle?.registrationNo || 'UNKNOWN';
  const date = schedule.scheduleDate ? new Date(schedule.scheduleDate).toLocaleDateString('en-GB').replace(/\//g, '') : 'NODATE';
  const time = schedule.timeSlot ? schedule.timeSlot.replace(/[:\s-]/g, '') : 'NOTIME';
  const typePrefix = type?.charAt(0).toUpperCase() || 'S';
  
  return `${typePrefix}-${vehicleReg}-${date}-${time}`;
};

/**
 * Fetch vehicle schedules by type (pickup or delivery) with comprehensive filtering
 * Supports filtering by date, branchId, timeSlot, and status
 */
const getVehicleSchedulesByType = async (req, res) => {
  try {
    const { type } = req.params; // pickup or delivery
    const {
      date,           // Specific date (YYYY-MM-DD)
      branchId,       // Filter by branch
      timeSlot,       // Filter by time slot (morning, afternoon, or full time like "08:00 - 12:00")
      status = 'all'  // Filter by status (active, completed, upcoming, etc.)
    } = req.query; // Use req.query for GET requests

    console.log('=== REQUEST DEBUG INFO ===');
    console.log('req.params:', req.params);
    console.log('req.query:', req.query);
    console.log('Filters received:', { type, date, branchId, timeSlot, status });
    console.log('========================');

    console.log('Request params:', { type, date, branchId, timeSlot, status });

    // Validate type parameter
    if (!type || !['pickup', 'delivery'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'pickup' or 'delivery'"
      });
    }

    // Build filter object
    const filter = { type: type.toLowerCase() };
    
    // Handle branch filtering
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      filter.branch = branchId;
    }
    
    // Handle time slot filtering - support both simple and full time formats
    if (timeSlot) {
      // Map simple time slot names to full time ranges
      const timeSlotMap = {
        'morning': '08:00 - 12:00',
        'afternoon': '13:00 - 17:00',
        'evening': '18:00 - 22:00'
      };
      
      // Use mapped value if it's a simple name, otherwise use as-is
      const actualTimeSlot = timeSlotMap[timeSlot.toLowerCase()] || timeSlot;
      
      if (['08:00 - 12:00', '13:00 - 17:00', '18:00 - 22:00'].includes(actualTimeSlot)) {
        filter.timeSlot = actualTimeSlot;
      }
    }
    
    // Handle date filtering with improved date parsing
    if (date) {
      const dateRange = createDateRange(date);
      if (dateRange) {
        filter.scheduleDate = dateRange;
        console.log('Date filter applied:', { 
          originalDate: date, 
          dateRange: {
            gte: dateRange.$gte.toISOString(),
            lt: dateRange.$lt.toISOString()
          }
        });
      } else {
        console.warn('Invalid date provided, skipping date filter:', date);
      }
    }

    console.log('Final filter object:', filter);

    // Fetch schedules with comprehensive details
    const schedules = await VehicleSchedule.find(filter)
      .populate({
        path: 'vehicle',
        select: 'vehicleId registrationNo vehicleType capableVolume capableWeight available assignedBranch currentBranch',
        populate: [
          {
            path: 'assignedBranch',
            select: 'branchId location contact'
          },
          {
            path: 'currentBranch', 
            select: 'branchId location contact'
          }
        ]
      })
      .populate({
        path: 'branch',
        select: 'branchId location contact'
      })
      .populate({
        path: 'assignedParcels',
        select: 'parcelId trackingNo status itemType itemSize submittingType receivingType senderId receiverId from to',
        populate: [
          {
            path: 'from',
            select: 'branchId location contact'
          },
          {
            path: 'to',
            select: 'branchId location contact'
          },
          {
            path: 'senderId',
            select: 'name email contactNo'
          },
          {
            path: 'receiverId',
            select: 'name email contactNo'
          }
        ]
      })
      .sort({ scheduleDate: 1, timeSlot: 1 })
      .lean();

    console.log(`Found ${schedules.length} ${type} schedules`);

    // Filter by status if not 'all'
    let filteredSchedules = schedules;
    if (status && status !== 'all') {
      filteredSchedules = schedules.filter(schedule => {
        // Determine schedule status based on date
        const currentDate = new Date();
        const scheduleDate = new Date(schedule.scheduleDate);
        
        // Reset time for comparison
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const scheduleDateOnly = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());
        
        let scheduleStatus = 'upcoming';
        if (scheduleDateOnly.getTime() === currentDateOnly.getTime()) {
          scheduleStatus = 'today';
        } else if (scheduleDateOnly < currentDateOnly) {
          scheduleStatus = 'completed';
        }
        
        // Support both simple status names and specific statuses
        const statusMap = {
          'active': ['today', 'upcoming'],
          'pending': ['upcoming'],
          'today': ['today'],
          'completed': ['completed']
        };
        
        const allowedStatuses = statusMap[status.toLowerCase()] || [status.toLowerCase()];
        return allowedStatuses.includes(scheduleStatus);
      });
      
      console.log(`After status filter (${status}): ${filteredSchedules.length} schedules`);
    }



    // Get unique vehicle IDs to fetch their drivers
    const vehicleIds = [...new Set(filteredSchedules.map(schedule => schedule.vehicle?._id).filter(Boolean))];
    
    // Fetch drivers for all vehicles in one query
    const drivers = await Driver.find({ 
      vehicleId: { $in: vehicleIds } 
    })
    .populate({
      path: 'branchId',
      select: 'branchId location contact'
    })
    .lean();

    // Create a map of vehicleId to driver for quick lookup
    const vehicleDriverMap = {};
    drivers.forEach(driver => {
      if (driver.vehicleId) {
        vehicleDriverMap[driver.vehicleId.toString()] = driver;
      }
    });

    

    // Process the schedule data with enhanced information
    const processedSchedules = filteredSchedules.map(schedule => {
      const vehicle = schedule.vehicle;
      const driver = vehicle ? vehicleDriverMap[vehicle._id.toString()] : null;
      
      // Generate user-friendly display ID
      const displayId = generateScheduleDisplayId(schedule, vehicle, type);
      
      // Calculate utilization percentages
      const volumeUtilization = vehicle?.capableVolume > 0 ? 
        ((schedule.totalVolume / vehicle.capableVolume) * 100).toFixed(2) : 0;
      const weightUtilization = vehicle?.capableWeight > 0 ? 
        ((schedule.totalWeight / vehicle.capableWeight) * 100).toFixed(2) : 0;

      // Determine schedule status based on date
      const currentDate = new Date();
      const scheduleDate = new Date(schedule.scheduleDate);
      let scheduleStatus = 'upcoming';
      
      // Reset time for comparison
      const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const scheduleDateOnly = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());
      
      if (scheduleDateOnly.getTime() === currentDateOnly.getTime()) {
        scheduleStatus = 'today';
      } else if (scheduleDateOnly < currentDateOnly) {
        scheduleStatus = 'completed';
      }

      return {
        // Schedule Details with user-friendly ID
        scheduleId: displayId, // User-friendly ID instead of ObjectId
        internalId: schedule._id, // Keep internal ID for system use
        type: schedule.type,
        scheduleDate: schedule.scheduleDate,
        timeSlot: schedule.timeSlot,
        status: scheduleStatus,
        
        // Capacity Information
        capacity: {
          totalVolume: schedule.totalVolume || 0,
          totalWeight: schedule.totalWeight || 0,
          parcelCount: schedule.assignedParcels?.length || 0,
          maxVolume: vehicle?.capableVolume || 0,
          maxWeight: vehicle?.capableWeight || 0,
          volumeUtilization: `${volumeUtilization}%`,
          weightUtilization: `${weightUtilization}%`,
          hasCapacity: vehicle ? 
            (schedule.totalVolume < vehicle.capableVolume && schedule.totalWeight < vehicle.capableWeight) : false
        },
        
        // Vehicle Details
        vehicle: vehicle ? {
          vehicleId: vehicle.vehicleId,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          available: vehicle.available,
          assignedBranch: vehicle.assignedBranch ? {
            branchId: vehicle.assignedBranch.branchId,
            location: vehicle.assignedBranch.location,
            contact: vehicle.assignedBranch.contact
          } : null,
          currentBranch: vehicle.currentBranch ? {
            branchId: vehicle.currentBranch.branchId,
            location: vehicle.currentBranch.location,
            contact: vehicle.currentBranch.contact
          } : null
        } : null,
        
        // Driver Details
        driver: driver ? {
          driverId: driver.driverId,
          name: driver.name,
          email: driver.email,
          contactNo: driver.contactNo,
          licenseId: driver.licenseId,
          driverBranch: driver.branchId ? {
            branchId: driver.branchId.branchId,
            location: driver.branchId.location,
            contact: driver.branchId.contact
          } : null
        } : {
          status: 'no_driver_assigned',
          message: 'No driver assigned to this vehicle',
          name: null,
          contactNo: null
        },
        
        // Schedule Branch
        scheduleBranch: schedule.branch ? {
          branchId: schedule.branch.branchId,
          location: schedule.branch.location,
          contact: schedule.branch.contact
        } : null,
        
        // Assigned Parcels with better tracking display
        parcels: schedule.assignedParcels?.map((parcel, index) => ({
          parcelId: parcel.parcelId,
          trackingNo: parcel.trackingNo || `TRACK-${Date.now()}-${index}`, // Generate if missing
          status: parcel.status,
          itemType: parcel.itemType,
          itemSize: parcel.itemSize,
          submittingType: parcel.submittingType,
          receivingType: parcel.receivingType,
          route: {
            from: parcel.from ? {
              branchId: parcel.from.branchId,
              location: parcel.from.location
            } : null,
            to: parcel.to ? {
              branchId: parcel.to.branchId,
              location: parcel.to.location
            } : null
          },
          sender: parcel.senderId ? {
            name: parcel.senderId.name,
            email: parcel.senderId.email,
            contactNo: parcel.senderId.contactNo
          } : null,
          receiver: parcel.receiverId ? {
            name: parcel.receiverId.name,
            email: parcel.receiverId.email,
            contactNo: parcel.receiverId.contactNo
          } : null
        })) || [],
        
        // Timestamps
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      };
    });

    // Generate summary for this type
    const summary = {
      totalSchedules: processedSchedules.length,
      totalParcels: processedSchedules.reduce((sum, schedule) => sum + schedule.capacity.parcelCount, 0),
      totalVolume: processedSchedules.reduce((sum, schedule) => sum + schedule.capacity.totalVolume, 0),
      totalWeight: processedSchedules.reduce((sum, schedule) => sum + schedule.capacity.totalWeight, 0),
      schedulesWithDrivers: processedSchedules.filter(s => s.driver.driverId).length,
      schedulesWithoutDrivers: processedSchedules.filter(s => !s.driver.driverId).length,
      statusBreakdown: {
        upcoming: processedSchedules.filter(s => s.status === 'upcoming').length,
        today: processedSchedules.filter(s => s.status === 'today').length,
        completed: processedSchedules.filter(s => s.status === 'completed').length
      }
    };

    

    return res.status(200).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} schedules fetched successfully`,
      data: {
        type: type.toLowerCase(),
        schedules: processedSchedules,
        summary,
        filters: {
          date: date || null,
          branchId: branchId || null,
          timeSlot: timeSlot || null,
          status: status || 'all',
          appliedDateRange: date ? createDateRange(date) : null
        }
      }
    });

  } catch (error) {
    console.error(`Error fetching ${req.params?.type || 'unknown'} schedules:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params?.type || 'vehicle'} schedules`,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Internal server error'
    });
  }
};

module.exports = getVehicleSchedulesByType;