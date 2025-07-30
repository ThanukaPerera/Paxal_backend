const bcrypt = require("bcrypt");
const User = require("../../models/userModel");
const generator = require("generate-password");
const { sendUserPasswordEmail } = require("../../emails/emails");

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

    const userId = `user-${Date.now()}`;

    const password = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with the generated ID.
    const newUser = {
      ...userData,
      userId: userId,
      password: hashedPassword,
    };

    const result = await sendUserPasswordEmail(email, password);
    if (!result.success) {
      console.log("Error in sending the user password email", result);
    }

    const user = new User(newUser);
    const savedUser = await user.save({ session });
    console.log("------A new user registered------");

    return savedUser._id;
  } catch (error) {
    console.error("Error in registering a new user:", error);
    throw error;
  }
};

// fetch a single user by ID
const getOneUser = async (req, res) => {
  try {
    const user_id = req.body;
    const user = await User.findById(user_id);
    return res.status(200).json(user);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching user information", error });
  }
};

module.exports = {
  registerNewUser,
  getOneUser,
};
