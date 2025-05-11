// backend/src/controllers/routineController.ts
import type { Request, Response } from 'express';
import * as routineService from '../services/routineService';
import { log } from '../services/logService';
import type { Routine } from '../models/routine';

const MOCK_USER_ID = 'user1'; // TODO: Replace with actual user ID from auth middleware

export const getAllRoutines = async (req: Request, res: Response) => {
  const userId = MOCK_USER_ID;
  try {
    const routines = await routineService.getRoutinesByUserId(userId);
    res.status(200).json(routines);
  } catch (error) {
    log('error', `Error fetching routines for user ${userId}: ${(error as Error).message}`, userId, { component: 'RoutineController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get routines.' });
  }
};

export const getRoutineById = async (req: Request, res: Response) => {
  const { routineId } = req.params;
  const userId = MOCK_USER_ID;
  try {
    const routine = await routineService.getRoutineByIdAndUserId(routineId, userId);
    if (!routine) {
      return res.status(404).json({ message: 'Routine not found or not owned by user.' });
    }
    res.status(200).json(routine);
  } catch (error) {
    log('error', `Error fetching routine ${routineId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'RoutineController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get routine.' });
  }
};

export const createRoutine = async (req: Request, res: Response) => {
  const userId = MOCK_USER_ID;
  const routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = req.body;

  if (!routineData.name || !routineData.triggerType || !routineData.actions || routineData.actions.length === 0) {
    log('warn', 'Missing required fields for new routine.', userId, { component: 'RoutineController', body: req.body });
    return res.status(400).json({ message: 'Routine name, trigger type, and at least one action are required.' });
  }

  try {
    const newRoutine = await routineService.addRoutine(userId, routineData);
    res.status(201).json(newRoutine);
  } catch (error) {
    log('error', `Error creating routine for user ${userId}: ${(error as Error).message}`, userId, { component: 'RoutineController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to create routine.' });
  }
};

export const updateRoutine = async (req: Request, res: Response) => {
  const { routineId } = req.params;
  const userId = MOCK_USER_ID;
  const updateData: Partial<Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = req.body;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'No update data provided.' });
  }

  try {
    const updatedRoutine = await routineService.updateRoutine(routineId, userId, updateData);
    if (!updatedRoutine) {
      return res.status(404).json({ message: 'Routine not found or not owned by user.' });
    }
    res.status(200).json(updatedRoutine);
  } catch (error) {
    log('error', `Error updating routine ${routineId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'RoutineController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to update routine.' });
  }
};

export const deleteRoutine = async (req: Request, res: Response) => {
  const { routineId } = req.params;
  const userId = MOCK_USER_ID;
  try {
    const success = await routineService.deleteRoutineByIdAndUserId(routineId, userId);
    if (!success) {
      return res.status(404).json({ message: 'Routine not found or not owned by user.' });
    }
    res.status(204).send();
  } catch (error) {
    log('error', `Error deleting routine ${routineId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'RoutineController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to delete routine.' });
  }
};

export const triggerRoutine = async (req: Request, res: Response) => {
  const { routineId } = req.params;
  const userId = MOCK_USER_ID;
  try {
    const success = await routineService.triggerRoutineManually(routineId, userId);
    if (!success) {
      return res.status(404).json({ message: 'Routine not found, not owned by user, or failed to trigger.' });
    }
    res.status(200).json({ message: `Routine ${routineId} triggered successfully.` });
  } catch (error) {
    log('error', `Error triggering routine ${routineId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'RoutineController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to trigger routine.' });
  }
};
