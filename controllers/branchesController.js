const Branch = require('../models/BranchesModel');
const catchAsync = require('../utils/catchAscync'); // Optional if you use try-catch

exports.getAllBranches = catchAsync(async (req, res, next) => {
  const branches = await Branch.find(); // Fetches all documents

  res.status(200).json({
    status: 'success',
    results: branches.length,
    data: {
      branches
    }
  });
});
