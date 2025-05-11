// backend/src/services/simulationService.ts
import {
  readDbFile,
  writeDbFile
} from '../utils/jsonDb';
import { log } from './logService';

const FLOORPLAN_DB_FILE = 'floorplan.json'; // Assuming one floor plan per system for now, or per user if extended.
const MOCK_USER_ID = 'user1'; // Or manage per user.

interface APIPlacedDevice {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface APIFloorPlanRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  devices: string[];
}

export interface FloorPlanData {
  userId: string; // To associate floor plan with a user
  selectedFloor: string;
  rooms: APIFloorPlanRoom[];
  placedDevices: APIPlacedDevice[];
  // Could add floor-specific array: floors: { [floorName: string]: { rooms: ..., placedDevices: ... }}
}

const DEFAULT_DEVICE_ICON_SIZE_PERCENT = 7;

// Default floor plan if none exists for the user
const getDefaultFloorPlanData = (userId: string): FloorPlanData => ({
  userId: userId,
  selectedFloor: "Ground Floor",
  rooms: [
    { id: "fp-lr-default", name: "Living Room (Default)", x: 10, y: 10, width: 35, height: 30, devices: ["sim-light-1"]},
    { id: "fp-k-default", name: "Kitchen (Default)", x: 50, y: 10, width: 25, height: 25, devices: []},
  ],
  placedDevices: [
    {id: "sim-light-1", x: 15, y: 15, width: DEFAULT_DEVICE_ICON_SIZE_PERCENT, height: DEFAULT_DEVICE_ICON_SIZE_PERCENT},
  ],
});


export const getFloorPlan = async (userId: string): Promise<FloorPlanData> => {
  try {
    const allFloorPlans = await readDbFile<{ [key: string]: FloorPlanData }>(FLOORPLAN_DB_FILE);
    // For simplicity, this demo uses one floorplan file that might store multiple user plans.
    // A better approach for multi-user would be user-specific files or a proper DB.
    const userFloorPlan = allFloorPlans[userId]; 
    if (userFloorPlan) {
      log('info', `Fetched floor plan for user ${userId}`, userId, { component: 'SimulationService' });
      return userFloorPlan;
    }
    log('info', `No floor plan found for user ${userId}, returning default.`, userId, { component: 'SimulationService' });
    return getDefaultFloorPlanData(userId);
  } catch (error) {
    log('error', `Error fetching floor plan for user ${userId}: ${(error as Error).message}`, userId, { component: 'SimulationService' });
    // Return default on error to ensure frontend gets some data
    return getDefaultFloorPlanData(userId);
  }
};

export const saveFloorPlan = async (userId: string, floorPlanData: Omit<FloorPlanData, 'userId'>): Promise<FloorPlanData> => {
  try {
    const allFloorPlans = await readDbFile<{ [key: string]: FloorPlanData }>(FLOORPLAN_DB_FILE);
    const dataToSave: FloorPlanData = { ...floorPlanData, userId };
    allFloorPlans[userId] = dataToSave; // Store by userId
    
    await writeDbFile(FLOORPLAN_DB_FILE, allFloorPlans);
    log('info', `Saved floor plan for user ${userId}`, userId, { component: 'SimulationService' });
    return dataToSave;
  } catch (error) {
    log('error', `Error saving floor plan for user ${userId}: ${(error as Error).message}`, userId, { component: 'SimulationService' });
    throw error; // Re-throw to be handled by controller
  }
};


// Placeholder functions from old service, adapt or remove as needed
// For actual wake-up simulation logic, that's in wakeUpController and its associated schedulerService
// This simulationService is more about the house layout data.

export interface SimulationParameters {
  startTime: Date;
  durationMinutes: number;
  intensity: 'low' | 'medium' | 'high';
  lightSettings?: { brightness: number };
  thermostatSettings?: { temperature: number };
}

export const getSimulationHistory = async (userId: string, limit: number = 10): Promise<SimulationParameters[]> => {
  log('info', `Fetching simulation history for user: ${userId} (limit: ${limit}) - Mock Data`, userId, { component: 'SimulationService' });
  // This should fetch from a 'simulation_history.json' or similar if implemented
  const placeholderData: SimulationParameters[] = [
    { startTime: new Date(Date.now() - 86400000), durationMinutes: 30, intensity: 'medium', lightSettings: { brightness: 70 } },
    { startTime: new Date(Date.now() - 172800000), durationMinutes: 25, intensity: 'low' },
  ];
  return placeholderData.slice(0, limit);
};
