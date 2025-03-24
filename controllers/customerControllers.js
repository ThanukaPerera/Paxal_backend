const {Customer,Receiver} =  require("../models/customerModels");
const bcrypt = require("bcrypt");


// REGISTER NEW CUSTOMER
const registerNewCustomer = async (req, res, next) => {
  try {
    const { email } = req.body;
    let customerReference;

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
        customerReference =  existingCustomer.customerId ; // return the customer ID
    }
    else {
            // Find last customer ID and generate the next one
        const lastcustomer = await Customer.findOne().sort({ customerId: -1 }).lean();
        let nextcustomerId = "CUSTOMER001"; // Default ID if no customers exist

        if (lastcustomer) {
        const lastIdNumber = parseInt(lastcustomer.customerId.replace("CUSTOMER", ""), 10);
        nextcustomerId = `CUSTOMER${String(lastIdNumber + 1).padStart(3, "0")}`;
        }

        const defaultPassword = paxal12345
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        // Create new customer with the generated ID
        const customerData = {
        ...req.body,
        customerId: nextcustomerId,
        password: hashedPassword,
        };
        const customer = new Customer(customerData);
        console.log("customer registered", customerData);
        const savedcustomer = await customer.save();
        customerReference =  savedcustomer.customerId;
    }

    req.updatedData = {
        message: 'Customer reference received',
        customerRef: customerReference,
        timestamp: Date.now(),
        orignalData: req.body
    }
  } catch (error) {
    res.status(500).json({ message: "Error receiveing customer reference", error });
  }
};

// SAVE RECEIVER DATA
const addReceiver = async(req,res,next) => {
    try {
        const { email } = req.updatedData.orignalData;
        let receiverReference;
        const existingReceiver = await Receiver.findOne({ email });
        if (existingReceiver) {
            receiverReference =  existingReceiver.receiverId ; // return the receiver ID
        }
        else {
                // Find last receiver ID and generate the next one
            const lastreceiver = await Receiver.findOne().sort({ receiverId: -1 }).lean();
            let nextreceiverId = "RECEIVER001"; // Default ID if no customers exist

            if (lastreceiver) {
            const lastIdNumber = parseInt(lastreceiver.receiverrId.replace("RECEIVER", ""), 10);
            nextreceiverId = `RECEIVER${String(lastIdNumber + 1).padStart(3, "0")}`;
            }

            // Create new receiver with the generated ID
            const receiverData = {
                ...req.newData.orignalData,
                receiverId: nextreceiverId,
            };
            const receiver = new Receiver(receiverData);
            console.log("receiver registered", receiverData);
            const savedreceiver = await receiver.save();
            receiverReference = savedreceiver.receiverId;

        }
        req.updatedData = {
            message: 'Receiver reference received',
            receiverRef: receiverReference,       
            orignalData: req.updatedData
        }
    } catch (error) {
            res.status(500).json({ message: "Error receiving receiver reference", error });

    }
}

module.exports = {
    registerNewCustomer,
    addReceiver
}