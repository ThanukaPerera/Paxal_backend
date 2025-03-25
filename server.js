const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const routes = require("./routes/customer");
const staffRoutes = require("./routes/staffRoutes");
const parcelRoutes = require("./routes/parcelRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = 8000;

app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true, // Allow credentials (cookies)
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(routes);


app.use("/staff", staffRoutes);
app.use("/staff/parcel", parcelRoutes);




// const db_URL='mongodb+srv://AlgoRhythm-PAXAL:Sehara2002@pms.5jolo.mongodb.net/?retryWrites=true&w=majority&appName=PMS';

mongoose
  .connect(db_URL)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log("DB connection error", err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
