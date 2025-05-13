// backend/services/wristbandService.ts
import { log } from './logService';
// import { triggerRoutine } from './routineService'; // Uncomment if wristband events should trigger routines

export interface WristbandEvent {
  timestamp: Date;
  userId: string; 
  eventType: 'wake_up' | 'sleep_detected' | 'activity_spike' | 'device_interaction' | 'heart_rate_update' | 'steps_update'; 
  details?: any; 
}

// In-memory store for mock wristband events (for demo purposes)
const mockWristbandEventStore: WristbandEvent[] = [];

/**
 * Processes incoming wristband data.
 * @param eventData - The data received from the wristband.
 */
export const processWristbandEvent = async (eventData: WristbandEvent): Promise<void> => {
  log('info', `Processing wristband event: ${eventData.eventType} for user ${eventData.userId}`, eventData.userId, { component: 'WristbandService', details: eventData.details });
  
  // Persist eventData to the mock store
  mockWristbandEventStore.unshift(eventData); // Add to the beginning for recent first
  if (mockWristbandEventStore.length > 200) { // Keep store size manageable
    mockWristbandEventStore.pop();
  }

  if (eventData.eventType === 'wake_up') {
    log('info',`Wristband detected wake up for user ${eventData.userId}. Potential routine trigger.`, eventData.userId, { component: 'WristbandService' });
    // Placeholder for routine triggering logic:
    // console.log(`Placeholder: Routine 'Morning Routine' would be considered for triggering for user ${eventData.userId}`);
    // Example:
    // const morningRoutine = await findRoutineByName(eventData.userId, 'Morning Wake Up');
    // if (morningRoutine && morningRoutine.isEnabled) {
    //   await triggerRoutine(morningRoutine.id, eventData.userId);
    // }
  }
};

/**
 * Gets recent wristband events for a user (from in-memory mock store).
 * @param userId - The ID of the user.
 * @param limit - Optional limit on the number of events.
 * @returns A promise that resolves with an array of wristband events.
 */
export const getWristbandEvents = async (userId: string, limit: number = 10): Promise<WristbandEvent[]> => {
  log('info', `Fetching wristband events for user: ${userId} (limit: ${limit}) from mock store.`, userId, { component: 'WristbandService' });
  
  const userEvents = mockWristbandEventStore.filter(event => event.userId === userId);
  return userEvents.slice(0, limit);
};


// Simulation State (in-memory, reset on server restart)
interface UserSimulationState {
  steps: number;
  currentSleepState: 'awake' | 'light' | 'deep' | 'rem';
  timeInCurrentSleepStateMinutes: number;
  lastHeartRate: number;
}
const userSimulationStates: { [userId: string]: UserSimulationState } = {};

const SLEEP_STATE_TRANSITIONS: Record<UserSimulationState['currentSleepState'], Array<{nextState: UserSimulationState['currentSleepState'], probability: number, minDuration: number, maxDuration: number}>> = {
    awake: [
        { nextState: 'light', probability: 0.8, minDuration: 5, maxDuration: 20 }, // More likely to fall asleep if trying
        { nextState: 'awake', probability: 0.2, minDuration: 15, maxDuration: 60 }, // Stay awake
    ],
    light: [
        { nextState: 'deep', probability: 0.6, minDuration: 20, maxDuration: 40 },
        { nextState: 'rem', probability: 0.3, minDuration: 10, maxDuration: 20 },
        { nextState: 'awake', probability: 0.1, minDuration: 2, maxDuration: 10 }, // Briefly wake up
    ],
    deep: [
        { nextState: 'light', probability: 0.7, minDuration: 20, maxDuration: 40 },
        { nextState: 'rem', probability: 0.3, minDuration: 15, maxDuration: 30 }, // Less common to go directly to REM but possible
    ],
    rem: [
        { nextState: 'light', probability: 0.8, minDuration: 10, maxDuration: 25 },
        { nextState: 'awake', probability: 0.2, minDuration: 1, maxDuration: 5 }, // End of cycle, might wake up
    ],
};

/**
 * Simulates realistic wristband data and processes it.
 * @param userId The ID of the user for whom to simulate data.
 */
export const simulateAndProcessWristbandData = async (userId: string): Promise<void> => {
  if (!userSimulationStates[userId]) {
    userSimulationStates[userId] = {
      steps: Math.floor(Math.random() * 1500) + 500, // Initial random steps (500-2000)
      currentSleepState: 'awake',
      timeInCurrentSleepStateMinutes: 0,
      lastHeartRate: 75,
    };
  }
  const state = userSimulationStates[userId];
  const now = new Date();
  const currentHour = now.getHours();

  // Simulate Heart Rate
  let heartRate: number;
  if (state.currentSleepState === 'deep') heartRate = state.lastHeartRate + (Math.random() * 4 - 2) - 2; // Lower HR in deep sleep
  else if (state.currentSleepState !== 'awake') heartRate = state.lastHeartRate + (Math.random() * 6 - 3) -1; // Slightly lower during other sleep
  else heartRate = state.lastHeartRate + (Math.random() * 10 - 5); // More variable when awake
  heartRate = Math.max(45, Math.min(180, Math.round(heartRate))); // Clamp HR
  state.lastHeartRate = heartRate;
  await processWristbandEvent({ timestamp: now, userId, eventType: 'heart_rate_update', details: { value: heartRate, unit: 'bpm', source: 'simulation' } });


  // Simulate Steps (only if awake and not late night/early morning unless active)
  const isGenerallyActiveTime = currentHour > 7 && currentHour < 22;
  if (state.currentSleepState === 'awake' && isGenerallyActiveTime) {
    state.steps += Math.floor(Math.random() * (currentHour > 8 && currentHour < 19 ? 50 : 15)); // More steps during typical day hours
    await processWristbandEvent({ timestamp: now, userId, eventType: 'steps_update', details: { totalToday: state.steps, source: 'simulation' } });
  }

  // Simulate Sleep State Transitions
  state.timeInCurrentSleepStateMinutes += 1; // Assuming simulation interval is roughly 1 minute for sleep state changes

  const possibleTransitions = SLEEP_STATE_TRANSITIONS[state.currentSleepState];
  let transitioned = false;
  for (const transition of possibleTransitions) {
    if (state.timeInCurrentSleepStateMinutes >= transition.minDuration && Math.random() < (transition.probability / ((transition.maxDuration - transition.minDuration) || 1) )) {
      const oldSleepState = state.currentSleepState;
      state.currentSleepState = transition.nextState;
      state.timeInCurrentSleepStateMinutes = 0;
      transitioned = true;
      log('debug', `User ${userId} sleep state changed from ${oldSleepState} to ${state.currentSleepState}`, userId, {component: 'WristbandSimulation'});
      
      if (oldSleepState !== 'awake' && state.currentSleepState === 'awake') {
        await processWristbandEvent({ timestamp: now, userId, eventType: 'wake_up', details: { reason: 'cycle_end', confidence: Math.random() * 0.3 + 0.7, source: 'simulation' } });
      } else {
        await processWristbandEvent({ timestamp: now, userId, eventType: 'sleep_detected', details: { stage: state.currentSleepState, durationInStageMinutes: 0, source: 'simulation' } });
      }
      break; 
    }
  }
  if (!transitioned && state.currentSleepState !== 'awake') {
     // If still in the same sleep state, just log it as a continuation for "sleep_detected" type event if needed for analytics
     // Or this can be omitted if only transitions are important
     await processWristbandEvent({ timestamp: now, userId, eventType: 'sleep_detected', details: { stage: state.currentSleepState, durationInStageMinutes: state.timeInCurrentSleepStateMinutes, source: 'simulation_ongoing' } });
  }


  // Simulate occasional activity spikes or device interactions if awake
  if (state.currentSleepState === 'awake') {
    if (Math.random() < 0.05) { // 5% chance of an activity spike
      await processWristbandEvent({ timestamp: now, userId, eventType: 'activity_spike', details: { type: 'moderate', durationSeconds: 30, source: 'simulation' } });
    } else if (Math.random() < 0.02) { // 2% chance of a device interaction
       await processWristbandEvent({ timestamp: now, userId, eventType: 'device_interaction', details: { deviceId: `sim_device_${Math.floor(Math.random()*3)}`, action: (Math.random() < 0.5 ? 'on' : 'off'), source: 'simulation' }});
    }
  }
  log('debug', `Wristband simulation cycle complete for ${userId}. State: ${JSON.stringify(state)}`, userId, {component: 'WristbandSimulation'});
};
