const Admin = require('../../../../models/AdminModel');

const fetchAllAdmin = async (req, res) => {
  try {
    const userData = await Admin.find().select(
      "-password -__v -updatedAt"
    ).exec();

    res.status(200).json({ message: "Admins fetched successfully", userData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins", error });
  }
};

module.exports = fetchAllAdmin;
