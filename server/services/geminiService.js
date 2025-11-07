const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

// Initialize Gemini AI
let genAI = null;
let model = null;

function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.error('⚠️  GEMINI_API_KEY is not set in environment variables!');
    throw new Error('Gemini API key is not configured');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log('✅ Gemini AI initialized successfully');
  }
  
  return model;
}

async function analyzeMedicalReport(extractedText, reportType = 'General Medical Report') {
  try {
    console.log('Starting Gemini AI analysis...');
    
    const geminiModel = initializeGemini();
    
    const prompt = `You are a medical AI assistant analyzing a medical report. 

EXTRACTED TEXT FROM MEDICAL REPORT:
${extractedText}

REPORT TYPE: ${reportType}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "A brief 2-3 sentence summary of the report",
  "keyFindings": ["List of 3-5 key findings from the report"],
  "parameters": [
    {
      "name": "Parameter name",
      "value": "Value with unit",
      "normalRange": "Normal range",
      "status": "normal/high/low",
      "interpretation": "Brief explanation"
    }
  ],
  "concerns": ["List any abnormal findings or health concerns"],
  "recommendations": ["List 2-4 general health recommendations based on the report"],
  "disclaimer": "This is an AI-generated analysis for informational purposes only. Always consult with a qualified healthcare professional for medical advice."
}

IMPORTANT:
- Extract actual values from the report text
- Provide accurate normal ranges for each parameter
- Mark status as "normal", "high", or "low" based on the values
- Be specific and factual
- If information is unclear or missing, indicate that
- Focus only on medical information present in the text

Return ONLY the JSON object, no additional text.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini AI analysis completed');
    
    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(jsonText);
    
    return {
      success: true,
      analysis: analysis,
      model: GEMINI_MODEL
    };
    
  } catch (error) {
    console.error('Gemini AI Analysis Error:', error);
    
    // Return a fallback response if AI analysis fails
    return {
      success: false,
      error: error.message,
      fallback: {
        summary: "AI analysis unavailable. Please review the extracted text manually.",
        keyFindings: ["Unable to generate AI analysis"],
        parameters: [],
        concerns: ["AI analysis failed - manual review recommended"],
        recommendations: ["Consult with a healthcare professional for proper interpretation"],
        disclaimer: "This is an AI-generated analysis for informational purposes only. Always consult with a qualified healthcare professional for medical advice."
      }
    };
  }
}

async function generateHealthSummary(text) {
  try {
    const geminiModel = initializeGemini();
    
    const prompt = `Provide a brief, clear summary of this medical information in 2-3 sentences:

${text}

Focus on the most important health information and findings.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini Summary Error:', error);
    return "Unable to generate summary. Please review the full text.";
  }
}

module.exports = {
  analyzeMedicalReport,
  generateHealthSummary
};
