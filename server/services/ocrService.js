const Tesseract = require("tesseract.js");
const fs = require("fs");

async function extractTextFromImage(path) {
  try {
    console.log('Starting OCR for image:', path);
    const { data: { text, confidence } } = await Tesseract.recognize(path, "eng", {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log(`OCR completed with ${confidence}% confidence`);
    return { text, confidence };
  } catch (error) {
    console.error('Image OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

async function extractTextFromPDF(path) {
  try {
    console.log('Processing PDF:', path);
    
    // For PDFs, we'll use OCR directly since pdf-parse has compatibility issues
    // In production, you might want to use a different PDF library
    console.log('Using OCR for PDF (pdf-parse compatibility issue)');
    
    // Try to extract text using OCR
    // Note: Tesseract doesn't support PDF directly, so we return a message
    return {
      text: "PDF processing requires conversion to image format. Please convert your PDF to an image (JPG/PNG) for text extraction, or use a text-based PDF.",
      confidence: 0
    };
  } catch (error) {
    console.error('PDF Processing Error:', error);
    throw new Error('Failed to extract text from PDF');
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
    
    // For now, only support images. PDFs require additional setup
    if (fileType.includes("pdf")) {
      return {
        status: "unsupported_format",
        rawText: "PDF processing is currently not supported. Please convert your PDF to an image format (JPG or PNG) and try again.",
        ocrConfidence: 0,
        medicalConfidence: 0,
        foundKeywords: [],
        keywordCount: 0
      };
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

    return {
      status: "medical_document",
      text: result.text,
      ocrConfidence: result.confidence,
      medicalConfidence: analysis.medicalConfidence,
      isMedical: analysis.isMedical,
      reportType: analysis.reportType,
      parameters: parameters,
      foundKeywords: analysis.foundKeywords,
      keywordCount: analysis.keywordCount
    };
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw error;
  }
};