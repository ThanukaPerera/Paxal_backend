const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini API
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY  // Replace with actual API key
});


async function generateGeminiInsights(reportData, reportType = "comprehensive") {
  try {
    // Prepare the prompt with report data
    const prompt = createAnalysisPrompt(reportData, reportType);
    console.log("Generated prompt for Gemini:", prompt);
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const text = response.text || response.content;

    // Parse the AI response into structured data
    return parseGeminiResponse(text);

  } catch (error) {
    console.error("Error generating Gemini insights:", error);
    return {
      error: "Unable to generate AI insights at this time",
      fallbackInsights: generateFallbackInsights(reportData)
    };
  }
}

/**
 * Create a detailed prompt for Gemini analysis
 */
function createAnalysisPrompt(reportData, reportType) {
  const dataContext = JSON.stringify(reportData, null, 2);
  
  return `
Analyze the following Parcel Management System data and provide professional business insights use LKR for currency:

REPORT TYPE: ${reportType.toUpperCase()}
DATA: ${dataContext}

Please provide a comprehensive analysis in the following JSON format:

{
  "executiveSummary": "Brief 2-3 sentence overview of the business performance",
  "keyFindings": [
    "Finding 1 with specific metrics",
    "Finding 2 with specific metrics",
    "Finding 3 with specific metrics"
  ],
  "recommendations": [
    {
      "priority": "High|Medium|Low",
      "category": "Operational|Financial|Strategic|Customer Service",
      "title": "Recommendation Title",
      "description": "Detailed recommendation",
      "expectedImpact": "Quantified expected impact",
      "timeframe": "Implementation timeframe"
    }
  ],
  "riskAssessment": {
    "highRisks": ["Risk 1", "Risk 2"],
    "mediumRisks": ["Risk 1", "Risk 2"],
    "mitigationStrategies": ["Strategy 1", "Strategy 2"]
  },
  "opportunities": [
    {
      "area": "Growth area",
      "description": "Opportunity description",
      "potentialImpact": "Expected business impact"
    }
  ],
 
  },
  "trendAnalysis": {
    "positive": ["Positive trend 1", "Positive trend 2"],
    "concerning": ["Concerning trend 1", "Concerning trend 2"],
    "predictions": ["Prediction 1", "Prediction 2"]
  }
}

Focus on actionable insights based on the actual data provided. Include specific numbers and percentages where relevant.
`;
}

/**
 * Parse Gemini's response into structured format
 */
function parseGeminiResponse(text) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, create structured response from text
    return {
      executiveSummary: extractSummary(text),
      keyFindings: extractFindings(text),
      recommendations: extractRecommendations(text),
      textResponse: text
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return {
      textResponse: text,
      error: "Could not parse structured response"
    };
  }
}

/**
 * Extract summary from unstructured text
 */
function extractSummary(text) {
  const lines = text.split('\n');
  return lines.find(line => 
    line.toLowerCase().includes('summary') || 
    line.toLowerCase().includes('overview')
  ) || lines[0] || "AI analysis completed";
}

/**
 * Extract findings from unstructured text
 */
function extractFindings(text) {
  const findings = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.includes('•') || line.includes('-') || line.includes('*')) {
      findings.push(line.replace(/[•\-*]\s*/, '').trim());
    }
  });
  
  return findings.slice(0, 5); // Return top 5 findings
}

/**
 * Extract recommendations from unstructured text
 */
function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.toLowerCase().includes('recommend') || 
        line.toLowerCase().includes('suggest') ||
        line.toLowerCase().includes('should')) {
      recommendations.push({
        priority: "Medium",
        category: "General",
        title: "AI Recommendation",
        description: line.trim(),
        expectedImpact: "To be quantified",
        timeframe: "3-6 months"
      });
    }
  });
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Generate fallback insights when AI fails
 */
function generateFallbackInsights(reportData) {
  return {
    executiveSummary: "System analysis shows mixed performance with opportunities for improvement.",
    keyFindings: [
      "Report data successfully collected",
      "Multiple performance metrics available for analysis",
      "System operational with room for optimization"
    ],
    recommendations: [
      {
        priority: "Medium",
        category: "Operational",
        title: "Data Review",
        description: "Review system performance metrics regularly",
        expectedImpact: "Improved monitoring",
        timeframe: "Ongoing"
      }
    ],
    performanceScore: {
      overall: 75,
      breakdown: {
        operational: 75,
        financial: 75,
        customer: 75,
        efficiency: 75
      }
    }
  };
}

module.exports = {
  generateGeminiInsights
};