const Receiver = require("../../models/receiverModel");

// SAVE RECEIVER DATA
const addReceiver = async (req, res, next) => {
  try {
    const { receiverEmail } = req.updatedData.originalData;
    let receiverReference;

    const existingReceiver = await Receiver.findOne({ receiverEmail });
    if (existingReceiver) {
      receiverReference = existingReceiver._id; // return the receiver ID
      console.log("------Exsisting Receiver Found------");
    } else {
      // Find last receiver ID and generate the next one
      const lastreceiver = await Receiver.findOne()
        .sort({ receiverId: -1 })
        .lean();
      let nextReceiverId = "RECEIVER001"; // Default ID if no customers exist

      if (lastreceiver) {
        const lastIdNumber = parseInt(
          lastreceiver.receiverId.replace("RECEIVER", ""),
          10,
        );
        nextReceiverId = `RECEIVER${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      // Create new receiver with the generated ID
      const receiverData = {
        ...req.updatedData.originalData,
        receiverId: nextReceiverId,
      };

      const receiver = new Receiver(receiverData);
      console.log("------Receiver registered------");
      const savedReceiver = await receiver.save();
      receiverReference = savedReceiver._id;
    }
    req.updatedData = {
      ...req.updatedData,
      receiverRef: receiverReference,
    };

    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error receiving receiver reference", error });
  }
};

module.exports = {
  addReceiver,
};
