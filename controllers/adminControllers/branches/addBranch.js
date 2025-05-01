const Branch = require("../../../models/BranchesModel");
const { body, validationResult } = require("express-validator");

const validateBranch = [
  body("location")
    .notEmpty()
    .withMessage("Branch location is required.")
    .isLength({ min: 2 })
    .withMessage("Branch location must be at least 2 characters long."),

  body("contact")
    .notEmpty()
    .withMessage("Contact number is required.")
    .isMobilePhone()
    .withMessage("Invalid contact number format."),
];

const addBranch = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const branchData = req.body;
    console.log(branchData);
    const newBranch = new Branch(branchData);
    const savedBranch = await newBranch.save();
    res.status(201).json({
      status: "success",
      message: "Branch added successfully",
      branch: savedBranch,
    });
    console.log(req.data);
  } catch (error) {
    console.error("Error adding branch:", error);
    res
      .status(500)
      .json({ message: "Server error. Could not add branch.", error });
  }

  //BULK BRANCHES ADDING
  // try {
  //     const branchDataArray = req.body;

  //     // Validate input is an array
  //     if (!Array.isArray(branchDataArray)) {
  //       return res.status(400).json({ message: "Input should be an array of branches." });
  //     }

  //     // Insert all branches
  //     const savedBranches = await Branch.insertMany(branchDataArray);

  //     res.status(201).json({
  //       status: "success",
  //       message: `${savedBranches.length} branches added successfully`,
  //       branches: savedBranches,
  //     });

  //   } catch (error) {
  //     console.error("Error adding branches:", error);
  //     res.status(500).json({ message: "Server error. Could not add branches.", error });
  //   }
};

module.exports = {
  validateBranch,
  addBranch,
};
