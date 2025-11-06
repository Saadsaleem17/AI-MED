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
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    console.log('Processing file:', req.file.originalname);
    
    // Perform OCR
    const result = await performOCR(req.file.path, req.file.mimetype);
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json({ 
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        isMedical: result.isMedical,
        reportType: result.reportType,
        parameters: result.parameters,
        foundKeywords: result.foundKeywords,
        originalFilename: req.file.originalname
      }
    });

  } catch (error) {
    console.error('OCR Error:', error);
    
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