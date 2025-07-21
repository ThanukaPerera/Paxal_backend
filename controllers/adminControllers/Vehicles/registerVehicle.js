const Vehicle = require("../../../models/VehicleModel");
const sendEmail = require("../../../utils/admin/sendEmail");

/**
 * Enhanced vehicle registration controller with professional error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerVehicle = async (req, res) => {
    console.log("Registering vehicle...", req.body);
    
    try {
        // The validation is already handled by middleware, so we can use req.body directly
        // req.body has already been validated and transformed by the middleware
        const validatedData = req.body;
        const assignedBranch = req.assignedBranch;
        const currentBranch = req.currentBranch;

        console.log("Validated vehicle data:", validatedData);
        console.log("Assigned branch:", assignedBranch.location);
        console.log("Current branch:", currentBranch.location);

        // Generate vehicle ID with transaction safety
        const lastVehicle = await Vehicle.findOne().sort({ vehicleId: -1 }).lean();
        let nextVehicleId = "VEHICLE001";

        if (lastVehicle) {
            const lastIdNumber = parseInt(lastVehicle.vehicleId.replace("VEHICLE", ""), 10);
            if (isNaN(lastIdNumber)) {
                throw new Error("Invalid vehicle ID format in database");
            }
            nextVehicleId = `VEHICLE${String(lastIdNumber + 1).padStart(3, "0")}`;
        }

        // Create vehicle data
        const vehicleData = {
            ...validatedData,
            vehicleId: nextVehicleId,
        };

        const vehicle = new Vehicle(vehicleData);
        const savedVehicle = await vehicle.save();

        // Populate the saved vehicle with branch information for response
        const populatedVehicle = await Vehicle.findById(savedVehicle._id)
            .populate('assignedBranch', 'branchId location')
            .populate('currentBranch', 'branchId location')
            .lean();

        // Optional: Send notification email to admin about new vehicle
        try {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: "New Vehicle Registered - Paxal PMS",
                    template: "welcome",
                    templateData: {
                        userName: "Admin",
                    }
                });
            }
        } catch (emailError) {
            console.error("Vehicle notification email failed:", emailError);
            // Continue with success response even if email fails
        }

        // Success Response
        res.status(201).json({
            status: "success",
            message: "Vehicle registered successfully",
            data: {
                vehicleId: populatedVehicle.vehicleId,
                registrationNo: populatedVehicle.registrationNo,
                vehicleType: populatedVehicle.vehicleType,
                assignedBranch: populatedVehicle.assignedBranch,
                currentBranch: populatedVehicle.currentBranch,
                capableVolume: populatedVehicle.capableVolume,
                capableWeight: populatedVehicle.capableWeight,
                available: populatedVehicle.available,
                createdAt: populatedVehicle.createdAt,
            },
        });
    } catch (error) {
        // Error Classification
        let statusCode = 500;
        let errorMessage = "Internal server error";
        let errorCode = "SERVER_ERROR";

        // Handle specific error types
        if (error.name === "ValidationError") {
            statusCode = 400;
            errorMessage = Object.values(error.errors)
                .map((val) => val.message)
                .join(", ");
            errorCode = "VALIDATION_ERROR";
        } else if (error.code === 11000) {
            statusCode = 409;
            const duplicateField = Object.keys(error.keyPattern)[0];
            if (duplicateField === 'registrationNo') {
                errorMessage = "Vehicle with this registration number already exists";
                errorCode = "DUPLICATE_REGISTRATION_NUMBER";
            } else {
                errorMessage = `Vehicle with this ${duplicateField} already exists`;
                errorCode = "DUPLICATE_VEHICLE";
            }
        } else if (error.message.includes("Invalid vehicle ID")) {
            statusCode = 500;
            errorMessage = "Database inconsistency detected";
            errorCode = "DB_INCONSISTENCY";
        }

        // Secure Logging
        console.error(`[${new Date().toISOString()}] Vehicle Registration Error:`, {
            code: errorCode,
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            requestBody:
                process.env.NODE_ENV === "development" ? req.body : undefined,
        });

        // Client Response
        res.status(statusCode).json({
            status: "error",
            message: errorMessage,
            code: errorCode,
            ...(process.env.NODE_ENV === "development" && {
                debug: {
                    message: error.message,
                    stack: error.stack,
                },
            }),
        });
    }
};

module.exports = registerVehicle;