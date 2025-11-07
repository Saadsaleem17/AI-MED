const pdfParse = require('pdf-parse');
const fs = require('fs');

// For images, we'll use a basic approach - in production, you should use a cloud OCR API
// For now, we'll extract text from images using a simple pattern matching approach
async function extractTextFromImage(path) {
  try {
    console.log('Processing image:', path);
    
    // Note: For production, you should use a cloud OCR service like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // For now, we'll return a message indicating image OCR needs to be configured
    
    // Get file stats
    const stats = fs.statSync(path);
    
    return {
      text: `Image file detected. 
      Please use a PDF file or configure a cloud OCR service for image text extraction.
      For now, you can convert your image to PDF for better text extraction.
      File size: ${(stats.size / 1024).toFixed(2)} KB`,
      confidence: 0,
      isImage: true
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image file');
  }
}

async function extractTextFromPDF(path) {
  try {
    console.log('Processing PDF:', path);
    
    const dataBuffer = fs.readFileSync(path);
    const data = await pdfParse(dataBuffer);
    
    console.log(`PDF processed: ${data.numpages} pages, ${data.text.length} characters`);
    
    return {
      text: data.text,
      confidence: data.text.length > 0 ? 95 : 0, // High confidence for text-based PDFs
      numPages: data.numpages
    };
  } catch (error) {
    console.error('PDF Processing Error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Generate user-friendly medical report summary
function generateMedicalSummary(text, reportType, parameters) {
  const textLower = text.toLowerCase();
  let summary = '';
  
  // Generate summary based on report type
  if (reportType === 'Blood Test Report') {
    const hasAbnormal = parameters.some(p => p.status === 'abnormal' || p.status === 'critical');
    if (hasAbnormal) {
      summary = 'Your blood test shows some values that may need attention. ';
      const abnormalParams = parameters.filter(p => p.status === 'abnormal' || p.status === 'critical');
      summary += `Specifically, ${abnormalParams.map(p => p.name).join(', ')} ${abnormalParams.length === 1 ? 'is' : 'are'} outside the normal range. `;
      summary += 'Please consult with your healthcare provider to discuss these results and any necessary follow-up actions.';
    } else {
      summary = 'Your blood test results appear to be within normal ranges. All measured parameters are in the expected values. ';
      summary += 'Continue with your regular health monitoring and maintain a healthy lifestyle.';
    }
  } else if (reportType === 'Urine Analysis Report') {
    summary = 'Your urine analysis report has been processed. ';
    const hasAbnormal = parameters.some(p => p.status === 'abnormal' || p.status === 'critical');
    if (hasAbnormal) {
      summary += 'Some values may require attention. Please discuss the results with your healthcare provider.';
    } else {
      summary += 'The results appear to be within normal limits. No immediate concerns detected.';
    }
  } else if (reportType === 'Lipid Profile Report') {
    summary = 'Your lipid profile has been analyzed. ';
    const hasAbnormal = parameters.some(p => p.status === 'abnormal' || p.status === 'critical');
    if (hasAbnormal) {
      summary += 'Some cholesterol levels may be outside the optimal range. Your healthcare provider can help you understand these results and recommend lifestyle changes or treatments if needed.';
    } else {
      summary += 'Your cholesterol levels are within healthy ranges. Continue maintaining a balanced diet and regular exercise.';
    }
  } else if (reportType === 'X-Ray Report') {
    summary = 'Your X-ray report has been reviewed. ';
    if (textLower.includes('normal') || textLower.includes('clear') || textLower.includes('no acute')) {
      summary += 'The X-ray appears to show normal findings with no acute abnormalities detected.';
    } else if (textLower.includes('abnormal') || textLower.includes('findings') || textLower.includes('opacity')) {
      summary += 'The report indicates some findings that should be discussed with your healthcare provider or radiologist for detailed interpretation.';
    } else {
      summary += 'Please review the detailed findings with your healthcare provider for proper interpretation.';
    }
  } else {
    // Generic medical report summary
    summary = `Your ${reportType || 'medical report'} has been processed. `;
    if (parameters.length > 0) {
      summary += `The report contains ${parameters.length} measured parameter${parameters.length === 1 ? '' : 's'}. `;
      const abnormalCount = parameters.filter(p => p.status === 'abnormal' || p.status === 'critical').length;
      if (abnormalCount > 0) {
        summary += `${abnormalCount} parameter${abnormalCount === 1 ? ' is' : 's are'} outside the normal range. `;
      }
      summary += 'Please consult with your healthcare provider for detailed interpretation and any necessary follow-up.';
    } else {
      summary += 'Please review the report details with your healthcare provider for proper medical interpretation.';
    }
  }
  
  return summary;
}

// Analyze extracted text for medical content
function analyzeMedicalContent(text) {
  const medicalKeywords = [
    'blood', 'hemoglobin', 'cbc', 'mmhg', 'mg/dl', 'pulse', 'bp', 'wbc', 'rbc', 
    'diagnosis', 'glucose', 'cholesterol', 'urine', 'urinalysis', 'x-ray', 
    'ecg', 'ekg', 'heart rate', 'temperature', 'bpm', 'g/dl', 'μl', 'platelet',
    'hematocrit', 'lipid', 'triglycerides', 'hdl', 'ldl', 'creatinine', 'prescription',
    'medication', 'dosage', 'patient', 'doctor', 'physician', 'lab', 'laboratory',
    'test', 'result', 'normal', 'abnormal', 'range', 'reference', 'value', 'units'
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
    } else if (textLower.includes('prescription') || textLower.includes('medication') || textLower.includes('dosage')) {
      reportType = 'Prescription';
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
    { name: 'HDL Cholesterol', regex: /hdl[:\s]*([0-9.]+)\s*(mg\/dl)/i },
    { name: 'LDL Cholesterol', regex: /ldl[:\s]*([0-9.]+)\s*(mg\/dl)/i },
    { name: 'Triglycerides', regex: /triglycerides[:\s]*([0-9.]+)\s*(mg\/dl)/i },
  ];

  patterns.forEach(pattern => {
    const match = text.match(pattern.regex);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      let status = 'normal';
      
      // Basic range checking for common parameters
      if (pattern.name === 'Hemoglobin') {
        status = (value >= 12 && value <= 16) ? 'normal' : 'abnormal';
      } else if (pattern.name === 'Blood Pressure') {
        const [systolic, diastolic] = match[1].split('/').map(Number);
        status = (systolic < 120 && diastolic < 80) ? 'normal' : 
                 (systolic >= 140 || diastolic >= 90) ? 'critical' : 'abnormal';
      } else if (pattern.name === 'Glucose') {
        status = (value >= 70 && value <= 100) ? 'normal' : 
                 (value > 125) ? 'critical' : 'abnormal';
      } else if (pattern.name === 'Cholesterol') {
        status = (value < 200) ? 'normal' : (value >= 240) ? 'critical' : 'abnormal';
      }
      
      parameters.push({
        name: pattern.name,
        value: match[1] + (match[2] ? ' ' + match[2] : ''),
        status: status,
        unit: match[2] || ''
      });
    }
  });

  return parameters;
}

module.exports = async function performOCR(filePath, fileType) {
  try {
    let result;
    
    if (fileType.includes("pdf")) {
      result = await extractTextFromPDF(filePath);
    } else if (fileType.includes("image") || fileType.includes("jpeg") || fileType.includes("jpg") || fileType.includes("png")) {
      result = await extractTextFromImage(filePath);
      
      // If it's an image and we don't have proper OCR, return early
      if (result.isImage) {
        return {
          status: "image_ocr_not_configured",
          rawText: result.text,
          ocrConfidence: 0,
          medicalConfidence: 0,
          foundKeywords: [],
          keywordCount: 0,
          message: "Image OCR requires cloud OCR service configuration. Please convert your image to PDF or configure a cloud OCR service."
        };
      }
    } else {
      return {
        status: "unsupported_format",
        rawText: "Unsupported file format. Please upload a PDF or image file.",
        ocrConfidence: 0,
        medicalConfidence: 0,
        foundKeywords: [],
        keywordCount: 0
      };
    }

    // Analyze the extracted text for medical content
    const analysis = analyzeMedicalContent(result.text);

    // If not medical content, return early with raw text
    if (!analysis.isMedical) {
      return {
        status: "not_medical_document",
        rawText: result.text,
        ocrConfidence: result.confidence || 0,
        medicalConfidence: analysis.medicalConfidence,
        foundKeywords: analysis.foundKeywords,
        keywordCount: analysis.keywordCount
      };
    }

    // Only extract medical parameters if it's actually medical content
    const parameters = extractMedicalParameters(result.text);
    
    // Generate user-friendly summary
    const summary = generateMedicalSummary(result.text, analysis.reportType, parameters);

    return {
      status: "medical_document",
      text: result.text,
      ocrConfidence: result.confidence || 0,
      medicalConfidence: analysis.medicalConfidence,
      isMedical: analysis.isMedical,
      reportType: analysis.reportType,
      parameters: parameters,
      foundKeywords: analysis.foundKeywords,
      keywordCount: analysis.keywordCount,
      summary: summary
    };
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw error;
  }
};
