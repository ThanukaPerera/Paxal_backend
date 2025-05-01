const checkAuthenticity = (req, res) => {
  res.status(200).json({ 
    isAuthenticated: true, 
    user: {
      _id: req.admin._id,
      email: req.admin.email,
      adminId: req.admin.adminId
    },
    expiresAt: req.admin.exp * 1000 
  });
};

module.exports=checkAuthenticity;