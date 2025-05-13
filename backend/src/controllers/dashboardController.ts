// backend/src/controllers/dashboardController.ts
import type { Request, Response } from 'express';
import * * as deviceService from '../services/deviceService';
import * as routineService from '../services/routineService'; 
import { log } from '../services/logService';

const DEFAULT_MOCK_USER_ID_IF_NO_AUTH = 'user1'; 

export const getDashboardSummary = async (req: Request, res: Response) => {
  // In a real app, userId would come from authenticated session/token.
  // For this backend, 'X-User-ID' header is used, falling back to default if not present.
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH; 
  
  try {
    const devices = await deviceService.getDevicesByUserId(userId);
    const routines = await routineService.getRoutinesByUserId(userId);

    const summary = {
      activeDevices: devices.filter(d => d.status.toLowerCase() === 'on' || (d.type === 'thermostat' && parseInt(d.status) > 0)).length,
      totalDevices: devices.length,
      activeRoutines: routines.filter(r => r.isEnabled).length,
      totalRoutines: routines.length,
      nextWakeUpTime: "Tomorrow, 06:45 AM (Simulated)", // Placeholder, could be derived from routines
      lastRoutineRun: routines.length > 0 && routines[0].lastRun ? `${routines[0].name}, ${new Date(routines[0].lastRun).toLocaleString()}` : "N/A",
    };
    
    log('info', `Fetched dashboard summary for user ${userId}`, userId, { component: 'DashboardController' });
    res.status(200).json(summary);
  } catch (error) {
    log('error', `Error fetching dashboard summary for user ${userId}: ${(error as Error).message}`, userId, { component: 'DashboardController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get dashboard summary.' });
  }
};
