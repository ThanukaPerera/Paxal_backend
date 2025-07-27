const user = require("../../../../models/userModel");

const fetchAllCustomers = async (req, res) => {
  try {
    const customers = await user
      .find()
      .select("-fullName -password -profilePicLink -updatedAt -__v")
      .lean()
      .exec();
    const userData = customers.map((customer) => ({
      ...customer,
      name: `${customer.fName} ${customer.lName}`,
      contact: customer.contact,
      address: `${customer.address} ${customer.city} ${customer.district} ${customer.province}`,
    }));
    res.status(200).json({ userData });
  } catch (error) {
    console.log("Error,cannot fetch data", error);
    res.status(500).json({ message: "Cannot fetch Customer Data", error });
  }
};

module.exports = fetchAllCustomers;
