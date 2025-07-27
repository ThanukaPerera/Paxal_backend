// Branch-specific controllers for fetching related data
const fetchParcelsByBranchId = require('./fetchParcelsByBranchId');
const fetchDriversByBranchId = require('./fetchDriversByBranchId');
const fetchStaffByBranchId = require('./fetchStaffByBranchId');
const fetchBranchCompleteData = require('./fetchBranchCompleteData');

module.exports = {
  fetchParcelsByBranchId,
  fetchDriversByBranchId,
  fetchStaffByBranchId,
  fetchBranchCompleteData
};
