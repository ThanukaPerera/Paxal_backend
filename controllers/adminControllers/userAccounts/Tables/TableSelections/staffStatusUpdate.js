  const Staff = require("../../../../../models/StaffModel"); // Adjust the path as necessary

const staffStatusUpdate = async (req, res) => {
  try {
    console.log('Updating staff status:', req.params.staffId, req.body);
    const { staffId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either "active" or "inactive"'
      });
    }

    // Find staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Update staff status
    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId,
      { 
        status: status,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('branchId', 'location')
     .populate('adminId', 'name');

    res.status(200).json({
      success: true,
      message: `Staff ${status === 'active' ? 'activated' : 'suspended'} successfully`,
      data: updatedStaff
    });

  } catch (error) {
    console.error('Error updating staff status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating staff status'
    });
  }
}

module.exports = staffStatusUpdate;