const express =require("express");
const mongoose=require('mongoose');
const bodyParser = require('body-parser');
const routes=require('./routes/customer');
const auth = require("./routes/adminRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require('dotenv').config();





const app = express();
const PORT =8000;
 
app.use(
    cors({
      origin: "http://localhost:5173", // Your frontend URL
      credentials: true, // Allow credentials (cookies)
    })
  );
app.use(cookieParser());

// Increase the size limit for incoming JSON and URL-encoded data (This is for image upload increasing the size of input)
app.use(bodyParser.json({ limit: "50mb" }));  // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(routes);

app.use("/admin", auth);

const db_URL=process.env.DB_URL;

mongoose.connect(db_URL)
.then(()=>{
    console.log("Database connected successfully");
})
.catch((err)=>{
    console.log("DB connection error",err)
})

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`);
});