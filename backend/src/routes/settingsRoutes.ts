
import express from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/settingsController';

const router = express.Router();

// GET /api/settings/:userId
router.get('/:userId', getUserSettings);

// PUT /api/settings/:userId
// Body: Partial<UserSettings>
router.put('/:userId', updateUserSettings);

export default router;
