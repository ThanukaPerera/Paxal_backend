const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 5 // Limit each IP to 5 login attempts per window
  });

module.exports=limiter; 