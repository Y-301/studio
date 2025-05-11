
import express from 'express';
import wakeUpRoutes from './wakeUpRoutes';
import settingsRoutes from './settingsRoutes';
import deviceRoutes from './deviceRoutes'; 
import * as dashboardController from '../controllers/dashboardController'; 
import routineRoutes from './routineRoutes'; 
import simulationRoutes from './simulationRoutes'; // Import simulation routes
// import wristbandRoutes from './wristbandRoutes'; // TODO: Add wristband routes
// import analyticsRoutes from './analyticsRoutes'; // TODO: Add analytics routes
// import logRoutes from './logRoutes'; // TODO: Add log routes

const router = express.Router();

// Dashboard specific routes
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

router.use('/wake-up', wakeUpRoutes);
router.use('/settings', settingsRoutes);
router.use('/devices', deviceRoutes); 
router.use('/routines', routineRoutes); 
router.use('/simulation', simulationRoutes); // Mount simulation routes
// router.use('/wristband', wristbandRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/logs', logRoutes);


// Default API health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Backend API is healthy and running!' });
});

export default router;
