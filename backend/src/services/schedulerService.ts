
import cron from 'node-cron';
import { Routine } from '../models/routine'; // Assuming Routine model exists
import { getAllItems, getItemById as getDeviceDetailsFromDb } from '../utils/jsonDb'; // Assuming routines are stored in routines.json
import { log } from './logService';
import type { Device } from '../models/device'; // For fetching device details

const ROUTINES_DB_FILE = 'routines.json';
const DEVICES_DB_FILE = 'devices.json'; // Assuming devices are stored here for more details

// In-memory store for scheduled tasks (cron jobs)
const scheduledCronTasks: Map<string, cron.ScheduledTask> = new Map();
const scheduledOneTimeTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * Simulates executing a routine's actions.
 * In a real app, this would interact with device services.
 */
const executeRoutineActions = async (routine: Routine) => {
  console.log(`[Scheduler] Executing routine: "${routine.name}" (ID: ${routine.id}) for user ${routine.userId}`);
  await log('info', `Executing routine: "${routine.name}"`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });

  for (const action of routine.actions) {
    let deviceName = action.deviceId; // Default to ID if not found
    try {
      // Optionally fetch device details for richer logging
      const device = await getDeviceDetailsFromDb<Device>(DEVICES_DB_FILE, action.deviceId);
      if (device) {
        deviceName = `${device.name} (Type: ${device.type}, Room: ${device.room || 'N/A'})`;
      }
    } catch (e) {
      console.warn(`[Scheduler] Could not fetch details for device ${action.deviceId}`);
    }

    const logMessage = `Simulating action for Device ID ${action.deviceId} (${deviceName}): Type: ${action.actionType}, Data: ${JSON.stringify(action.actionData)}`;
    console.log(`  - ${logMessage}`);
    await log('info', logMessage, routine.userId, { routineId: routine.id, deviceId: action.deviceId, actionType: action.actionType, actionData: action.actionData, component: 'SchedulerService' });
    // TODO: Implement actual device control logic here
    // e.g., deviceService.controlDevice(action.deviceId, action.actionType, action.actionData, routine.userId);
  }
  console.log(`[Scheduler] Routine "${routine.name}" execution finished.`);
  await log('info', `Routine "${routine.name}" execution finished.`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
};

/**
 * Schedules a routine if it has a time-based trigger.
 * @param routine The routine to schedule.
 */
export const scheduleRoutine = (routine: Routine) => {
  if (routine.trigger.type === 'time' && routine.isEnabled) {
    const timeDetails = routine.trigger.details as { time: string, timezone?: string }; // e.g., "07:30"
    if (timeDetails && timeDetails.time) {
      const [hour, minute] = timeDetails.time.split(':');
      
      // Cron format: minute hour * * *
      const cronExpression = `${minute} ${hour} * * *`;

      // Validate cron expression (basic)
      if (!cron.validate(cronExpression)) {
        console.error(`[Scheduler] Invalid cron expression for routine "${routine.name}": ${cronExpression}`);
        log('error', `Invalid cron expression for routine "${routine.name}": ${cronExpression}`, routine.userId, { component: 'SchedulerService' });
        return;
      }

      // If a task for this routine already exists, stop and remove it first
      if (scheduledCronTasks.has(routine.id)) {
        scheduledCronTasks.get(routine.id)?.stop();
        scheduledCronTasks.delete(routine.id);
        console.log(`[Scheduler] Unscheduling existing task for routine: "${routine.name}"`);
        log('info', `Unscheduled existing task for routine: "${routine.name}"`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
      }
      
      console.log(`[Scheduler] Scheduling routine "${routine.name}" (ID: ${routine.id}) with cron: ${cronExpression}`);
      log('info', `Scheduling routine "${routine.name}" (ID: ${routine.id}) with cron: ${cronExpression}`, routine.userId, { component: 'SchedulerService', timezone: timeDetails.timezone || 'System Default' });
      
      const task = cron.schedule(cronExpression, async () => {
        console.log(`[Scheduler] Triggering routine "${routine.name}" at ${new Date().toLocaleTimeString()}`);
        await log('info', `Triggering routine "${routine.name}"`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
        await executeRoutineActions(routine);
      }, {
        scheduled: true,
        timezone: timeDetails.timezone // Use user's timezone if provided
      });
      scheduledCronTasks.set(routine.id, task);
    } else {
        console.warn(`[Scheduler] Routine "${routine.name}" has a time trigger but missing time details.`);
        log('warn', `Routine "${routine.name}" has a time trigger but missing time details.`, routine.userId, { routineId: routine.id, component: 'SchedulerService' });
    }
  }
};

/**
 * Unschedules a routine.
 * @param routineId The ID of the routine to unschedule.
 */
export const unscheduleRoutine = (routineId: string) => {
  if (scheduledCronTasks.has(routineId)) {
    scheduledCronTasks.get(routineId)?.stop();
    scheduledCronTasks.delete(routineId);
    console.log(`[Scheduler] Unscheduled routine with ID: ${routineId}`);
    log('info', `Unscheduled routine with ID: ${routineId}`, undefined, { component: 'SchedulerService' }); // UserId might not be known here
  }
};


/**
 * Initializes the scheduler by loading and scheduling all active time-based routines.
 * This should be called when the application starts.
 */
export const initializeScheduler = async () => {
  console.log('[Scheduler] Initializing scheduler...');
  await log('info', 'Initializing scheduler...', undefined, { component: 'SchedulerService' });
  try {
    const routines = await getAllItems<Routine>(ROUTINES_DB_FILE);
    let scheduledCount = 0;
    routines.forEach(routine => {
      if (routine.trigger.type === 'time' && routine.isEnabled) {
        scheduleRoutine(routine);
        scheduledCount++;
      }
    });
    console.log(`[Scheduler] Initialized. ${scheduledCount} time-based routines processed for scheduling.`);
    await log('info', `Scheduler initialized. ${scheduledCount} time-based routines processed.`, undefined, { component: 'SchedulerService', scheduledTasks: scheduledCronTasks.size });
  } catch (error) {
    console.error('[Scheduler] Error initializing scheduler:', error);
    await log('error', `Error initializing scheduler: ${(error as Error).message}`, undefined, { component: 'SchedulerService', stack: (error as Error).stack });
  }
};

/**
 * Schedules a one-time action using setTimeout.
 * @param delayMs Delay in milliseconds.
 * @param action The function to execute.
 * @returns A unique ID for the scheduled action.
 */
export const scheduleOneTimeAction = (delayMs: number, action: () => void): string => {
  const actionId = `one-time-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  console.log(`[Scheduler] Scheduling one-time action ID ${actionId} in ${delayMs / 1000} seconds.`);
  log('info', `Scheduling one-time action ID ${actionId}`, undefined, { delayMs, component: 'SchedulerService' });

  const timeoutId = setTimeout(() => {
    console.log(`[Scheduler] Executing one-time scheduled action ID ${actionId}.`);
    log('info', `Executing one-time action ID ${actionId}`, undefined, { component: 'SchedulerService' });
    try {
        action();
    } catch (e) {
        console.error(`[Scheduler] Error executing one-time action ID ${actionId}:`, e);
        log('error', `Error executing one-time action ID ${actionId}: ${(e as Error).message}`, undefined, { component: 'SchedulerService', stack: (e as Error).stack });
    }
    scheduledOneTimeTimeouts.delete(actionId); // Clean up after execution
  }, delayMs);

  scheduledOneTimeTimeouts.set(actionId, timeoutId);
  return actionId;
};

/**
 * Cancels a previously scheduled one-time action.
 * @param actionId The ID of the action to cancel.
 * @returns True if cancelled, false otherwise.
 */
export const cancelOneTimeAction = (actionId: string): boolean => {
    if (scheduledOneTimeTimeouts.has(actionId)) {
        clearTimeout(scheduledOneTimeTimeouts.get(actionId)!);
        scheduledOneTimeTimeouts.delete(actionId);
        console.log(`[Scheduler] Cancelled one-time action ID ${actionId}.`);
        log('info', `Cancelled one-time action ID ${actionId}`, undefined, { component: 'SchedulerService' });
        return true;
    }
    console.warn(`[Scheduler] Could not find one-time action ID ${actionId} to cancel.`);
    log('warn', `Could not find one-time action ID ${actionId} to cancel.`, undefined, { component: 'SchedulerService' });
    return false;
};
