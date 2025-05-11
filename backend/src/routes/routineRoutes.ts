// backend/src/routes/routineRoutes.ts
import express from 'express';
import * as routineController from '../controllers/routineController';

const router = express.Router();

// GET /api/routines - Get all routines for the authenticated user
router.get('/', routineController.getAllRoutines);

// POST /api/routines - Create a new routine
router.post('/', routineController.createRoutine);

// GET /api/routines/:routineId - Get a specific routine by ID
router.get('/:routineId', routineController.getRoutineById);

// PUT /api/routines/:routineId - Update an existing routine
router.put('/:routineId', routineController.updateRoutine);

// DELETE /api/routines/:routineId - Delete a routine
router.delete('/:routineId', routineController.deleteRoutine);

// POST /api/routines/:routineId/trigger - Manually trigger a routine
router.post('/:routineId/trigger', routineController.triggerRoutine);

export default router;
