
import express from 'express';
import wakeUpRoutes from './wakeUpRoutes';
import settingsRoutes from './settingsRoutes';
// Import other route modules here
// import deviceRoutes from './deviceRoutes';
// import routineRoutes from './routineRoutes';

const router = express.Router();

router.use('/wake-up', wakeUpRoutes);
router.use('/settings', settingsRoutes);
// router.use('/devices', deviceRoutes);
// router.use('/routines', routineRoutes);

// Default API health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Backend API is healthy and running!' });
});

export default router;
