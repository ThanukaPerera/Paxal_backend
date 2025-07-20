const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const startServer = require("./config/startServer");

// Import routes
const shipmentRoutes = require("./routes/shipmentRoutes");
const parcelRoutes = require("./routes/parcelRoutes");
const driverRoutes = require("./routes/driverRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
// const customerRoutes = require("./routes/customer");
const adminRoutes = require("./routes/adminRoutes/index");
const staffRoutes = require("./routes/staff/staffRoutes");
const parcelRoutesStaff = require("./routes/staff/parcelRoutes");

// routes for the staff members
const pickupRoutes = require("./routes/staff/pickupRoutes");
const dropoffRoutes = require("./routes/staff/dropOffRoutes");
const userRoutes = require("./routes/staff/userRoutes");
const pickupScheduleRoutes = require("./routes/staff/pickupScheduleRoutes");
const deliveryScheduleRoutes = require("./routes/staff/deliveryScheduleRoutes")
const uiRoutes = require("./routes/staff/uiRoutes");
const parcelDeliveryRoutes = require("./routes/staff/parcelDeliveryRoutes");
const staffInquiryRoutes = require("./routes/staff/inquiryRoutes");
const qrCodeRoutes = require("./routes/staff/qrCodeRoutes");

const mobileRoutes = require("./routes/mobile");

//Deeraka
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const AppError = require("./utils/appError");
const branchRoutes = require("./routes/branchRoutes");
const userNotificationRoutes = require('./routes/userNotificationRoutes');

const app = express();



// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Your frontend URL
      "http://localhost:19006", // Expo dev server
      "exp://192.168.1.5:19000",//  physical device
    ], 
    credentials: true, // Allow credentials (cookies)
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));


app.use(bodyParser.json({ limit: "50mb" })); 

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// app.use(routes);



// Route mounting
app.use("/shipments", shipmentRoutes);
app.use("/parcels", parcelRoutes);
app.use("/drivers", driverRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/standard-shipments", notificationRoutes);

//Admin Routes
app.use("/api/admin", adminRoutes);

//Staff routes
app.use("/staff", staffRoutes);
app.use("/staff/lodging-management", parcelRoutesStaff);
app.use("/staff/lodging-management", pickupRoutes);
app.use("/staff/lodging-management", dropoffRoutes);
app.use("/staff/vehicle-schedules", pickupScheduleRoutes);
app.use("/staff/delivery-schedules", deliveryScheduleRoutes);
app.use("/staff/collection-management", parcelDeliveryRoutes)
app.use("/staff/inquiry-management", staffInquiryRoutes);
app.use("/staff/collection-management/qr-code", qrCodeRoutes);
app.use("/staff/ui", uiRoutes);

app.use("/staff", userRoutes);
app.use("/api/mobile", mobileRoutes);

//users api urls
app.use("/api/auth", userRouter);
app.use("/api/parcels", parcelRoutes); // Use parcel routes
app.use("/api/payment", paymentRouter);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/branches", branchRoutes);
app.use('/api/notifications',userNotificationRoutes); 



app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
})

app.use(globalErrorHandler);


startServer(app);
