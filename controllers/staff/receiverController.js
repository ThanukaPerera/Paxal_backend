const Receiver = require("../../models/ReceiverModel");

// save receiver details
const addReceiver = async (receiverData, session) => {
  try {
    const { receiverEmail } = receiverData;

    // Check if the receiver already exists with the same email.
    const existingReceiver = await Receiver.findOne({ receiverEmail }).session(session);
    if (existingReceiver) {
      console.log("------Exsisting Receiver Found------");
      return existingReceiver._id; 
    } 
    

    // Find last receiver ID and generate the next one.
    const lastreceiver = await Receiver.findOne().sort({ receiverId: -1 }).session(session).lean();
    let nextReceiverId = "RECEIVER001"; // Default ID if no receiver exists.

    if (lastreceiver) {
      const lastIdNumber = parseInt(lastreceiver.receiverId.replace("RECEIVER", ""),1);
      nextReceiverId = `RECEIVER${String(lastIdNumber + 1).padStart(3, "0")}`;
            
      // Create new receiver with the generated ID.
      const newReceiver = {
        ...receiverData,
        receiverId: nextReceiverId,
      };

      const receiver = new Receiver(newReceiver);
      const savedReceiver = await receiver.save({session});
      console.log("------A new receiver registered------");
    
      return savedReceiver._id; 
    }
    
  } catch (error) {
    console.error("Error in adding a new receiver:", error);
    throw error;
  }
};

module.exports = {
  addReceiver,
};
