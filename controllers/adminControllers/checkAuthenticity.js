
const checkAuthenticity =(req, res) => {
    res.status(200).json({ isAuthenticated: true, user: req.admin });
  };

  module.exports=checkAuthenticity;