
const {Parcel} = require("../models/parcelModels");
const crypto = require("crypto")


//GENERATE TRACKING NUMBER
const generateTrackingNumber = async() => {
    const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const timestamp = Math.floor(Date.now()/1000).toString();

    return `${randomCode}-${timestamp}`;
}

// ADD NEW PARCEL - PARCEL REGISTRATION FORM
const registerParcel = async(req,res) => {
    try {
        // Find last parcel ID and generate the next one
            const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
            let nextParcelId = "PARCEL001"; // Default ID if no parcels exist
        
            if (lastParcel) {
              const lastIdNumber = parseInt(lastParcel.parcelId.replace("STAFF", ""), 10);
              nextParcelId = `STAFF${String(lastIdNumber + 1).padStart(3, "0")}`;
            }

            let trackingNumber;
            let numberExists;
            do {
                trackingNumber = generateTrackingNumber();
                numberExists = await Parcel.findOne({trackingNumber});

            }while (numberExists);


        // Create new parcel with the generated ID
            const parcelData = {
              ...req.updatedData,
              parcelId: nextParcelId,
              trackingNo: trackingNumber,

            };
            const parcel = new Parcel(parcelData);
            console.log("Parcel registered", parcelData);
            const savedParcel = await parcel.save();
            res.status(201).json({ message: "Parcel registered", savedParcel });
            
        
    } catch (error) {
        res.status(500).json({ message: "Error registering parcel", error });

    }
}

module.exports = {
    registerParcel
}