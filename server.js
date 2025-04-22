    const mongoose = require("mongoose");
    const cors = require("cors");
    const bodyParser =require("body-parser");
    const cookieParser = require("cookie-parser");
    const express = require("express");
    const globalErrorHandler = require("./controllers/errorController");
    const userRouter=require("./routes/userRoutes");
    const paymentRouter=require("./routes/paymentRoutes");
    const inquiryRoutes = require("./routes/inquiryRoutes"); 
   const AppError = require("./utils/appError");
    const parcelRoutes = require("./routes/parcelRoutes");
    const branchRoutes = require("./routes/branchRoutes");






    require("dotenv").config();


  


    const app = express();

    const PORT =8000;
    const corsOptions = {
        origin: 'http://localhost:5173',  // Allow frontend origin
        methods: 'GET, POST, PUT, DELETE',
        credentials: true,  // Allow cookies and authentication headers
    };
    
    app.use(cors(corsOptions)); 

    app.use(express.json());
    app.use(bodyParser.json());
    app.use(cookieParser());





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
    // app.use(cors({ origin: "http://localhost:5000", credentials: true }));
    app.use(cookieParser());



    //users api urls
    app.use("/api/auth",userRouter);
    app.use("/api/parcels", parcelRoutes); // Use parcel routes
    app.use("/api/payment",paymentRouter);
    app.use('/api/inquiries', inquiryRoutes);
    app.use('/api/branches', branchRoutes);
    require("dotenv").config(); // Add this at the top

    


    

    app.all("*",(req,res,next) => {
        next(new AppError('cant find ${req.originalUrl} on this server !',404) );
    });

   




    app.use(globalErrorHandler);

   

   
      
    



