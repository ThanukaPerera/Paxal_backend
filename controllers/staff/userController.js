const bcrypt = require("bcrypt");

const User = require("../../models/userModel");

// REGISTER NEW User
const registerNewUser = async (req, res, next) => {
  try {
    const { email } = req.body;

    let userReference;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      userReference = existingUser._id; // return the user ID
      console.log("------Exisiting user found------");
    } else {
      // Find last user ID and generate the next one
      const lastUser = await User.findOne().sort({ userId: -1 }).lean();
      let nextUserId = "USER001"; // Default ID if no customers exist

      if (lastUser) {
        const lastIdNumber = parseInt(
          lastUser.customerId.replace("USER", ""),
          10
        );
        nextUserId = `USER${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      const defaultPassword = "paxal12345";
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      // Create new user with the generated ID
      const userData = {
        ...req.body,
        userId: nextUserId,
        password: hashedPassword,
      };

      const user = new Customer(userData);
      const savedUser = await user.save();
      console.log("------User registered------");

      userReference = savedUser._id;
    }

    req.updatedData = {
      userRef: userReference,
      orderTime: Date.now(),
      originalData: req.body,
    };

    next();
  } catch (error) {
    res.status(500).json(error);
  }
};

//GET USER INFROMATION
const getOneUser = async (req, res) => {
  try {
    const  user_id  = req.body;
    console.log(user_id)
    const user = await User.findById(user_id );
    console.log("user" , user)
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user information", error });
  }
};

module.exports = {
  registerNewUser,
  getOneUser,
};
