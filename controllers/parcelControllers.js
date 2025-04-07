const { Parcel } = require("../models/parcelModels");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { deleteReceiver } = require("./customerControllers");
const { sendTrackingNumberEmail } = require("../emails/emails");


//GENERATE TRACKING NUMBER
const generateTrackingNumber = async (regTime) => {
  const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const timestamp = Math.floor(regTime / 1000).toString();
  console.log("------Tracking number generated------");

  return `${randomCode}-${timestamp}`;
};

// GENERATE THE QR CODE
const generateQRCode = async (parcelData) => {
  try {
    const qr = await QRCode.toDataURL(parcelData, {
      errorCorrectionLevel: "H",
    });

    console.log("------QR code generated------");
    return qr;
  } catch (error) {
    console.error(error);
  }
};

// ADD NEW PARCEL - PARCEL REGISTRATION FORM
const registerParcel = async (req, res) => {
  try {
    // Find last parcel ID and generate the next one
    const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
    let nextParcelId = "PARCEL001"; // Default ID if no parcels exist

    if (lastParcel) {
      const lastIdNumber = parseInt(
        lastParcel.parcelId.replace("PARCEL", ""),
        10
      );
      nextParcelId = `PARCEL${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(req.updatedData.orderTime);
      numberExists = await Parcel.findOne({ trackingNumber });
    } while (numberExists);

    // Create new parcel with the generated ID
    const parcelData = {
      ...req.updatedData.originalData,
      senderId: req.updatedData.customerRef,
      receiverId: req.updatedData.receiverRef,
      paymentId: req.updatedData.paymentRef,
      parcelId: nextParcelId,
      trackingNo: trackingNumber,
      submittingType: "branch",
      orderPlacedTime: req.updatedData.orderTime,
    };

    // Generate the qr code for the parcel
    //const qrCodeString = await generateQRCode(JSON.stringify(parcelData)); to encode all data
    const qrCodeString = await generateQRCode(parcelData.parcelId);
    parcelData.qrCodeNo = qrCodeString;


    const parcel = new Parcel(parcelData);
    
    const savedParcel = await parcel.save();
    console.log("------Parcel registered------");

    


    

    req.updatedData = {
      ...req.updatedData,
      parcelRef: savedParcel.parcelId,
      orderTime: Date.now(),
      
     
  }
   // SEND EMAILS TO SENDER AND RECEIVER
   const senderEmail = parcelData.customerEmail;
   const receiverEmail = parcelData.receiverEmail;
 
   await sendTrackingNumberEmail(
     senderEmail,
     parcelData.parcelId,
     parcelData.trackingNo
   );
   await sendTrackingNumberEmail(
     receiverEmail,
     parcelData.parcelId,
     parcelData.trackingNo
   );
  
   res.status(201).json({ message: "Parcel registered successfully", savedParcel});

    
  } catch (error) {
    
        res.status(500).json({ message: "Error registering parcel", error });
  }
};


// GET ALL PARCELS
const getAllParcels = async(req, res) => {
  try {
    const parcels = await Parcel.find().sort({createdAt: -1});
    res.status(200).json(parcels);
    
  } catch (error) {
    res.status(500).json({message:"Error fetching parcels", error});
  }
}

// GET ONE PARCEL
const getOneParcel = async(req, res) => {
  try {
    const parcel = await Parcel.findOne({parcelId: req.params.parcelId});
    if (!parcel) {
      return res.status(404).json({message: "Parcel Not found"});
    }
    res.status(200).json({success:true, existingPosts: parcel});
  } catch (error) {
    res.status(500).json({message:"Error fetching the parcel", error});
  }
}

// UPDATE THE PARCEL
const updateTheParcel = async(req, res) => {
  try {
    const parcel = await Parcel.findOneAndUpdate(req.params.parcelId, req.body);
    res.status(200).json(parcel)
  } catch (error) {
    res.status(500).json({message: "Error updating the parcel", error});
  }
}

// DELETE PARCEL
const deleteParcel = async (parcelId) => {
  try {
    await Parcel.findOneAndDelete(parcelId);
    console.log("Parcel deleted successfully");
  } catch (error) {
    console.log("Error deleting parcel");
  }
};

//Calculate the Payment
const calculatePayment = async(req, res) => {
  console.log(req.query);
  const paymentAmount = 1000;
  res.json({ paymentAmount });
}

module.exports = {
  registerParcel,
  getAllParcels,
  getOneParcel,
  updateTheParcel,
  deleteParcel,
  calculatePayment,
};
