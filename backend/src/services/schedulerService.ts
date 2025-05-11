// backend/src/services/schedulerService.ts
import cron from 'node-cron';
import type { Routine } from '../models/routine';
import { getAllItems as getAllRoutinesFromDb } from '../utils/jsonDb';
import { log } from './logService';
import * as deviceService from './deviceService';
import * as routineService from './routineService'; // To update routine's lastRun

const ROUTINES_DB_FILE = 'routines.json';

const scheduledCronTasks: Map<string, cron.ScheduledTask> = new Map();
const scheduledOneTimeTimeouts: Map<string, NodeJS.Timeout> = new Map();


const executeRoutineActions = async (routine: Routine) => {
  await log('info', `Executing routine: "${routine.name}" (ID: ${routine.id}) for user ${routine.userId}`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });

  for (const action of routine.actions) {
    try {
      // Fetch full device details for more context if needed (e.g. current settings to merge)
      const deviceToControl = await deviceService.getDeviceByIdAndUserId(action.deviceId, routine.userId);
      if(!deviceToControl){
        log('warn', `Device ${action.deviceId} not found for action in routine ${routine.id}`, routine.userId, {component: 'SchedulerService', routineId: routine.id});
        continue;
      }

      let statusToSet: Device['status'] | undefined = undefined;
      let settingsToSet: Partial<Device['settings']> | undefined = undefined;
      
      // Interpret action.targetState and action.actionData
      // This logic should be robust. For simplicity, we assume targetState might be "on", "off", temp, or include settings.
      // A more structured 'action.command' and 'action.payload' would be better.
      
      if (action.targetState.toLowerCase() === 'on' || action.targetState.toLowerCase() === 'off') {
        statusToSet = action.targetState.toLowerCase() as 'on' | 'off';
      } else if (deviceToControl.type === 'thermostat' && !isNaN(parseFloat(action.targetState))) {
        statusToSet = parseFloat(action.targetState) > 0 ? String(parseFloat(action.targetState)) : 'off'; 
        settingsToSet = { temperature: parseFloat(action.targetState) };
      } else if (deviceToControl.type === 'light' && action.targetState.toLowerCase().includes('brightness')) {
        const brightnessMatch = action.targetState.match(/brightness[\s:]*(\d+)/i);
        if (brightnessMatch && brightnessMatch[1]) {
            statusToSet = 'on'; // Lights usually turn on if brightness is set
            settingsToSet = { brightness: parseInt(brightnessMatch[1], 10) };
        } else {
             statusToSet = action.targetState; // Fallback to direct status if parsing fails
        }
      } else if (deviceToControl.type === 'speaker' && action.targetState.toLowerCase().includes('volume')) {
        const volumeMatch = action.targetState.match(/volume[\s:]*(\d+)/i);
        if (volumeMatch && volumeMatch[1]) {
            statusToSet = 'on'; // Speakers usually turn on if volume is set
            settingsToSet = { volume: parseInt(volumeMatch[1], 10) };
        } else {
            statusToSet = action.targetState;
        }
      } else {
        // Default: treat targetState as the direct status string
        statusToSet = action.targetState;
      }

      // If actionData exists, merge it into settingsToSet
      if (action.actionData) {
        settingsToSet = { ...settingsToSet, ...action.actionData };
      }

      if (statusToSet !== undefined || settingsToSet !== undefined) {
        // Use current device status if statusToSet is undefined but settings are being applied
        const finalStatus = statusToSet !== undefined ? statusToSet : deviceToControl.status;
        
        await deviceService.updateDeviceStatus(action.deviceId, routine.userId, finalStatus, settingsToSet);
        log('info', `Routine Action Executed: Device ${deviceToControl.name} (${action.deviceId}) to status='${finalStatus}', settings=${JSON.stringify(settingsToSet)}. Routine: ${routine.name}`, routine.userId, { component: 'SchedulerService', routineId: routine.id });
      } else {
         log('warn', `Could not determine action for device ${action.deviceId} in routine ${routine.name}. TargetState: "${action.targetState}"`, routine.userId, {component: 'SchedulerService', routineId: routine.id});
      }

    } catch (err) {
      log('error', `Error executing action for device ${action.deviceId} in routine ${routine.id}: ${(err as Error).message}`, routine.userId, { component: 'SchedulerService', stack: (err as Error).stack, routineId: routine.id });
    }
  }
  // Update routine's lastRun timestamp
  try {
    await routineService.updateRoutine(routine.id, routine.userId, { lastRun: new Date().toISOString() });
    log('info', `Routine "${routine.name}" execution finished and lastRun updated.`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
  } catch(err) {
    log('error', `Error updating lastRun for routine ${routine.id}: ${(err as Error).message}`, routine.userId, { component: 'SchedulerService', stack: (err as Error).stack });
  }
};


export const scheduleRoutine = (routine: Routine) => {
  if (routine.trigger.type === 'time' && routine.isEnabled) {
    const timeDetails = routine.trigger.details as any; // Assuming details = "HH:MM" or { time: "HH:MM", timezone?: string }
    
    let cronExpression: string | undefined;
    let timezone: string | undefined;

    if (typeof timeDetails === 'string' && /^\d{2}:\d{2}$/.test(timeDetails)) { // Simple "HH:MM" string
        const [hour, minute] = timeDetails.split(':');
        cronExpression = `${minute} ${hour} * * *`;
    } else if (typeof timeDetails === 'object' && timeDetails.time && /^\d{2}:\d{2}$/.test(timeDetails.time)) { // Object with time and optional timezone
        const [hour, minute] = timeDetails.time.split(':');
        cronExpression = `${minute} ${hour} * * *`;
        timezone = timeDetails.timezone;
    }


    if (!cronExpression || !cron.validate(cronExpression)) {
      log('error', `Invalid cron expression or time details for routine "${routine.name}": ${JSON.stringify(timeDetails)}`, routine.userId, { component: 'SchedulerService', routineId: routine.id });
      return;
    }

    if (scheduledCronTasks.has(routine.id)) {
      scheduledCronTasks.get(routine.id)?.stop();
      scheduledCronTasks.delete(routine.id);
      log('info', `Unscheduled existing task for routine: "${routine.name}" before rescheduling.`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
    }
    
    log('info', `Scheduling routine "${routine.name}" (ID: ${routine.id}) with cron: ${cronExpression}`, routine.userId, { component: 'SchedulerService', timezone: timezone || 'System Default', routineId: routine.id });
    
    const task = cron.schedule(cronExpression, async () => {
      log('info', `Triggering routine "${routine.name}" (ID: ${routine.id}) at ${new Date().toLocaleTimeString()}`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
      try {
        await executeRoutineActions(routine);
      } catch (err) {
        log('error', `Unhandled error during scheduled execution of routine ${routine.id}: ${(err as Error).message}`, routine.userId, {component: 'SchedulerService', stack: (err as Error).stack, routineId: routine.id });
      }
    }, {
      scheduled: true,
      timezone: timezone 
    });
    scheduledCronTasks.set(routine.id, task);
  } else if (routine.trigger.type === 'time' && !routine.isEnabled) {
    unscheduleRoutine(routine.id); // Ensure disabled time-based routines are unscheduled
  }
};


export const unscheduleRoutine = (routineId: string) => {
  if (scheduledCronTasks.has(routineId)) {
    scheduledCronTasks.get(routineId)?.stop();
    scheduledCronTasks.delete(routineId);
    log('info', `Unscheduled routine with ID: ${routineId}`, undefined, { component: 'SchedulerService', routineId });
  }
};


export const initializeScheduler = async () => {
  log('info', 'Initializing scheduler...', undefined, { component: 'SchedulerService' });
  try {
    const routines = await getAllRoutinesFromDb<Routine>(ROUTINES_DB_FILE);
    let scheduledCount = 0;
    routines.forEach(routine => {
      if (routine.trigger.type === 'time' && routine.isEnabled) {
        scheduleRoutine(routine);
        scheduledCount++;
      }
    });
    log('info', `Scheduler initialized. ${scheduledCount} time-based routines processed for scheduling. Total cron tasks: ${scheduledCronTasks.size}`, undefined, { component: 'SchedulerService' });
  } catch (error) {
    log('error', `Error initializing scheduler: ${(error as Error).message}`, undefined, { component: 'SchedulerService', stack: (error as Error).stack });
  }
};


export const scheduleOneTimeAction = (delayMs: number, action: () => void | Promise<void>): string => {
  const actionId = `one-time-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  log('info', `Scheduling one-time action ID ${actionId} in ${delayMs / 1000} seconds.`, undefined, { delayMs, component: 'SchedulerService', actionId });

  const timeoutId = setTimeout(async () => {
    log('info', `Executing one-time scheduled action ID ${actionId}.`, undefined, { component: 'SchedulerService', actionId });
    try {
        await action();
    } catch (e) {
        log('error', `Error executing one-time action ID ${actionId}: ${(e as Error).message}`, undefined, { component: 'SchedulerService', stack: (e as Error).stack, actionId });
    }
    scheduledOneTimeTimeouts.delete(actionId); 
  }, delayMs);

  scheduledOneTimeTimeouts.set(actionId, timeoutId);
  return actionId;
};


export const cancelOneTimeAction = (actionId: string): boolean => {
    if (scheduledOneTimeTimeouts.has(actionId)) {
        clearTimeout(scheduledOneTimeTimeouts.get(actionId)!);
        scheduledOneTimeTimeouts.delete(actionId);
        log('info', `Cancelled one-time action ID ${actionId}.`, undefined, { component: 'SchedulerService', actionId });
        return true;
    }
    log('warn', `Could not find one-time action ID ${actionId} to cancel. It might have already executed or never existed.`, undefined, { component: 'SchedulerService', actionId });
    return false;
};

// Function to clear all scheduled cron tasks, e.g., on server shutdown (if needed)
export const clearAllScheduledCronTasks = () => {
    log('info', 'Clearing all scheduled cron tasks.', undefined, { component: 'SchedulerService' });
    scheduledCronTasks.forEach(task => task.stop());
    scheduledCronTasks.clear();
};

// Function to clear all one-time timeouts (less common to need this globally unless for a full reset)
export const clearAllOneTimeTimeouts = () => {
    log('info', 'Clearing all one-time timeouts.', undefined, { component: 'SchedulerService' });
    scheduledOneTimeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    scheduledOneTimeTimeouts.clear();
};