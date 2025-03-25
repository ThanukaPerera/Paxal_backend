//server.js
const express =require("express");
const mongoose=require('mongoose');
const bodyParser = require('body-parser');
const routes=require('./routes/customer');
const mobileRoutes = require("./routes/mobile");

require('dotenv').config();
const app = express();
const PORT =8000;


app.use(express.json({ limit: '10mb' })); 
app.use(bodyParser.json());
app.use(routes);
app.use("/api/mobile", mobileRoutes);


// MongoDB connection
const db_URL = process.env.MONGODB_URI;


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