// backend/src/services/routineService.ts
import type { Routine } from '../models/routine';
import {
  getAllItems,
  getItemById,
  upsertItem,
  deleteItemById,
  readDbFile,
  writeDbFile
} from '../utils/jsonDb';
import { log } from './logService';
import * as deviceService from './deviceService'; // To control devices
import { scheduleRoutine, unscheduleRoutine } from './schedulerService';

const ROUTINES_DB_FILE = 'routines.json';
const MOCK_USER_ID = 'user1';

export const getRoutinesByUserId = async (userId: string): Promise<Routine[]> => {
  log('info', `Fetching routines for user: ${userId}`, userId, { component: 'RoutineService' });
  const allRoutines = await getAllItems<Routine>(ROUTINES_DB_FILE);
  return allRoutines.filter(routine => routine.userId === userId);
};

export const getRoutineByIdAndUserId = async (routineId: string, userId: string): Promise<Routine | null> => {
  log('info', `Fetching routine ID: ${routineId} for user: ${userId}`, userId, { component: 'RoutineService' });
  const routine = await getItemById<Routine>(ROUTINES_DB_FILE, routineId);
  if (routine && routine.userId === userId) {
    return routine;
  }
  return null;
};

export const addRoutine = async (userId: string, routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Routine> => {
  const newId = `routine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newRoutine: Routine = {
    id: newId,
    userId,
    ...routineData,
    createdAt: now,
    updatedAt: now,
  };
  await upsertItem<Routine>(ROUTINES_DB_FILE, newId, newRoutine);
  log('info', `Added new routine ID: ${newId} for user: ${userId}`, userId, { component: 'RoutineService', routineName: newRoutine.name });
  if (newRoutine.isEnabled && newRoutine.trigger.type === 'time') {
    scheduleRoutine(newRoutine);
  }
  return newRoutine;
};

export const updateRoutine = async (routineId: string, userId: string, updateData: Partial<Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Routine | null> => {
  const existingRoutine = await getItemById<Routine>(ROUTINES_DB_FILE, routineId);
  if (!existingRoutine || existingRoutine.userId !== userId) {
    log('warn', `Update failed for routine ID: ${routineId}. Not found or user ${userId} unauthorized.`, userId, { component: 'RoutineService' });
    return null;
  }
  const updatedRoutine: Routine = {
    ...existingRoutine,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  await upsertItem<Routine>(ROUTINES_DB_FILE, routineId, updatedRoutine);
  log('info', `Updated routine ID: ${routineId} for user: ${userId}`, userId, { component: 'RoutineService', updates: Object.keys(updateData) });
  
  // Reschedule if trigger or enabled status changed
  if (existingRoutine.trigger.type === 'time') {
      unscheduleRoutine(routineId); // Always unschedule first
  }
  if (updatedRoutine.isEnabled && updatedRoutine.trigger.type === 'time') {
      scheduleRoutine(updatedRoutine);
  }
  return updatedRoutine;
};

export const deleteRoutineByIdAndUserId = async (routineId: string, userId: string): Promise<boolean> => {
  const existingRoutine = await getItemById<Routine>(ROUTINES_DB_FILE, routineId);
  if (!existingRoutine || existingRoutine.userId !== userId) {
    log('warn', `Delete failed for routine ID: ${routineId}. Not found or user ${userId} unauthorized.`, userId, { component: 'RoutineService' });
    return false;
  }
  const deleted = await deleteItemById(ROUTINES_DB_FILE, routineId);
  if (deleted) {
    log('info', `Deleted routine ID: ${routineId} for user: ${userId}`, userId, { component: 'RoutineService' });
    unscheduleRoutine(routineId);
  }
  return deleted;
};

export const triggerRoutineManually = async (routineId: string, userId: string): Promise<boolean> => {
  const routine = await getRoutineByIdAndUserId(routineId, userId);
  if (!routine) {
    log('warn', `Manual trigger failed for routine ID: ${routineId}. Not found or user ${userId} unauthorized.`, userId, { component: 'RoutineService' });
    return false;
  }

  log('info', `Manually triggering routine: "${routine.name}" for user ${userId}`, userId, { routineId, component: 'RoutineService' });
  for (const action of routine.actions) {
    try {
      // This is a simplified control action.
      // In a real app, actionType might be 'setBrightness', 'setTemperature', etc.
      // And actionData would contain { brightness: 50 } or { temperature: 22 }
      // For now, we map targetState to a basic status or setting.
      
      const deviceToControl = await deviceService.getDeviceByIdAndUserId(action.deviceId, userId);
      if(!deviceToControl){
        log('warn', `Device ${action.deviceId} not found for action in routine ${routine.id}`, userId, {component: 'RoutineService'});
        continue;
      }

      let statusToSet: Device['status'] | undefined = undefined;
      let settingsToSet: Partial<Device['settings']> | undefined = undefined;

      // Basic interpretation of targetState
      if(action.targetState.toLowerCase() === 'on' || action.targetState.toLowerCase() === 'off'){
        statusToSet = action.targetState.toLowerCase() as 'on' | 'off';
      } else if (deviceToControl.type === 'thermostat' && !isNaN(parseFloat(action.targetState))) {
        statusToSet = 'on'; // Assuming thermostat turns on if temp is set
        settingsToSet = { temperature: parseFloat(action.targetState) };
      } else if (deviceToControl.type === 'light' && action.targetState.toLowerCase().includes('brightness')) {
        const brightnessMatch = action.targetState.match(/brightness[\s:]*(\d+)/i);
        if (brightnessMatch && brightnessMatch[1]) {
            statusToSet = 'on';
            settingsToSet = { brightness: parseInt(brightnessMatch[1]) };
        } else {
            statusToSet = 'on'; // Default to just 'on' if brightness not parsed
        }
      } else if (deviceToControl.type === 'speaker' && action.targetState.toLowerCase().includes('volume')) {
         const volumeMatch = action.targetState.match(/volume[\s:]*(\d+)/i);
        if (volumeMatch && volumeMatch[1]) {
            statusToSet = 'on';
            settingsToSet = { volume: parseInt(volumeMatch[1]) };
        } else {
            statusToSet = 'on';
        }
      } else {
        // Default to setting status directly if no complex parsing
        statusToSet = action.targetState;
      }
      
      if(statusToSet !== undefined || settingsToSet !== undefined) {
        await deviceService.updateDeviceStatus(action.deviceId, userId, statusToSet || deviceToControl.status, settingsToSet);
        log('info', `Routine Action: Device ${action.deviceId} updated. Target: ${action.targetState}`, userId, { component: 'RoutineService' });
      } else {
         log('warn', `Could not interpret targetState "${action.targetState}" for device ${action.deviceId}`, userId, {component: 'RoutineService'});
      }

    } catch (err) {
      log('error', `Error executing action for device ${action.deviceId} in routine ${routine.id}: ${(err as Error).message}`, userId, { component: 'RoutineService' });
    }
  }
  // Optionally, update routine's lastRun timestamp
  await updateRoutine(routineId, userId, { lastRun: new Date().toISOString() });
  return true;
};
