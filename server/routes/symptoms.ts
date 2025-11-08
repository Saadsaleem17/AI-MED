import express, { Request, Response } from 'express';
import SymptomLog from '../models/SymptomLog';
import { analyzeSymptoms } from '../services/geminiService';

const router = express.Router();

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

// Analyze symptoms using AI
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms description is required'
      });
    }

    const analysis = await analyzeSymptoms(symptoms.trim());

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
