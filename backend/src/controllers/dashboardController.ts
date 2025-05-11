// backend/src/controllers/dashboardController.ts
import type { Request, Response } from 'express';
import * as deviceService from '../services/deviceService';
import * as routineService from '../services/routineService'; // Assuming routineService will be created/updated
import { log } from '../services/logService';

const MOCK_USER_ID = 'user1'; // TODO: Replace with actual user ID from auth middleware

export const getDashboardSummary = async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || MOCK_USER_ID; 
  try {
    const devices = await deviceService.getDevicesByUserId(userId);
    // const routines = await routineService.getRoutinesByUserId(userId); // Assuming this function exists

    // Mock routine data if service not ready
    const routines = [
        { id: "1", name: "Morning Energizer", active: true, lastRun: "Today, 07:00 AM"},
        { id: "2", name: "Evening Wind-Down", active: true, lastRun: "Yesterday, 10:00 PM"},
    ];


    const summary = {
      activeDevices: devices.filter(d => d.status === 'on' || (d.type === 'thermostat' && parseInt(d.status) > 0)).length, // Example logic for active
      totalDevices: devices.length,
      activeRoutines: routines.filter(r => r.active).length,
      totalRoutines: routines.length,
      nextWakeUpTime: "Tomorrow, 06:45 AM (Simulated)", // Placeholder
      lastRoutineRun: routines.length > 0 ? `${routines[0].name}, ${routines[0].lastRun}` : "N/A", // Placeholder
    };
    
    log('info', `Fetched dashboard summary for user ${userId}`, userId, { component: 'DashboardController' });
    res.status(200).json(summary);
  } catch (error) {
    log('error', `Error fetching dashboard summary for user ${userId}: ${(error as Error).message}`, userId, { component: 'DashboardController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get dashboard summary.' });
  }
};
