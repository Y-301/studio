
// backend/src/routes/dataRoutes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import * as dataManagementService from '../services/dataManagementService';
import { authenticateToken } from '../middleware/authMiddleware';
import { log } from '../services/logService';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads'); // Temporary storage for CSVs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed!'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
});

// POST /api/data/upload-csv - Upload a CSV file to seed data (e.g., devices)
router.post('/upload-csv/devices', authenticateToken, upload.single('deviceCsv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file uploaded.' });
  }
  try {
    // For now, only device CSV processing is implemented as an example
    const result = await dataManagementService.processDeviceCsv(req.file.path);
    if (result.success) {
      await dataManagementService.updateAppStatus({ isSeededByCsv: true });
      res.status(200).json({ message: result.message, importedCount: result.deviceCount });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error: any) {
    log('error', 'CSV upload processing failed', (req as any).user?.userId , { error: error.message, path: req.file.path });
    res.status(500).json({ message: 'Error processing CSV file.', error: error.message });
  }
});

// GET /api/data/export-csv/devices - Export current devices as CSV
router.get('/export-csv/devices', authenticateToken, async (req, res) => {
  try {
    const csvData = await dataManagementService.exportDevicesToCsv();
    if (csvData) {
      res.header('Content-Type', 'text/csv');
      res.attachment('wakesync_devices_export.csv');
      res.send(csvData);
    } else {
      res.status(404).json({ message: 'No device data to export or failed to generate CSV.' });
    }
  } catch (error: any) {
    log('error', 'Failed to export devices CSV', (req as any).user?.userId, { error: error.message });
    res.status(500).json({ message: 'Failed to export devices CSV.', error: error.message });
  }
});

// GET /api/data/app-status - Get application status (seeded by CSV, users exist)
router.get('/app-status', async (req, res) => { // No auth needed for initial status check
  try {
    const status = await dataManagementService.getAppStatus();
    res.status(200).json(status);
  } catch (error: any) {
    log('error', 'Failed to get app status', undefined, { error: error.message });
    res.status(500).json({ message: 'Failed to retrieve app status.', error: error.message });
  }
});


export default router;
