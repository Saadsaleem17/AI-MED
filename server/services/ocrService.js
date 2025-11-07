const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

const OCR_API_URL = "https://api.ocr.space/parse/image";

// Get API key dynamically to ensure it's loaded after dotenv
function getAPIKey() {
  const key = process.env.OCR_SPACE_API_KEY;
  if (!key) {
    console.error('⚠️  OCR_SPACE_API_KEY is not set in environment variables!');
    throw new Error('OCR API key is not configured. Please set OCR_SPACE_API_KEY in your .env file.');
  }
  return key;
}

async function extractTextFromImage(path) {
  try {
    console.log('Starting OCR.space API for image:', path);
    
    const OCR_API_KEY = getAPIKey();

    const formData = new FormData();
    formData.append('file', fs.createReadStream(path));
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy

    console.log('Sending request to OCR.space API...');
    const response = await axios.post(OCR_API_URL, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60 second timeout
    });

    console.log('OCR API Response Status:', response.status);
    console.log('OCR API Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.IsErroredOnProcessing) {
      const errorMsg = response.data.ErrorMessage || response.data.ErrorDetails || 'OCR processing failed';
      console.error('OCR API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
      throw new Error('No OCR results returned from API');
    }

    const text = response.data.ParsedResults[0].ParsedText || '';
    const confidence = response.data.ParsedResults[0].FileParseExitCode === 1 ? 95 : 70;

    console.log(`OCR completed with ${confidence}% confidence`);
    console.log(`Extracted text length: ${text.length} characters`);
    return { text, confidence };
  } catch (error) {
    console.error('Image OCR Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error('Failed to extract text from image: ' + error.message);
  }
}

async function extractTextFromPDF(path) {
  try {
    console.log('Processing PDF with OCR.space:', path);
    
    const OCR_API_KEY = getAPIKey();

    const formData = new FormData();
    formData.append('file', fs.createReadStream(path));
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('OCREngine', '2');
    formData.append('filetype', 'PDF');

    const response = await axios.post(OCR_API_URL, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.data.IsErroredOnProcessing) {
      throw new Error(response.data.ErrorMessage || 'PDF OCR processing failed');
    }

    const text = response.data.ParsedResults[0].ParsedText;
    const confidence = response.data.ParsedResults[0].FileParseExitCode === 1 ? 95 : 70;

    console.log(`PDF OCR completed with ${confidence}% confidence`);
    return { text, confidence };
  } catch (error) {
    console.error('PDF Processing Error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

// Analyze extracted text for medical content
function analyzeMedicalContent(text) {
  const medicalKeywords = [
    'blood', 'hemoglobin', 'cbc', 'mmhg', 'mg/dl', 'pulse', 'bp', 'wbc', 'rbc',
    'diagnosis', 'glucose', 'cholesterol', 'urine', 'urinalysis', 'x-ray',
    'ecg', 'ekg', 'heart rate', 'temperature', 'bpm', 'g/dl', 'μl', 'platelet',
    'hematocrit', 'lipid', 'triglycerides', 'hdl', 'ldl', 'creatinine'
  ];

  const textLower = text.toLowerCase();
  const foundKeywords = medicalKeywords.filter(keyword =>
    textLower.includes(keyword)
  );

  // Strict medical detection - need at least 2 medical keywords
  const keywordCount = foundKeywords.length;
  const isMedical = keywordCount >= 2;
  const medicalConfidence = Math.min(keywordCount / 5, 1);

  // Only determine report type if it's actually medical
  let reportType = null;

  if (isMedical) {
    if (textLower.includes('blood') || textLower.includes('hemoglobin') || textLower.includes('cbc')) {
      reportType = 'Blood Test Report';
    } else if (textLower.includes('urine') || textLower.includes('urinalysis')) {
      reportType = 'Urine Analysis Report';
    } else if (textLower.includes('cholesterol') || textLower.includes('lipid')) {
      reportType = 'Lipid Profile Report';
    } else if (textLower.includes('x-ray') || textLower.includes('chest') || textLower.includes('radiolog')) {
      reportType = 'X-Ray Report';
    } else if (textLower.includes('ecg') || textLower.includes('ekg') || textLower.includes('electrocardiogram')) {
      reportType = 'ECG Report';
    } else {
      reportType = 'General Medical Report';
    }
  }

  return {
    isMedical,
    reportType,
    medicalConfidence,
    foundKeywords,
    keywordCount
  };
}

// Extract medical parameters from text
function extractMedicalParameters(text) {
  const parameters = [];

  const patterns = [
    { name: 'Hemoglobin', regex: /hemoglobin[:\s]*([0-9.]+)\s*(g\/dl|mg\/dl)/i },
    { name: 'Blood Pressure', regex: /blood\s*pressure[:\s]*([0-9]+\/[0-9]+)\s*mmhg/i },
    { name: 'Heart Rate', regex: /heart\s*rate[:\s]*([0-9]+)\s*(bpm|beats)/i },
    { name: 'Temperature', regex: /temperature[:\s]*([0-9.]+)\s*[°]?[fc]/i },
    { name: 'Glucose', regex: /glucose[:\s]*([0-9.]+)\s*(mg\/dl)/i },
    { name: 'Cholesterol', regex: /cholesterol[:\s]*([0-9.]+)\s*(mg\/dl)/i },
    { name: 'WBC Count', regex: /wbc[:\s]*([0-9,]+)\s*(\/μl|per|ul)/i },
    { name: 'RBC Count', regex: /rbc[:\s]*([0-9.]+)\s*(million|mil)/i },
    { name: 'Platelet Count', regex: /platelet[:\s]*([0-9,]+)\s*(\/μl|per|ul)/i },
    { name: 'Hematocrit', regex: /hematocrit[:\s]*([0-9.]+)\s*%/i },
  ];

  patterns.forEach(pattern => {
    const match = text.match(pattern.regex);
    if (match) {
      parameters.push({
        name: pattern.name,
        value: match[1] + (match[2] ? ' ' + match[2] : ''),
        status: 'normal' // Default status, could be enhanced with range checking
      });
    }
  });

  return parameters;
}

module.exports = async function performOCR(filePath, fileType) {
  try {
    let result;

    // OCR.space supports both images and PDFs
    if (fileType.includes("pdf")) {
      result = await extractTextFromPDF(filePath);
    } else {
      result = await extractTextFromImage(filePath);
    }

    // Analyze the extracted text for medical content
    const analysis = analyzeMedicalContent(result.text);

    // If not medical content, return early with raw text
    if (!analysis.isMedical) {
      return {
        status: "not_medical_document",
        rawText: result.text,
        ocrConfidence: result.confidence,
        medicalConfidence: analysis.medicalConfidence,
        foundKeywords: analysis.foundKeywords,
        keywordCount: analysis.keywordCount
      };
    }

    // Only extract medical parameters if it's actually medical content
    const parameters = extractMedicalParameters(result.text);

    // Generate AI analysis using Gemini
    let aiAnalysis = null;
    try {
      const geminiService = require('./geminiService');
      const geminiResult = await geminiService.analyzeMedicalReport(result.text, analysis.reportType);
      
      if (geminiResult.success) {
        aiAnalysis = geminiResult.analysis;
        console.log('✅ Gemini AI analysis completed successfully');
      } else {
        console.log('⚠️  Gemini AI analysis failed, using fallback');
        aiAnalysis = geminiResult.fallback;
      }
    } catch (aiError) {
      console.error('AI Analysis Error:', aiError.message);
      // Continue without AI analysis if it fails
    }

    return {
      status: "medical_document",
      text: result.text,
      ocrConfidence: result.confidence,
      medicalConfidence: analysis.medicalConfidence,
      isMedical: analysis.isMedical,
      reportType: analysis.reportType,
      parameters: parameters,
      foundKeywords: analysis.foundKeywords,
      keywordCount: analysis.keywordCount,
      aiAnalysis: aiAnalysis // Add AI-generated analysis
    };
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw error;
  }
};