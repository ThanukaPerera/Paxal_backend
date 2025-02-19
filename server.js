const express =require("express");
const mongoose=require('mongoose');

const app = express();
const port =8000;

const db_URL='mongodb+srv://AlgoRhythm-PAXAL:Sehara2002@pms.5jolo.mongodb.net/?retryWrites=true&w=majority&appName=PMS';

mongoose.connect(db_URL)
.then(()=>{
    console.log("Database connected successfully");
})
.catch((err)=>{
    console.log("DB connection error",err)
})

app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
});