const { Customer, Receiver } = require("../models/customerModels");
const bcrypt = require("bcrypt");

// REGISTER NEW CUSTOMER
const registerNewCustomer = async (req, res, next) => {
  try {
    
    const { customerEmail } = req.body;
  
    let customerReference;
    

    const existingCustomer = await Customer.findOne({ customerEmail });
    if (existingCustomer) {
      customerReference = existingCustomer._id; // return the customer ID
      console.log("------Exisiting customer found------");
    } else {
      // Find last customer ID and generate the next one
      const lastcustomer = await Customer.findOne()
        .sort({ customerId: -1 })
        .lean();
      let nextcustomerId = "CUSTOMER001"; // Default ID if no customers exist

      if (lastcustomer) {
        const lastIdNumber = parseInt(
          lastcustomer.customerId.replace("CUSTOMER", ""),
          10
        );
        nextcustomerId = `CUSTOMER${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      const defaultPassword = "paxal12345";
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      // Create new customer with the generated ID
      const customerData = {
        ...req.body,
        customerId: nextcustomerId,
        password: hashedPassword,
      };
      console.log(customerData)
      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();
      console.log("------Customer registered------");
      
      customerReference = savedCustomer._id
      
     
    }

    req.updatedData = {
      customerRef: customerReference,
      orderTime: Date.now(),
      originalData: req.body,
      
    };

    next();
  } catch (error) {
    res
      .status(500)
      .json( error );
  }
};

// DELETE CUSTOMER
const deleteCustomer = async (customerId) => {
  try {
    await Customer.findOneAndDelete(customerId);
    console.log("Customer deleted successfully");
  } catch (error) {
    console.log("Error deleting customer");
  }
};

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
      let nextreceiverId = "RECEIVER001"; // Default ID if no customers exist

      if (lastreceiver) {
        const lastIdNumber = parseInt(
          lastreceiver.receiverId.replace("RECEIVER", ""),
          10
        );
        nextreceiverId = `RECEIVER${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      // Create new receiver with the generated ID
      const receiverData = {
        ...req.updatedData.originalData,
        receiverId: nextreceiverId,
        
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

// DELETE CUSTOMER
const deleteReceiver = async (receiverId) => {
  try {
    await Receiver.findOneAndDelete(receiverId);
    console.log("Receiver deleted successfully");
  } catch (error) {
    console.log("Error deleting receiver");
  }
};

module.exports = {
  registerNewCustomer,
  addReceiver,
  deleteCustomer,
  deleteReceiver,
};
