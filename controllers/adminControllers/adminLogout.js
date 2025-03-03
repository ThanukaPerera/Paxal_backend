const findAdmin = require("../../utils/findAdmin.js");

const adminLogout = async (req, res) => {
    try {
      res.clearCookie("AdminToken", { httpOnly: true, secure: true, sameSite: "None" }); 
      res.status(200).json({ message: "Logged out Successfully" });
        
      
      const reqAdmin = await findAdmin(req.admin.adminId);
      console.log(reqAdmin.adminId,reqAdmin.name,"Logged out Successfully");
    } catch (error) {
      res.status(500).json({ message: "Cannot logout", error });
    }
  };

    module.exports=adminLogout;