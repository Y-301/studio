
import cron from 'node-cron';
import { Routine } from '../models/routine'; // Assuming Routine model exists
import { getAllItems } from '../utils/jsonDb'; // Assuming routines are stored in routines.json

const ROUTINES_DB_FILE = 'routines.json';

// In-memory store for scheduled tasks (cron jobs)
const scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

/**
 * Simulates executing a routine's actions.
 * In a real app, this would interact with device services.
 */
const executeRoutineActions = (routine: Routine) => {
  console.log(`[Scheduler] Executing routine: "${routine.name}" (ID: ${routine.id}) for user ${routine.userId}`);
  routine.actions.forEach(action => {
    console.log(`  - Action: Device ${action.deviceId}, Type: ${action.actionType}, Data: ${JSON.stringify(action.actionData)}`);
    // TODO: Implement actual device control logic here
    // e.g., deviceService.controlDevice(action.deviceId, action.actionType, action.actionData);
  });
  console.log(`[Scheduler] Routine "${routine.name}" execution finished.`);
};

/**
 * Schedules a routine if it has a time-based trigger.
 * @param routine The routine to schedule.
 */
export const scheduleRoutine = (routine: Routine) => {
  if (routine.trigger.type === 'time' && routine.isEnabled) {
    const timeDetails = routine.trigger.details as { time: string }; // e.g., "07:30"
    if (timeDetails && timeDetails.time) {
      const [hour, minute] = timeDetails.time.split(':');
      
      // Cron format: minute hour * * *
      const cronExpression = `${minute} ${hour} * * *`;

      // Validate cron expression (basic)
      if (!cron.validate(cronExpression)) {
        console.error(`[Scheduler] Invalid cron expression for routine "${routine.name}": ${cronExpression}`);
        return;
      }

      // If a task for this routine already exists, stop and remove it first
      if (scheduledTasks.has(routine.id)) {
        scheduledTasks.get(routine.id)?.stop();
        scheduledTasks.delete(routine.id);
        console.log(`[Scheduler] Unscheduling existing task for routine: "${routine.name}"`);
      }
      
      console.log(`[Scheduler] Scheduling routine "${routine.name}" (ID: ${routine.id}) with cron: ${cronExpression}`);
      const task = cron.schedule(cronExpression, () => {
        console.log(`[Scheduler] Triggering routine "${routine.name}" at ${new Date().toLocaleTimeString()}`);
        executeRoutineActions(routine);
      }, {
        scheduled: true,
        // timezone: "America/New_York" // TODO: Make timezone user-configurable
      });
      scheduledTasks.set(routine.id, task);
    }
  }
};

/**
 * Unschedules a routine.
 * @param routineId The ID of the routine to unschedule.
 */
export const unscheduleRoutine = (routineId: string) => {
  if (scheduledTasks.has(routineId)) {
    scheduledTasks.get(routineId)?.stop();
    scheduledTasks.delete(routineId);
    console.log(`[Scheduler] Unscheduled routine with ID: ${routineId}`);
  }
};


/**
 * Initializes the scheduler by loading and scheduling all active time-based routines.
 * This should be called when the application starts.
 */
export const initializeScheduler = async () => {
  console.log('[Scheduler] Initializing scheduler...');
  try {
    const routines = await getAllItems<Routine>(ROUTINES_DB_FILE);
    routines.forEach(routine => {
      if (routine.trigger.type === 'time' && routine.isEnabled) {
        scheduleRoutine(routine);
      }
    });
    console.log(`[Scheduler] Initialized. ${scheduledTasks.size} time-based routines scheduled.`);
  } catch (error) {
    console.error('[Scheduler] Error initializing scheduler:', error);
  }
};

// Example of a simple setTimeout based "schedule" (not persistent, for demo)
export const scheduleOneTimeAction = (delayMs: number, action: () => void) => {
  console.log(`[Scheduler] Scheduling one-time action in ${delayMs / 1000} seconds.`);
  setTimeout(() => {
    console.log('[Scheduler] Executing one-time scheduled action.');
    action();
  }, delayMs);
};
