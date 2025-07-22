const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAscync");
const AppError = require("../utils/appError");
const Staff = require("../models/StaffModel");

const isStaffAuthenticated = catchAsync(async (req, res, next) => {
    // Get token from cookies or authorization header
    const token = req.cookies.StaffToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return next(
            new AppError("You are not logged in. Please log in to access this resource.", 401)
        );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if staff still exists and populate branch information
    const currentStaff = await Staff.findById(decoded._id).populate('branchId', 'location _id');

    if (!currentStaff) {
        return next(new AppError('The staff member belonging to this token no longer exists.', 401));
    }

    // Check if staff is active
    if (currentStaff.status !== 'active') {
        return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
    }

    // Grant access to protected route
    req.staff = currentStaff;
    next();
});

module.exports = isStaffAuthenticated;
