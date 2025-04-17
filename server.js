//server.js
const express =require("express");
const mongoose=require('mongoose');
const bodyParser = require('body-parser');
//const routes=require('./routes/customer');
const mobileRoutes = require("./routes/mobile");

const cors = require('cors');

require('dotenv').config();
const app = express();
const PORT =8000;

// Middleware
app.use(cors({
    origin: [
      'http://localhost:19006',       // Expo dev server
      'exp://192.168.43.246:19000'    // Your physical device
    ]
  }));

app.use(express.json({ limit: '10mb' })); 
app.use(bodyParser.json());
//app.use(routes);
app.use("/api/mobile", mobileRoutes);


// MongoDB connection
const db_URL = process.env.DB_URL;

mongoose.connect(db_URL)
.then(()=>console.log("Database connected successfully"))

.catch((err)=>console.log("DB connection error",err))

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`);
});