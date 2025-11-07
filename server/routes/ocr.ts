import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const performOCR = require('../services/ocrService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// OCR endpoint
router.post('/ocr', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('OCR endpoint hit');
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log('Processing file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Perform OCR
    console.log('Calling performOCR...');
    const result = await performOCR(req.file.path, req.file.mimetype);
    console.log('OCR result received:', result?.status || 'unknown');
    
    // Validate result
    if (!result) {
      throw new Error('OCR service returned no result');
    }
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json({ 
      success: true,
      data: {
        text: result.text || result.rawText || '',
        confidence: result.ocrConfidence || result.confidence || 0,
        isMedical: result.isMedical || false,
        reportType: result.reportType || null,
        parameters: result.parameters || [],
        foundKeywords: result.foundKeywords || [],
        aiAnalysis: result.aiAnalysis || null, // Include AI analysis
        originalFilename: req.file.originalname
      }
    });

  } catch (error) {
    console.error('OCR Error Details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      error: error
    });
    
    // Clean up file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'OCR processing failed', 
      details: (error as Error).message 
    });
  }
});

// Health check for OCR service
router.get('/ocr/health', (req: Request, res: Response) => {
  res.json({ 
    success: true,
    message: 'OCR service is running',
    supportedFormats: ['JPEG', 'PNG', 'PDF'],
    maxFileSize: '10MB'
  });
});

export default router;