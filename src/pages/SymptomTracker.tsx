import { ArrowLeft, Plus, Thermometer, Calendar, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface SymptomLog {
  _id: string;
  symptoms: string[];
  severity: string;
  temperature?: number;
  notes?: string;
  createdAt: string;
}

const commonSymptoms = [
  "Fever", "Cough", "Headache", "Sore Throat", "Runny Nose",
  "Body Ache", "Fatigue", "Nausea", "Vomiting", "Diarrhea",
  "Chest Pain", "Shortness of Breath", "Dizziness", "Chills"
];

const SymptomTracker = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    symptoms: [] as string[],
    severity: '',
    temperature: '',
    notes: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/symptoms/${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load symptom logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.symptoms.length === 0 || !formData.severity) {
      toast.error('Please select at least one symptom and severity');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          symptoms: formData.symptoms,
          severity: formData.severity,
          temperature: formData.temperature ? Number(formData.temperature) : undefined,
          notes: formData.notes
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Symptom log saved successfully');
        setShowAddDialog(false);
        setFormData({ symptoms: [], severity: '', temperature: '', notes: '' });
        fetchLogs();
      } else {
        toast.error(data.message || 'Failed to save symptom log');
      }
    } catch (error) {
      console.error('Error saving log:', error);
      toast.error('Failed to save symptom log');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const response = await fetch(`${API_URL}/symptoms/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Log deleted successfully');
        fetchLogs();
      } else {
        toast.error('Failed to delete log');
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Mild': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-orange-600 bg-orange-100';
      case 'Severe': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground px-6 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Symptom Tracker</h1>
          <button
            onClick={() => setShowAddDialog(true)}
            className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm opacity-90">Track your symptoms over time</p>
      </div>

      {/* Symptom Logs */}
      <div className="px-6 mt-6">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No symptom logs yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Log
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log._id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(log._id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {log.symptoms.map((symptom, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-full font-medium ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  {log.temperature && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Thermometer className="w-4 h-4" />
                      <span>{log.temperature}°F</span>
                    </div>
                  )}
                </div>

                {log.notes && (
                  <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                    {log.notes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Symptom Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Your Symptoms</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Select Symptoms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {commonSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.symptoms.includes(symptom)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature">Temperature (°F) - Optional</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="e.g., 98.6"
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes - Optional</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional details about your symptoms..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              Save Symptom Log
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default SymptomTracker;
