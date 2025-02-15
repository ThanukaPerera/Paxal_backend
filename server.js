
const express =require("express");
const mongoose=require('mongoose');
const bodyParser = require('body-parser');
const routes=require('./routes/customer');

const app = express();
const PORT =8000;


app.use(bodyParser.json());
app.use(routes);




const db_URL='mongodb+srv://AlgoRhythm-PAXAL:Sehara2002@pms.5jolo.mongodb.net/?retryWrites=true&w=majority&appName=PMS';


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


