// Quick test to verify AI routes can be imported without errors
console.log("Testing AI routes import...");

try {
  const aiRoutes = require("./routes/adminRoutes/ai.js");
  console.log("✅ AI routes imported successfully");
  
  const authMiddleware = require("./middleware/adminMiddleware/authMiddleware");
  console.log("✅ Auth middleware imported successfully");
  
  const aiController = require("./controllers/adminControllers/aiReportController");
  console.log("✅ AI controller imported successfully");
  
  console.log("🎉 All imports working correctly!");
} catch (error) {
  console.log("❌ Import error:", error.message);
}
