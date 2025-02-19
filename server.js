const express =require("express");
const mongoose=require('mongoose');
const bodyParser = require('body-parser');
const routes=require('./routes/customer');
const auth = require("./routes/auth");
require('dotenv').config();
const cors = require("cors");




const app = express();
const PORT =8000;
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from React app
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
  }));


app.use(bodyParser.json());
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