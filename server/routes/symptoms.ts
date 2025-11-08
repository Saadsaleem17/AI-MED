import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import SymptomLog from '../models/SymptomLog';
import Report from '../models/Report';
import { analyzeSymptoms } from '../services/geminiService';

const router = express.Router();

// Helper function to extract medicines from medical reports
function extractMedicinesFromReports(reports: any[]) {
  const medicineSet = new Set<string>();
  const medicineDetails: Array<{ name: string; condition: string; date: Date }> = [];
  
  reports.forEach(report => {
    const fullText = `${report.summary} ${report.extractedText || ''}`;
    
    // Common medicine/prescription patterns
    const medicinePatterns = [
      /(?:prescribed|medication|medicine|drug|tablet|capsule|syrup)[:\s]+([^.\n]+)/gi,
      /(?:rx|℞)[:\s]+([^.\n]+)/gi,
      /take\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:\d+|one|two|three)/gi,
      /([A-Z][a-z]+(?:ol|in|ine|ate|ide|cin|xin|pam|zole|pril|sartan|statin))\s+\d+\s*(?:mg|ml|g)/gi
    ];
    
    medicinePatterns.forEach(pattern => {
      const matches = fullText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const medicines = match[1].split(/[,;]/).map(m => m.trim());
          medicines.forEach(med => {
            // Clean up the medicine name
            const cleanMed = med
              .replace(/\d+\s*(?:mg|ml|g|mcg|units?)\b/gi, '')
              .replace(/\b(?:tablet|capsule|syrup|injection|drops?)\b/gi, '')
              .trim();
            
            if (cleanMed.length > 2 && cleanMed.length < 50) {
              medicineSet.add(cleanMed);
              medicineDetails.push({
                name: cleanMed,
                condition: report.summary.substring(0, 100),
                date: report.uploadDate
              });
            }
          });
        }
      }
    });
  });
  
  return {
    uniqueMedicines: Array.from(medicineSet),
    medicineHistory: medicineDetails
  };
}

// Helper function to get patient's medical history
async function getMedicalHistory(userId: string) {
  try {
    console.log('📋 Fetching medical history for userId:', userId);
    
    // Get the most recent 5 reports
    const reports = await Report.find({ userId })
      .sort({ uploadDate: -1 })
      .limit(5)
      .select('summary parameters metadata.reportDate extractedText uploadDate');

    // Get recent symptom logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('🔍 Searching for symptom logs with userId:', userId);
    console.log('📅 Date range: from', thirtyDaysAgo.toISOString(), 'to now');
    
    // Convert userId to ObjectId if it's a valid ObjectId string
    let userIdQuery: any = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdQuery = new mongoose.Types.ObjectId(userId);
      console.log('✅ Converted userId to ObjectId');
    }
    
    const symptomLogs = await SymptomLog.find({ 
      userId: userIdQuery,
      createdAt: { $gte: thirtyDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📊 Found ${reports.length} reports and ${symptomLogs.length} symptom logs for user`);
    
    if (symptomLogs.length > 0) {
      console.log('📝 Sample symptom log:', JSON.stringify(symptomLogs[0], null, 2));
    }

    if ((!reports || reports.length === 0) && (!symptomLogs || symptomLogs.length === 0)) {
      console.log('⚠️  No medical history or symptom logs found for user');
      return null;
    }

    // Process symptom logs
    const symptomHistory = symptomLogs.map(log => ({
      date: log.createdAt,
      symptoms: log.symptoms,
      severity: log.severity,
      temperature: log.temperature,
      notes: log.notes
    }));

    // Analyze symptom patterns
    const symptomFrequency: { [key: string]: number } = {};
    symptomLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
      });
    });

    const recurringSymptoms = Object.entries(symptomFrequency)
      .filter(([_, count]) => count >= 2)
      .map(([symptom, count]) => `${symptom} (${count} times)`);

    // Extract medicines from reports
    const { uniqueMedicines, medicineHistory } = extractMedicinesFromReports(reports);

    // Extract relevant medical information
    const history = {
      symptomLogs: symptomHistory,
      recurringSymptoms,
      previousMedicines: uniqueMedicines,
      medicineHistory: medicineHistory,
      recentReports: reports.map(report => {
        // Extract key medical terms and diagnoses from summary and text
        const fullText = `${report.summary} ${report.extractedText || ''}`.toLowerCase();
        const diagnoses: string[] = [];
        
        // Common diagnosis patterns
        const diagnosisPatterns = [
          /diagnosis[:\s]+([^.\n]+)/gi,
          /diagnosed with[:\s]+([^.\n]+)/gi,
          /impression[:\s]+([^.\n]+)/gi,
          /condition[:\s]+([^.\n]+)/gi,
          /findings[:\s]+([^.\n]+)/gi
        ];
        
        diagnosisPatterns.forEach(pattern => {
          const matches = fullText.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && match[1].trim().length > 3) {
              diagnoses.push(match[1].trim());
            }
          }
        });
        
        return {
          date: report.metadata?.reportDate || report.uploadDate,
          summary: report.summary,
          diagnoses: diagnoses.length > 0 ? diagnoses : [],
          abnormalParameters: report.parameters
            .filter(p => p.status === 'abnormal' || p.status === 'critical')
            .map(p => `${p.name}: ${p.value} ${p.unit || ''} (${p.status})`)
        };
      }),
      allAbnormalParameters: [] as string[],
      allDiagnoses: [] as string[]
    };

    // Collect all unique abnormal parameters and diagnoses
    const abnormalSet = new Set<string>();
    const diagnosisSet = new Set<string>();
    
    reports.forEach(report => {
      report.parameters
        .filter(p => p.status === 'abnormal' || p.status === 'critical')
        .forEach(p => abnormalSet.add(p.name));
      
      // Extract diagnoses from summary and text
      const fullText = `${report.summary} ${report.extractedText || ''}`.toLowerCase();
      const diagnosisPatterns = [
        /diagnosis[:\s]+([^.\n]+)/gi,
        /diagnosed with[:\s]+([^.\n]+)/gi,
        /impression[:\s]+([^.\n]+)/gi
      ];
      
      diagnosisPatterns.forEach(pattern => {
        const matches = fullText.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 3) {
            diagnosisSet.add(match[1].trim());
          }
        }
      });
    });
    
    history.allAbnormalParameters = Array.from(abnormalSet);
    history.allDiagnoses = Array.from(diagnosisSet);

    console.log('📋 Extracted diagnoses:', history.allDiagnoses);
    console.log('💊 Previous medicines:', history.previousMedicines);
    console.log('📊 Abnormal parameters:', history.allAbnormalParameters);
    console.log('🔄 Recurring symptoms:', history.recurringSymptoms);
    console.log('📝 Total symptom logs:', history.symptomLogs.length);

    return history;
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return null;
  }
}

// Get all symptom logs for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const logs = await SymptomLog.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching symptom logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching symptom logs'
    });
  }
});

// Create a new symptom log
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, symptoms, severity, temperature, notes } = req.body;

    if (!userId || !symptoms || !severity) {
      return res.status(400).json({
        success: false,
        message: 'User ID, symptoms, and severity are required'
      });
    }

    const symptomLog = new SymptomLog({
      userId,
      symptoms,
      severity,
      temperature,
      notes
    });

    await symptomLog.save();

    res.status(201).json({
      success: true,
      data: symptomLog,
      message: 'Symptom log created successfully'
    });
  } catch (error) {
    console.error('Error creating symptom log:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating symptom log'
    });
  }
});

// Test endpoint to check medical history
router.get('/test-history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('🧪 Testing medical history fetch for userId:', userId);
    
    const reports = await Report.find({ userId });
    console.log(`📊 Found ${reports.length} reports`);
    
    // Test symptom logs with both string and ObjectId
    const symptomLogsString = await SymptomLog.find({ userId });
    const symptomLogsObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? await SymptomLog.find({ userId: new mongoose.Types.ObjectId(userId) })
      : [];
    
    console.log(`📝 Symptom logs (string query): ${symptomLogsString.length}`);
    console.log(`📝 Symptom logs (ObjectId query): ${symptomLogsObjectId.length}`);
    
    const history = await getMedicalHistory(userId);
    
    res.json({
      success: true,
      userId,
      reportCount: reports.length,
      symptomLogsCount: symptomLogsString.length || symptomLogsObjectId.length,
      history
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze symptoms using AI with medical history
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { symptoms, userId } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms description is required'
      });
    }

    // Get patient's medical history if userId is provided
    let medicalHistory: any = null;
    if (userId) {
      console.log('🔍 Attempting to fetch medical history for userId:', userId);
      medicalHistory = await getMedicalHistory(userId);
      console.log('📋 Medical history retrieved:', medicalHistory ? 'Yes' : 'No');
    } else {
      console.log('⚠️  No userId provided, skipping medical history');
    }

    const analysis = await analyzeSymptoms(symptoms.trim(), medicalHistory);

    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze symptoms'
    });
  }
});

// Delete a symptom log
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await SymptomLog.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Symptom log not found'
      });
    }

    res.json({
      success: true,
      message: 'Symptom log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting symptom log:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting symptom log'
    });
  }
});

export default router;
