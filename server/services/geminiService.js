import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
let genAI = null;
let model = null;

function initializeGemini() {
  // Access environment variables inside the function, not at module level
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
  
  if (!GEMINI_API_KEY) {
    console.error('⚠️  GEMINI_API_KEY is not set in environment variables!');
    console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
    throw new Error('Gemini API key is not configured');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log('✅ Gemini AI initialized successfully with model:', GEMINI_MODEL);
  }
  
  return model;
}

async function analyzeMedicalReport(extractedText, reportType = 'General Medical Report') {
  try {
    console.log('Starting Gemini AI analysis...');
    
    // Validate input text
    if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
      console.error('Invalid text provided to Gemini analysis');
      throw new Error('No valid text to analyze');
    }
    
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
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"
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
    // Validate input text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('Invalid text provided to generateHealthSummary');
      return "No text available to summarize.";
    }
    
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

async function analyzeSymptoms(symptomsText, medicalHistory = null) {
  try {
    console.log('Starting symptom analysis with Gemini AI...');
    
    if (!symptomsText || typeof symptomsText !== 'string' || symptomsText.trim().length === 0) {
      throw new Error('No symptoms provided for analysis');
    }
    
    const geminiModel = initializeGemini();
    
    // Build medical history context
    let historyContext = '';
    if (medicalHistory && medicalHistory.recentReports && medicalHistory.recentReports.length > 0) {
      historyContext = `\n\nPATIENT'S MEDICAL HISTORY:
The patient has the following medical history from recent reports:

`;
      medicalHistory.recentReports.forEach((report, idx) => {
        historyContext += `Report ${idx + 1} (${new Date(report.date).toLocaleDateString()}):
- Summary: ${report.summary}
${report.diagnoses && report.diagnoses.length > 0 ? `- Previous Diagnoses: ${report.diagnoses.join(', ')}` : ''}
${report.abnormalParameters.length > 0 ? `- Abnormal findings: ${report.abnormalParameters.join(', ')}` : '- No abnormal findings'}

`;
      });

      if (medicalHistory.allDiagnoses && medicalHistory.allDiagnoses.length > 0) {
        historyContext += `\n⚠️ KNOWN PAST DIAGNOSES: ${medicalHistory.allDiagnoses.join(', ')}
`;
      }
      
      if (medicalHistory.allAbnormalParameters.length > 0) {
        historyContext += `\nRecurring abnormal parameters across reports: ${medicalHistory.allAbnormalParameters.join(', ')}
`;
      }
      
      historyContext += `
CRITICAL INSTRUCTIONS FOR MEDICAL HISTORY ANALYSIS:
1. PRIORITIZE past diagnoses and conditions from the patient's medical history
2. If current symptoms match a previously diagnosed condition, list that condition FIRST with HIGH probability
3. Explicitly mention if this appears to be a recurrence of a known condition
4. Consider chronic conditions and recurring patterns from the medical history
5. Reference specific findings from past reports when relevant
6. If the patient has a history of allergies or specific conditions (like allergic bronchitis), consider these FIRST when symptoms match

When analyzing, ask yourself:
- Does this match any condition mentioned in the patient's medical history?
- Could this be a recurrence or flare-up of a known condition?
- Are there patterns in the medical history that explain current symptoms?
`;
    }
    
    const prompt = `You are a medical AI assistant analyzing patient symptoms. 

PATIENT SYMPTOMS:
${symptomsText}${historyContext}

Please provide a comprehensive symptom analysis in the following JSON format:
{
  "possibleConditions": [
    {
      "name": "Condition name",
      "probability": "High/Moderate/Low/Possible",
      "description": "Brief explanation of why this condition matches the symptoms"
    }
  ],
  "recommendations": [
    "List of 4-6 actionable recommendations for the patient"
  ],
  "urgency": "low/medium/high",
  "urgencyMessage": "Brief message about urgency level",
  "disclaimer": "This is an AI-powered symptom checker for informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider with any questions about a medical condition. If you have a medical emergency, call emergency services immediately."
}

IMPORTANT GUIDELINES:
- Identify 2-4 most likely conditions based on the symptoms
- Set urgency to "high" for emergency symptoms (chest pain, difficulty breathing, severe bleeding, etc.)
- Set urgency to "medium" for symptoms requiring medical attention within 24-48 hours
- Set urgency to "low" for minor symptoms that can be monitored at home
- Provide practical, actionable recommendations
- Be cautious and err on the side of recommending medical consultation when uncertain
- Include the disclaimer exactly as shown

Return ONLY the JSON object, no additional text.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Symptom analysis completed');
    
    // Parse the JSON response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(jsonText);
    
    // Add flag to indicate if medical history was used
    analysis.usedMedicalHistory = medicalHistory !== null && medicalHistory.recentReports && medicalHistory.recentReports.length > 0;
    
    return analysis;
    
  } catch (error) {
    console.error('Symptom Analysis Error:', error);
    throw new Error('Failed to analyze symptoms: ' + error.message);
  }
}

export {
  analyzeMedicalReport,
  generateHealthSummary,
  analyzeSymptoms
};
