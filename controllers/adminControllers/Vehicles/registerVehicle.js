const Vehicle = require("../../../models/vehicleModel");


const registerVehicle = async (req, res) => {
    try {
        
        // Find last vehicle ID and generate the next one
        const lastVehicle = await Vehicle.findOne().sort({ vehicleId: -1 }).lean();
        let nextVehicleId = "VEHICLE001"; // Default ID if no vehicles exist

        if (lastVehicle) {
            const lastIdNumber = parseInt(lastVehicle.vehicleId.replace("VEHICLE", ""), 10);
            nextVehicleId = `VEHICLE${String(lastIdNumber + 1).padStart(3, "0")}`;
        }

        // Create new vehicle with generated ID
        const vehicleData = {
            ...req.body,
            currentBranch:req.body.assignedBranch,
            vehicleId: nextVehicleId,
        };

        const vehicle = new Vehicle(vehicleData);
        const savedVehicle = await vehicle.save();

        res.status(201).json({ 
            message: "Vehicle registered successfully",
            vehicleId: savedVehicle.vehicleId,
            details: savedVehicle
        });
        
    } catch (error) {
        console.error("Vehicle registration error:", error);
        res.status(500).json({ 
            message: "Error registering vehicle",
            error: error.message 
        });
    }
};

module.exports = registerVehicle;