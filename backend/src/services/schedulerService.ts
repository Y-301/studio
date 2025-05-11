
// backend/src/services/schedulerService.ts
import cron from 'node-cron';
import type { Routine } from '../models/routine';
import { getAllItems as getAllRoutinesFromDb } from '../utils/jsonDb';
import { log } from './logService';
import * as deviceService from './deviceService';
import * as routineService from './routineService'; // To update routine's lastRun
import type { Device } from '../models/device'; // Explicit import for Device type

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
        // For thermostats, targetState might be just the temperature. Status should reflect if it's active.
        const targetTemp = parseFloat(action.targetState);
        statusToSet = String(targetTemp); // Status is the temperature string
        settingsToSet = { temperature: targetTemp };
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
    // Use the dedicated routineService to update, ensuring consistency
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

    // Improved time parsing: "07:00 AM" -> "0 7 * * *"
    if (typeof timeDetails === 'string') {
        const timeMatch = timeDetails.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const period = timeMatch[3]?.toUpperCase();

            if (period === 'PM' && hour < 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0; // Midnight case

            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                cronExpression = `${minute} ${hour} * * *`;
            }
        } else if (/^\d{1,2}\s\d{1,2}\s\*\s\*\s\*$/.test(timeDetails)) { // Basic cron string support "M H * * *"
            cronExpression = timeDetails;
        }
    } else if (typeof timeDetails === 'object' && timeDetails.time) { 
        // Handle object format, e.g., { time: "07:00 AM", timezone: "America/New_York" }
        const timeMatch = timeDetails.time.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
        if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const period = timeMatch[3]?.toUpperCase();

            if (period === 'PM' && hour < 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

             if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                cronExpression = `${minute} ${hour} * * *`;
            }
        }
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
        // Fetch the latest version of the routine before executing
        // This ensures that any changes made to the routine since scheduling are applied
        const currentRoutine = await routineService.getRoutineByIdAndUserId(routine.id, routine.userId);
        if (currentRoutine && currentRoutine.isEnabled) {
            await executeRoutineActions(currentRoutine);
        } else if (currentRoutine && !currentRoutine.isEnabled) {
            log('info', `Routine "${routine.name}" (ID: ${routine.id}) was triggered but is disabled. Skipping execution.`, routine.userId, {routineId: routine.id, component: 'SchedulerService'});
            unscheduleRoutine(routine.id); // Unschedule if it became disabled
        } else {
            log('warn', `Routine "${routine.name}" (ID: ${routine.id}) not found or unauthorized during scheduled execution. Unscheduling.`, routine.userId, {routineId: routine.id, component: 'SchedulerService'});
            unscheduleRoutine(routine.id);
        }
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
  log('info', 'Initializing scheduler and loading routines...', undefined, { component: 'SchedulerService' });
  try {
    const routines = await getAllRoutinesFromDb<Routine>(ROUTINES_DB_FILE);
    let scheduledCount = 0;
    routines.forEach(routine => {
      if (routine.trigger.type === 'time' && routine.isEnabled) {
        scheduleRoutine(routine);
        scheduledCount++;
      }
    });
    log('info', `Scheduler initialized. ${scheduledCount} time-based routines processed for scheduling. Total active cron tasks: ${scheduledCronTasks.size}`, undefined, { component: 'SchedulerService' });
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

// Function to get status of scheduled cron tasks (for /status endpoint)
export const getScheduledTasksStatus = () => {
    const tasks: Array<{id: string, nextRun?: Date | string, status: string}> = [];
    scheduledCronTasks.forEach((task, id) => {
        try {
            // Note: `task.nextDate()` or similar method depends on `node-cron` version/API.
            // Assuming a hypothetical `nextDate()` method or similar property.
            // If node-cron doesn't expose next run directly, this part might be complex or unavailable.
            // For now, let's assume a placeholder.
            let nextRun: Date | string = "N/A (API might not support)";
            // If task object has a method like `nextDates(1)[0]` for cron >=3.0.0
            // Or if it's an older version, direct access might be different.
            // For example, in some versions, you might need to parse the cron string yourself.
            // This is a simplification.
            if (typeof (task as any).nextDates === 'function') { // Check if nextDates method exists
                const nextDateResult = (task as any).nextDates(1);
                if (nextDateResult && nextDateResult.length > 0) {
                    nextRun = new Date(nextDateResult[0].toJSDate()); // Assuming toJSDate() for Luxon DateTime from cron-schedule
                }
            }


            tasks.push({
                id,
                nextRun: nextRun instanceof Date ? nextRun.toISOString() : nextRun,
                status: 'Scheduled' // node-cron tasks are either running based on schedule or stopped.
            });
        } catch(e) {
             tasks.push({ id, nextRun: 'Error fetching next run', status: 'Error' });
        }
    });
    return {
        activeCronTasksCount: scheduledCronTasks.size,
        activeOneTimeTimeoutsCount: scheduledOneTimeTimeouts.size,
        tasks,
    };
};
