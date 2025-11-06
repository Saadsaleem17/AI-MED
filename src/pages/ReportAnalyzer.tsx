import { ArrowLeft, Upload, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { reportService, Report } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import { ocrService } from "@/services/ocrService";

const ReportAnalyzer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type - only images for now
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG or PNG). PDF support coming soon.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setOcrProgress(0);
    setProcessingStep('Uploading file...');
    
    try {
      // Step 1: Upload and process with backend OCR
      setProcessingStep('Processing document with OCR...');
      setOcrProgress(30);
      
      const ocrResult = await ocrService.extractText(file);
      
      setOcrProgress(80);
      setProcessingStep('Generating analysis...');
      
      // Step 2: Generate analysis result from OCR data
      const analysisResult = generateAnalysisFromOCR(file, ocrResult);
      
      setOcrProgress(100);
      setProcessingStep('Complete!');
      
      setAnalysis(analysisResult);
      setLoading(false);
      
      toast({
        title: "File Processed Successfully",
        description: `Extracted text with ${Math.round(ocrResult.confidence)}% confidence`,
      });
      
    } catch (error) {
      console.error('Processing error:', error);
      setLoading(false);
      
      toast({
        title: "Processing Failed",
        description: (error as Error).message || "Could not extract text from file. Please try a clearer image or different file.",
        variant: "destructive",
      });
    }
  };

  const generateAnalysisFromOCR = (file: File, ocrResult: any) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const patientName = currentUser.firstName && currentUser.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : 'Patient';

    // Check if format is unsupported
    if (ocrResult.status === 'unsupported_format') {
      toast({
        title: "Unsupported Format",
        description: "PDF processing is not currently supported. Please upload an image (JPG/PNG) instead.",
        variant: "destructive",
      });
      
      return {
        reportType: 'Unsupported Format',
        text: ocrResult.rawText,
        summary: 'Please convert your PDF to an image format (JPG or PNG) and try again.',
        parameters: [],
        patientName,
        uploadDate: new Date().toISOString(),
        ocrConfidence: 0,
        medicalConfidence: 0,
        isRealData: false,
        isUnsupported: true,
        foundKeywords: []
      };
    }

    // Check if it's not a medical document
    if (ocrResult.status === 'not_medical_document') {
      toast({
        title: "Not a Medical Document",
        description: `This appears to be a ${file.name.split('.').pop()?.toUpperCase()} document, not a medical report. Found ${ocrResult.keywordCount} medical keywords.`,
        variant: "destructive",
      });
      
      return {
        reportType: 'Non-Medical Document',
        text: ocrResult.rawText,
        summary: `This document does not contain medical information. It appears to be a regular document with ${ocrResult.keywordCount} medical-related keywords detected. OCR confidence: ${Math.round(ocrResult.ocrConfidence)}%`,
        parameters: [],
        patientName,
        uploadDate: new Date().toISOString(),
        ocrConfidence: ocrResult.ocrConfidence,
        medicalConfidence: ocrResult.medicalConfidence,
        isRealData: true,
        isNonMedical: true,
        foundKeywords: ocrResult.foundKeywords
      };
    }

    // Check OCR confidence
    if (ocrResult.ocrConfidence < 80) {
      toast({
        title: "Low OCR Quality",
        description: `Text extraction confidence is ${Math.round(ocrResult.ocrConfidence)}%. Results may be inaccurate.`,
        variant: "destructive",
      });
    }

    // Check medical confidence
    if (ocrResult.medicalConfidence < 0.8) {
      toast({
        title: "Uncertain Medical Content",
        description: `Medical content confidence is ${Math.round(ocrResult.medicalConfidence * 100)}%. Please verify results.`,
        variant: "destructive",
      });
    }

    // Use only extracted parameters - no fallback generation
    const parameters = ocrResult.parameters || [];

    // Generate summary based on actual extracted content
    const summary = generateSummaryFromContent(ocrResult.text, ocrResult.reportType, parameters);

    return {
      reportType: ocrResult.reportType,
      text: ocrResult.text,
      summary,
      parameters,
      patientName,
      uploadDate: new Date().toISOString(),
      ocrConfidence: ocrResult.ocrConfidence,
      medicalConfidence: ocrResult.medicalConfidence,
      isRealData: true,
      foundKeywords: ocrResult.foundKeywords
    };
  };

  // Removed fallback parameter generation - no more hallucinated medical data

  const generateSummaryFromContent = (text: string, reportType: string, parameters: any[]) => {
    const textLower = text.toLowerCase();
    
    // Look for explicit conclusions in the extracted text
    if (textLower.includes('normal') && textLower.includes('within')) {
      return "Based on the extracted report, most values appear to be within normal ranges. Please consult with your healthcare provider for detailed interpretation.";
    } else if (textLower.includes('abnormal') || textLower.includes('elevated') || textLower.includes('low')) {
      return "The report indicates some values that may require attention. Please follow up with your healthcare provider for proper medical interpretation.";
    } else if (parameters.length > 0) {
      return `${reportType || 'Medical report'} processed. ${parameters.length} parameters extracted from the document. Please consult your physician for professional interpretation.`;
    } else {
      return `${reportType || 'Document'} processed. No specific medical parameters were automatically extracted. Please review the extracted text and consult your healthcare provider.`;
    }
  };

  const generateMockAnalysis = (file: File) => {
    const fileName = file.name.toLowerCase();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const patientName = currentUser.firstName && currentUser.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : 'Patient';

    // Determine report type based on filename
    let reportType = 'General Medical Report';
    let parameters: any[] = [];
    let summary = '';
    let extractedText = '';

    if (fileName.includes('blood') || fileName.includes('cbc') || fileName.includes('hemoglobin')) {
      reportType = 'Blood Test Report';
      parameters = generateBloodTestParameters();
      summary = generateBloodTestSummary(parameters);
      extractedText = `Complete Blood Count (CBC) Report\nPatient: ${patientName}\nDate: ${new Date().toLocaleDateString()}\nLab: Medical Laboratory Services\n\nTest Results:\n${parameters.map(p => `${p.name}: ${p.value}`).join('\n')}`;
    } else if (fileName.includes('urine') || fileName.includes('urinalysis')) {
      reportType = 'Urine Analysis Report';
      parameters = generateUrineTestParameters();
      summary = generateUrineTestSummary(parameters);
      extractedText = `Urinalysis Report\nPatient: ${patientName}\nDate: ${new Date().toLocaleDateString()}\nLab: Medical Laboratory Services\n\nTest Results:\n${parameters.map(p => `${p.name}: ${p.value}`).join('\n')}`;
    } else if (fileName.includes('lipid') || fileName.includes('cholesterol')) {
      reportType = 'Lipid Profile Report';
      parameters = generateLipidTestParameters();
      summary = generateLipidTestSummary(parameters);
      extractedText = `Lipid Profile Report\nPatient: ${patientName}\nDate: ${new Date().toLocaleDateString()}\nLab: Medical Laboratory Services\n\nTest Results:\n${parameters.map(p => `${p.name}: ${p.value}`).join('\n')}`;
    } else if (fileName.includes('xray') || fileName.includes('x-ray') || fileName.includes('chest')) {
      reportType = 'X-Ray Report';
      parameters = [];
      summary = generateXRayReport();
      extractedText = `Chest X-Ray Report\nPatient: ${patientName}\nDate: ${new Date().toLocaleDateString()}\nRadiologist: Dr. Sarah Wilson\n\n${summary}`;
    } else {
      // Generic medical report
      parameters = generateGenericParameters();
      summary = generateGenericSummary(parameters);
      extractedText = `Medical Report\nPatient: ${patientName}\nDate: ${new Date().toLocaleDateString()}\nPhysician: Dr. Michael Chen\n\nFindings:\n${parameters.map(p => `${p.name}: ${p.value}`).join('\n')}`;
    }

    return {
      reportType,
      text: extractedText,
      summary,
      parameters,
      patientName,
      uploadDate: new Date().toISOString(),
    };
  };

  const generateBloodTestParameters = () => {
    const variations = [
      { name: "Hemoglobin", baseValue: 14.5, unit: "g/dL", normalRange: [12, 16] },
      { name: "WBC Count", baseValue: 7200, unit: "/μL", normalRange: [4000, 11000] },
      { name: "RBC Count", baseValue: 4.8, unit: "million/μL", normalRange: [4.2, 5.4] },
      { name: "Platelet Count", baseValue: 280000, unit: "/μL", normalRange: [150000, 450000] },
      { name: "Hematocrit", baseValue: 42, unit: "%", normalRange: [36, 46] },
    ];

    return variations.map(param => {
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const value = param.baseValue * (1 + variation);
      const formattedValue = param.unit === "/μL" && value > 1000 
        ? `${Math.round(value).toLocaleString()}${param.unit}`
        : `${value.toFixed(1)} ${param.unit}`;
      
      const status = value >= param.normalRange[0] && value <= param.normalRange[1] 
        ? 'normal' 
        : Math.random() > 0.7 ? 'abnormal' : 'normal'; // Mostly normal results

      return { name: param.name, value: formattedValue, status };
    });
  };

  const generateUrineTestParameters = () => {
    const parameters = [
      { name: "Specific Gravity", value: "1.020", status: "normal" },
      { name: "pH", value: "6.5", status: "normal" },
      { name: "Protein", value: "Negative", status: "normal" },
      { name: "Glucose", value: "Negative", status: "normal" },
      { name: "Ketones", value: "Negative", status: "normal" },
      { name: "Blood", value: "Negative", status: "normal" },
    ];

    // Add some random variation
    return parameters.map(param => ({
      ...param,
      status: Math.random() > 0.9 ? 'abnormal' : 'normal'
    }));
  };

  const generateLipidTestParameters = () => {
    const variations = [
      { name: "Total Cholesterol", baseValue: 180, unit: "mg/dL", normalRange: [0, 200] },
      { name: "HDL Cholesterol", baseValue: 55, unit: "mg/dL", normalRange: [40, 100] },
      { name: "LDL Cholesterol", baseValue: 110, unit: "mg/dL", normalRange: [0, 130] },
      { name: "Triglycerides", baseValue: 120, unit: "mg/dL", normalRange: [0, 150] },
    ];

    return variations.map(param => {
      const variation = (Math.random() - 0.5) * 0.4;
      const value = Math.round(param.baseValue * (1 + variation));
      const status = value >= param.normalRange[0] && value <= param.normalRange[1] 
        ? 'normal' 
        : 'abnormal';

      return { 
        name: param.name, 
        value: `${value} ${param.unit}`, 
        status: Math.random() > 0.8 ? 'abnormal' : 'normal'
      };
    });
  };

  const generateGenericParameters = () => {
    const commonTests = [
      { name: "Blood Pressure", value: "120/80 mmHg", status: "normal" },
      { name: "Heart Rate", value: "72 bpm", status: "normal" },
      { name: "Temperature", value: "98.6°F", status: "normal" },
      { name: "Respiratory Rate", value: "16/min", status: "normal" },
    ];

    return commonTests.map(param => ({
      ...param,
      status: Math.random() > 0.85 ? 'abnormal' : 'normal'
    }));
  };

  const generateBloodTestSummary = (parameters: any[]) => {
    const abnormalCount = parameters.filter(p => p.status === 'abnormal').length;
    
    if (abnormalCount === 0) {
      return "All blood parameters are within normal limits. Continue regular monitoring and maintain healthy lifestyle.";
    } else if (abnormalCount === 1) {
      return "Most parameters are normal with one value slightly outside the reference range. Follow up with your physician for further evaluation.";
    } else {
      return "Several parameters require attention. Please consult with your healthcare provider for detailed interpretation and treatment recommendations.";
    }
  };

  const generateUrineTestSummary = (parameters: any[]) => {
    const abnormalCount = parameters.filter(p => p.status === 'abnormal').length;
    
    if (abnormalCount === 0) {
      return "Urinalysis results are normal. No signs of infection, kidney dysfunction, or metabolic disorders detected.";
    } else {
      return "Some abnormalities detected in urine analysis. Further evaluation may be needed to rule out underlying conditions.";
    }
  };

  const generateLipidTestSummary = (parameters: any[]) => {
    const abnormalCount = parameters.filter(p => p.status === 'abnormal').length;
    
    if (abnormalCount === 0) {
      return "Lipid profile shows healthy cholesterol levels. Continue current diet and exercise regimen.";
    } else {
      return "Lipid levels indicate potential cardiovascular risk. Consider dietary modifications and lifestyle changes as recommended by your physician.";
    }
  };

  const generateXRayReport = () => {
    const findings = [
      "Chest X-ray shows clear lung fields with no evidence of consolidation, pleural effusion, or pneumothorax.",
      "Heart size appears normal. No acute cardiopulmonary abnormalities detected.",
      "Chest X-ray reveals mild cardiomegaly but clear lung fields. No acute pulmonary pathology identified.",
      "Normal chest X-ray with clear lungs and normal heart size. No abnormalities detected.",
    ];
    
    return findings[Math.floor(Math.random() * findings.length)];
  };

  const generateGenericSummary = (parameters: any[]) => {
    const abnormalCount = parameters.filter(p => p.status === 'abnormal').length;
    
    if (abnormalCount === 0) {
      return "Physical examination and vital signs are within normal limits. Patient appears to be in good health.";
    } else {
      return "Some vital signs require monitoring. Follow up care recommended to address any concerns.";
    }
  };

  const triggerFileInput = () => {
    document.getElementById('file-input')?.click();
  };

  const handleSaveReport = async () => {
    if (!analysis) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      
      const report: Omit<Report, '_id' | 'uploadDate'> = {
        userId,
        fileName: selectedFile?.name || 'medical-report.pdf',
        fileType: selectedFile?.type || 'application/pdf',
        extractedText: analysis.text,
        summary: analysis.summary,
        parameters: analysis.parameters,
        metadata: {
          reportDate: new Date(),
          patientName: analysis.patientName,
        },
      };

      const result = await reportService.createReport(report);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Report saved successfully!",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
      console.error('Error saving report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground px-6 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center hover:bg-primary-foreground/30 transition-smooth"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Report Analyzer</h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Upload Area */}
      <div className="px-6 mt-6">
        <input
          id="file-input"
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Card 
          className={`p-8 shadow-card mb-6 border-2 border-dashed transition-smooth cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary'
          }`}
          onClick={triggerFileInput}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold mb-1">Upload Medical Report</p>
              <p className="text-sm text-muted-foreground">
                Drop image files here, or click to browse (JPG, PNG)
              </p>
              {selectedFile && (
                <p className="text-sm text-primary mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <Button onClick={triggerFileInput} type="button">
              {selectedFile ? 'Change File' : 'Choose File'}
            </Button>
          </div>
        </Card>

        {/* Loading State with OCR Progress */}
        {loading && (
          <Card className="p-8 shadow-card mb-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">
                {processingStep}
              </p>
              {ocrProgress > 0 && (
                <div className="w-full max-w-xs">
                  <div className="bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ocrProgress}% complete
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <div className="space-y-4">
            <Card className={`p-5 shadow-md ${analysis.isNonMedical ? 'border-yellow-200 bg-yellow-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className={`w-5 h-5 ${analysis.isNonMedical ? 'text-yellow-600' : 'text-primary'}`} />
                  <h3 className="font-bold">{analysis.reportType}</h3>
                </div>
                {analysis.isRealData && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <Eye className="w-3 h-3" />
                      OCR: {Math.round(analysis.ocrConfidence)}%
                    </div>
                    {analysis.medicalConfidence !== undefined && (
                      <div className={`flex items-center gap-1 ${analysis.medicalConfidence > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                        Medical: {Math.round(analysis.medicalConfidence * 100)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-secondary rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.text}</p>
              </div>
              {analysis.foundKeywords && analysis.foundKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Found keywords: {analysis.foundKeywords.join(', ')}
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-5 shadow-md bg-sky-blue-light">
              <h3 className="font-bold mb-2">AI Simplified Summary</h3>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </Card>

            {analysis.parameters.length > 0 && (
              <Card className="p-5 shadow-md">
                <h3 className="font-bold mb-4">Detected Parameters</h3>
                <div className="space-y-3">
                  {analysis.parameters.map((param: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-secondary rounded-xl"
                    >
                      <div>
                        <p className="font-medium">{param.name}</p>
                        <p className="text-sm text-muted-foreground">{param.value}</p>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          param.status === "normal" ? "bg-green-500" : 
                          param.status === "abnormal" ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSaveReport}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save to My Records"}
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ReportAnalyzer;
