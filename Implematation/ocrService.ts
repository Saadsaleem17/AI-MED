const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface OCRResult {
  status: 'medical_document' | 'not_medical_document' | 'unsupported_format';
  text?: string;
  rawText?: string;
  ocrConfidence: number;
  medicalConfidence: number;
  isMedical?: boolean;
  reportType?: string;
  parameters?: Array<{name: string, value: string, status: string}>;
  foundKeywords: string[];
  keywordCount: number;
  originalFilename?: string;
}

class OCRService {
  async extractText(file: File): Promise<OCRResult> {
    try {
      console.log('Uploading file for OCR processing...');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/ocr`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'OCR processing failed');
      }

      return result.data;
    } catch (error) {
      console.error('OCR Service Error:', error);
      throw new Error('Failed to process file. Please try again.');
    }
  }

  async checkOCRHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/ocr/health`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('OCR Health Check Failed:', error);
      return false;
    }
  }

  // Analyze extracted text to determine if it's medical content
  analyzeTextContent(text: string): {
    isMedical: boolean;
    reportType: string;
    confidence: number;
  } {
    const medicalKeywords = [
      'patient', 'doctor', 'physician', 'hospital', 'clinic', 'medical',
      'blood', 'urine', 'test', 'result', 'normal', 'abnormal',
      'hemoglobin', 'cholesterol', 'glucose', 'pressure', 'heart rate',
      'temperature', 'diagnosis', 'treatment', 'medication', 'prescription',
      'x-ray', 'scan', 'mri', 'ct', 'ultrasound', 'lab', 'laboratory',
      'mg/dl', 'mmhg', 'bpm', 'g/dl', 'μl', 'ml', 'units'
    ];

    const textLower = text.toLowerCase();
    const foundKeywords = medicalKeywords.filter(keyword => 
      textLower.includes(keyword)
    );

    const isMedical = foundKeywords.length >= 2;
    const confidence = Math.min(foundKeywords.length / 5, 1); // Max confidence at 5+ keywords

    // Determine report type based on keywords
    let reportType = 'General Medical Report';
    
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
    }

    return {
      isMedical,
      reportType,
      confidence
    };
  }

  // Extract specific medical values from text
  extractMedicalValues(text: string): Array<{name: string, value: string, status: string}> {
    const parameters: Array<{name: string, value: string, status: string}> = [];
    const lines = text.split('\n');

    // Common medical parameter patterns
    const patterns = [
      { name: 'Hemoglobin', regex: /hemoglobin[:\s]*([0-9.]+)\s*(g\/dl|mg\/dl)/i },
      { name: 'Blood Pressure', regex: /blood\s*pressure[:\s]*([0-9]+\/[0-9]+)\s*mmhg/i },
      { name: 'Heart Rate', regex: /heart\s*rate[:\s]*([0-9]+)\s*(bpm|beats)/i },
      { name: 'Temperature', regex: /temperature[:\s]*([0-9.]+)\s*[°]?[fc]/i },
      { name: 'Glucose', regex: /glucose[:\s]*([0-9.]+)\s*(mg\/dl)/i },
      { name: 'Cholesterol', regex: /cholesterol[:\s]*([0-9.]+)\s*(mg\/dl)/i },
      { name: 'WBC Count', regex: /wbc[:\s]*([0-9,]+)\s*(\/μl|per|ul)/i },
      { name: 'RBC Count', regex: /rbc[:\s]*([0-9.]+)\s*(million|mil)/i },
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern.regex);
      if (match) {
        parameters.push({
          name: pattern.name,
          value: match[1] + (match[2] ? ' ' + match[2] : ''),
          status: 'normal' // Default to normal, could be enhanced with range checking
        });
      }
    });

    return parameters;
  }
}

export const ocrService = new OCRService();