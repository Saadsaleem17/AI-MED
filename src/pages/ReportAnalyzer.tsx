import { ArrowLeft, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { reportService, Report } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";

const ReportAnalyzer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file (JPG, PNG)",
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

  const processFile = (file: File) => {
    setLoading(true);
    
    // Simulate file processing delay
    setTimeout(() => {
      // Mock analysis result based on file
      setAnalysis({
        text: `Medical report from ${file.name}. Uploaded on ${new Date().toLocaleDateString()}. Patient: John Doe`,
        summary: "All values are within normal range. Hemoglobin slightly elevated but acceptable.",
        parameters: [
          { name: "Hemoglobin", value: "15.2 g/dL", status: "normal" },
          { name: "WBC Count", value: "7,500/μL", status: "normal" },
          { name: "Blood Sugar", value: "95 mg/dL", status: "normal" },
        ],
      });
      setLoading(false);
      
      toast({
        title: "File Processed",
        description: `Successfully analyzed ${file.name}`,
      });
    }, 2000);
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
          patientName: 'John Doe',
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
          accept=".pdf,.jpg,.jpeg,.png"
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
                Drop PDF or image files here, or click to browse
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

        {/* Loading State */}
        {loading && (
          <Card className="p-8 shadow-card mb-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">
                Processing your medical report...
              </p>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <div className="space-y-4">
            <Card className="p-5 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Extracted Medical Text</h3>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.text}</p>
            </Card>

            <Card className="p-5 shadow-md bg-sky-blue-light">
              <h3 className="font-bold mb-2">AI Simplified Summary</h3>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </Card>

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
                        param.status === "normal" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </Card>

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
