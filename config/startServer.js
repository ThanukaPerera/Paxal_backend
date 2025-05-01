const PORT = process.env.PORT || 8000;
const connectDB = require("./db");

const startServer = async (app) => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err);
    process.exit(1);
  }
};

module.exports = startServer;
