// backend/src/controllers/simulationController.ts
import type { Request, Response } from 'express';
import * as simulationService from '../services/simulationService';
import { log } from '../services/logService';

const DEFAULT_MOCK_USER_ID_IF_NO_AUTH = 'user1';

export const getFloorPlanData = async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  try {
    const floorPlan = await simulationService.getFloorPlan(userId);
    res.status(200).json(floorPlan);
  } catch (error) {
    log('error', `Error getting floor plan for user ${userId}: ${(error as Error).message}`, userId, { component: 'SimulationController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get floor plan data.' });
  }
};

export const saveFloorPlanData = async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  const floorPlanData: Omit<simulationService.FloorPlanData, 'userId'> = req.body;

  if (!floorPlanData || !Array.isArray(floorPlanData.rooms) || !Array.isArray(floorPlanData.placedDevices) || typeof floorPlanData.selectedFloor !== 'string') {
    log('warn', `Invalid floor plan data provided for user ${userId}`, userId, { component: 'SimulationController', body: req.body });
    return res.status(400).json({ message: "Invalid floor plan data provided" });
  }

  try {
    const savedPlan = await simulationService.saveFloorPlan(userId, floorPlanData);
    res.status(200).json({ message: "Floor plan saved successfully", data: savedPlan });
  } catch (error) {
    log('error', `Error saving floor plan for user ${userId}: ${(error as Error).message}`, userId, { component: 'SimulationController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to save floor plan data.' });
  }
};

export const getSimHistory = async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  const limit = parseInt(req.query.limit as string || '10', 10);
  try {
    const history = await simulationService.getSimulationHistory(userId, limit);
    res.status(200).json({ history });
  } catch (error) {
    log('error', `Error fetching simulation history for user ${userId}: ${(error as Error).message}`, userId, { component: 'SimulationController' });
    res.status(500).json({ message: 'Failed to fetch simulation history.' });
  }
};
