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
    

    
      const newReceiver = {
        ...receiverData,
      };

      const receiver = new Receiver(newReceiver);
      const savedReceiver = await receiver.save({session});
      console.log("------A new receiver registered------");
    
      return savedReceiver._id; 
    
    
  } catch (error) {
    console.error("Error in adding a new receiver:", error);
    throw error;
  }
};

module.exports = {
  addReceiver,
};
