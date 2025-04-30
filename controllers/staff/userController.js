const bcrypt = require("bcrypt");
const User = require("../../models/userModel");

// register a new user
const registerNewUser = async (userData, session) => {
  try {
    const { email } = userData;

    // Check if the user already exists with the same email.
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      console.log("------Exisiting user found------");
      return existingUser._id; 
    } 

    // If there is no exisitng user find the last user ID and generate the next one.
    const lastUser = await User.findOne().sort({ userId: -1 }).session(session).lean();
    let nextUserId = "USER001"; // Default ID if no customers exists.

    if (lastUser) {
      const lastIdNumber = parseInt(lastUser.userId.replace("USER", ""),10);
      nextUserId = `USER${String(lastIdNumber + 1).padStart(3, "0")}`;
      
      const defaultPassword = "paxal12345"; // Provide a default password for the users registered by the staff.
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      // Create new user with the generated ID.
      const newUser = {
        ...userData,
        userId: nextUserId,
        password: hashedPassword,
      };

      const user = new User(newUser);
      const savedUser = await user.save({session});
      console.log("------A new user registered------");

      return savedUser._id; 
    }

    
  } catch (error) {
    console.error("Error in registering a new user:", error);
    throw error; 
  }
};

// fetch a single user by ID
const getOneUser = async (req, res) => {
  try {
    const  user_id  = req.body;
    const user = await User.findById(user_id );
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching user information", error });
  }
};

module.exports = {
  registerNewUser,
  getOneUser,
};
