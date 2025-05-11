// backend/src/routes/simulationRoutes.ts
import express from 'express';
import * as simulationController from '../controllers/simulationController';

const router = express.Router();

// GET /api/simulation/floorplan - Get floor plan data for the user
router.get('/floorplan', simulationController.getFloorPlanData);

// POST /api/simulation/floorplan - Save floor plan data for the user
router.post('/floorplan', simulationController.saveFloorPlanData);

// GET /api/simulation/history - Get simulation history (example)
router.get('/history', simulationController.getSimHistory);


export default router;
