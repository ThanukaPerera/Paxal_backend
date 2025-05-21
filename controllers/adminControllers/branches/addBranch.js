const Branch = require("../../../models/BranchesModel");
const { body, validationResult } = require("express-validator");

const validateBranch = [
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Branch location is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2-100 characters")
    .custom(async (value) => {
      const existingBranch = await Branch.findOne({ location: value });
      if (existingBranch) {
        throw new Error("Branch location already exists");
      }
      return true;
    }),
    
  body("contact")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Contact number must be exactly 10 digits")
    .matches(/^0\d{9}$/)
    .withMessage("Invalid Sri Lankan format. Use 0XXXXXXXXX")
    .customSanitizer(value => value.replace(/[^\d]/g, ''))
];

const addBranch = async (req, res) => {
  // Get validation errors
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors properly
    const formattedErrors = errors.array().reduce((acc, err) => {
      acc[err.path] = err.msg;
      return acc;
    }, {});

    return res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors: formattedErrors
    });
  }

  try {
    const latestBranch = await Branch.findOne().sort({ branchId: -1 });
    const newBranchNumber = latestBranch ? 
      parseInt(latestBranch.branchId.substring(1)) + 1 : 1;
    
    const branchId = `B${newBranchNumber.toString().padStart(3, "0")}`;
    
    const branch = new Branch({
      branchId,
      location: req.body.location.trim(),
      contact: req.body.contact.replace(/[^\d]/g, '')
    });

    const savedBranch = await branch.save();
    
    res.status(201).json({
      status: "success",
      message: "Branch created successfully",
      data: savedBranch
    });

  } catch (error) {
    console.error("Branch creation error:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Branch already exists",
        errors: { 
          location: "A branch with this location already exists" 
        }
      });
    }

    res.status(500).json({
      status: "error",
      message: "Server error while creating branch",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// const Branch = require("../../../models/BranchesModel");
// const { body, validationResult } = require("express-validator");

// const validateBranch = [
//   body("location")
//     .notEmpty()
//     .withMessage("Branch location is required.")
//     .isLength({ min: 2 })
//     .withMessage("Branch location must be at least 2 characters long."),

//   body("contact")
//     .notEmpty()
//     .withMessage("Contact number is required.")
//     .isMobilePhone()
//     .withMessage("Invalid contact number format."),
// ];

// const addBranch = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(422).json({ errors: errors.array() });
//   }
//   try {
//     const branchData = req.body;
//     console.log(branchData);
//     const newBranch = new Branch(branchData);
//     const savedBranch = await newBranch.save();
//     res
//       .status(201)
//       .json({
//         status: "success",
//         message: "Branch added successfully",
//         branch: savedBranch,
//       });
//     console.log(req.data);
//   } catch (error) {
//     console.error("Error adding branch:", error);
//     res
//       .status(500)
//       .json({ message: "Server error. Could not add branch.", error });
//   }
// };

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

module.exports = {
  validateBranch,
  addBranch,
};
