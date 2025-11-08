import { ArrowLeft, AlertCircle, Thermometer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AnalysisResult {
  possibleConditions: Array<{
    name: string;
    probability: string;
    description: string;
  }>;
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high';
  urgencyMessage: string;
  disclaimer: string;
  usedMedicalHistory?: boolean;
}

const SymptomChecker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms Entered",
        description: "Please describe your symptoms to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get userId from localStorage or sessionStorage
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      let userId = localStorage.getItem('userId') || null;
      
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user._id || user.id || userId;
      }

      console.log('🔍 Sending symptom analysis request with userId:', userId);
      console.log('📦 User data available:', !!userStr);

      const response = await axios.post(`${API_URL}/symptoms/analyze`, {
        symptoms: symptoms.trim(),
        userId: userId // Include userId to fetch medical history
      });

      console.log('✅ Analysis response received:', response.data);

      setAnalysis(response.data);
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.error || "Failed to analyze symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = (symptomText: string): AnalysisResult => {
    const lowerSymptoms = symptomText.toLowerCase();
    const conditions: Array<{ name: string; probability: string; description: string }> = [];
    let urgency: 'low' | 'medium' | 'high' = 'low';
    const recommendations: string[] = [];

    // Check for emergency symptoms
    if (
      lowerSymptoms.includes("chest pain") ||
      lowerSymptoms.includes("shortness of breath") ||
      lowerSymptoms.includes("difficulty breathing")
    ) {
      urgency = "high";
      conditions.push({
        name: "Cardiac Event (Requires Immediate Attention)",
        probability: "Urgent",
        description:
          "Chest pain and shortness of breath can indicate serious heart conditions. Seek emergency medical care immediately.",
      });
      recommendations.push("🚨 Call emergency services (911) immediately");
      recommendations.push("Do not drive yourself to the hospital");
      recommendations.push("Chew aspirin if available and not allergic");
    }

    // Respiratory infections
    if (
      lowerSymptoms.includes("fever") &&
      (lowerSymptoms.includes("cough") || lowerSymptoms.includes("sore throat"))
    ) {
      if (urgency !== "high") urgency = "medium";
      
      if (lowerSymptoms.includes("shortness of breath") || lowerSymptoms.includes("difficulty breathing")) {
        conditions.push({
          name: "Pneumonia",
          probability: "Moderate",
          description:
            "Combination of fever, cough, and breathing difficulty may indicate pneumonia. Medical evaluation recommended.",
        });
      } else {
        conditions.push({
          name: "Upper Respiratory Infection (Common Cold/Flu)",
          probability: "High",
          description:
            "Fever with cough and sore throat are typical symptoms of viral respiratory infections.",
        });
      }
      
      recommendations.push("Rest and stay hydrated");
      recommendations.push("Monitor temperature regularly");
      recommendations.push("Consider over-the-counter fever reducers");
      recommendations.push("Consult doctor if symptoms worsen or persist beyond 5 days");
    }

    // Gastrointestinal issues
    if (
      lowerSymptoms.includes("nausea") ||
      lowerSymptoms.includes("vomiting") ||
      lowerSymptoms.includes("diarrhea")
    ) {
      if (urgency === "low") urgency = "medium";
      
      conditions.push({
        name: "Gastroenteritis (Stomach Flu)",
        probability: "High",
        description:
          "Nausea, vomiting, and diarrhea are common symptoms of viral or bacterial gastroenteritis.",
      });
      
      if (lowerSymptoms.includes("stomach pain") || lowerSymptoms.includes("abdominal pain")) {
        conditions.push({
          name: "Food Poisoning",
          probability: "Moderate",
          description:
            "Stomach pain with digestive symptoms may indicate food poisoning or bacterial infection.",
        });
      }
      
      recommendations.push("Stay well hydrated with water and electrolyte solutions");
      recommendations.push("Eat bland foods (BRAT diet: bananas, rice, applesauce, toast)");
      recommendations.push("Avoid dairy, caffeine, and fatty foods");
      recommendations.push("Seek medical care if symptoms persist beyond 48 hours");
    }

    // Headache conditions
    if (lowerSymptoms.includes("headache")) {
      if (lowerSymptoms.includes("fever") && (lowerSymptoms.includes("stiff neck") || lowerSymptoms.includes("neck stiffness"))) {
        urgency = "high";
        conditions.push({
          name: "Meningitis (Requires Immediate Attention)",
          probability: "Possible",
          description:
            "Severe headache with fever and neck stiffness can indicate meningitis. Seek immediate medical care.",
        });
      } else if (lowerSymptoms.includes("dizziness")) {
        conditions.push({
          name: "Migraine",
          probability: "Moderate",
          description:
            "Headache with dizziness may indicate migraine or tension headache.",
        });
        recommendations.push("Rest in a quiet, dark room");
        recommendations.push("Apply cold compress to forehead");
        recommendations.push("Stay hydrated");
      }
    }

    // Musculoskeletal pain
    if (
      lowerSymptoms.includes("joint pain") ||
      lowerSymptoms.includes("body ache") ||
      lowerSymptoms.includes("back pain") ||
      lowerSymptoms.includes("muscle pain")
    ) {
      if (lowerSymptoms.includes("fever")) {
        conditions.push({
          name: "Viral Infection with Body Aches",
          probability: "High",
          description:
            "Body aches with fever are common in viral infections like flu.",
        });
      } else {
        conditions.push({
          name: "Musculoskeletal Strain",
          probability: "Moderate",
          description:
            "Joint or muscle pain without fever may indicate strain, overuse, or arthritis.",
        });
        recommendations.push("Apply ice for acute pain, heat for chronic pain");
        recommendations.push("Rest the affected area");
        recommendations.push("Consider over-the-counter pain relievers");
        recommendations.push("Gentle stretching and movement as tolerated");
      }
    }

    // Skin conditions
    if (lowerSymptoms.includes("rash") || lowerSymptoms.includes("skin rash")) {
      conditions.push({
        name: "Allergic Reaction or Dermatitis",
        probability: "Moderate",
        description:
          "Skin rash can indicate allergic reaction, contact dermatitis, or viral infection.",
      });
      recommendations.push("Avoid scratching the affected area");
      recommendations.push("Apply cool compress");
      recommendations.push("Consider antihistamine if itchy");
      recommendations.push("Consult doctor if rash spreads or worsens");
    }

    // General fatigue
    if (
      lowerSymptoms.includes("fatigue") &&
      !lowerSymptoms.includes("fever") &&
      lowerSymptoms.split(/\s+/).length < 5
    ) {
      conditions.push({
        name: "General Fatigue",
        probability: "High",
        description:
          "Fatigue alone can be caused by stress, poor sleep, dehydration, or nutritional deficiencies.",
      });
      recommendations.push("Ensure adequate sleep (7-9 hours)");
      recommendations.push("Stay hydrated");
      recommendations.push("Maintain balanced diet");
      recommendations.push("Manage stress levels");
      recommendations.push("Consult doctor if fatigue persists beyond 2 weeks");
    }

    // Default recommendations if none added
    if (recommendations.length === 0) {
      recommendations.push("Monitor symptoms closely");
      recommendations.push("Rest and stay hydrated");
      recommendations.push("Consult healthcare provider if symptoms worsen");
      recommendations.push("Keep a symptom diary");
    }

    // Default condition if none matched
    if (conditions.length === 0) {
      conditions.push({
        name: "Non-Specific Symptoms",
        probability: "Unknown",
        description:
          "The combination of symptoms doesn't match a specific condition. Medical evaluation recommended for proper diagnosis.",
      });
      recommendations.push("Schedule appointment with healthcare provider");
      recommendations.push("Document when symptoms started and their progression");
    }

    const urgencyMessage = 
      urgency === "high" 
        ? "Seek immediate medical attention"
        : urgency === "medium"
        ? "Consult a doctor soon"
        : "Monitor symptoms and rest";

    return {
      possibleConditions: conditions,
      recommendations,
      urgency,
      urgencyMessage,
      disclaimer:
        "This is an AI-powered symptom checker for informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider with any questions about a medical condition. If you have a medical emergency, call emergency services immediately.",
    };
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 border-red-300 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-green-100 border-green-300 text-green-800";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "🚨";
      case "medium":
        return "⚠️";
      default:
        return "ℹ️";
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
          <h1 className="text-2xl font-bold">Symptom Checker</h1>
          <div className="w-12" />
        </div>
        <p className="text-primary-foreground/80 text-sm text-center">
          Select your symptoms to get possible conditions
        </p>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {/* Symptom Input */}
        {!analysis && (
          <Card className="p-4 shadow-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              Describe Your Symptoms
            </h3>
            <Textarea
              placeholder="Type your symptoms here... For example: 'I have a fever, headache, and sore throat for 2 days'"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              Be as detailed as possible. Include when symptoms started, severity, and any other relevant information.
            </p>
            <Button
              onClick={analyzeSymptoms}
              className="w-full"
              disabled={loading || !symptoms.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Symptoms"
              )}
            </Button>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <div className="space-y-4">
            {/* Medical History Used Indicator */}
            {analysis.usedMedicalHistory && (
              <Card className="p-4 shadow-card border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 text-blue-800">
                  <span className="text-xl">📋</span>
                  <div>
                    <h3 className="font-semibold text-sm">Personalized Analysis</h3>
                    <p className="text-xs">
                      This analysis includes insights from your medical history
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Urgency Level */}
            <Card
              className={`p-4 shadow-card border-2 ${getUrgencyColor(
                analysis.urgency
              )}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getUrgencyIcon(analysis.urgency)}</span>
                <div>
                  <h3 className="font-bold">
                    {analysis.urgency === "high"
                      ? "High Urgency"
                      : analysis.urgency === "medium"
                      ? "Moderate Urgency"
                      : "Low Urgency"}
                  </h3>
                  <p className="text-sm">
                    {analysis.urgency === "high"
                      ? "Seek immediate medical attention"
                      : analysis.urgency === "medium"
                      ? "Consult a doctor soon"
                      : "Monitor symptoms and rest"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Possible Conditions */}
            <Card className="p-5 shadow-card">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-primary" />
                Possible Conditions
              </h3>
              <div className="space-y-3">
                {analysis.possibleConditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-secondary rounded-xl border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{condition.name}</h4>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {condition.probability}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {condition.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-5 shadow-card border-green-200 bg-green-50">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-green-800">
                <span>💡</span> Recommendations
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="text-sm flex items-start gap-2 text-green-900"
                  >
                    <span className="text-green-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Disclaimer */}
            <Card className="p-4 shadow-card border-gray-200 bg-gray-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600">{analysis.disclaimer}</p>
              </div>
            </Card>

            {/* Check Again Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAnalysis(null);
                setSymptoms("");
              }}
            >
              Check Different Symptoms
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SymptomChecker;
