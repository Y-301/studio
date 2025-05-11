
import express from 'express';
import { simulateWakeUp } from '../controllers/wakeUpController';

const router = express.Router();

// POST /api/wake-up
// Body: { userId: string, time: string (ISO), duration: number, intensity: 'low'|'medium'|'high' }
router.post('/', simulateWakeUp);

export default router;
