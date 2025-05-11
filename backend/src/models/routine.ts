// backend/src/models/routine.ts
import type { Device } from './device';

export interface RoutineAction {
  deviceId: string;
  deviceName?: string; // Optional: For context, if stored. If not, frontend can fetch/derive.
  deviceType?: Device['type']; // Optional: Same as above.
  actionType?: string; // e.g., 'turn_on', 'set_brightness', 'set_temperature'. Can be specific or generic.
  targetState: string; // Primary way to define action for now e.g. "on", "brightness:70", "22" (for thermostat)
  actionData?: any; // More structured data if targetState isn't enough, e.g. { brightness: 70, color: "#FF0000" }
}

export interface RoutineTrigger {
  type: 'time' | 'event' | 'manual' | 'wristband_event' | 'device_state_change';
  details?: any; // Details: e.g., time "07:00", event type "motion_detected", deviceId for state change
}

export interface Routine {
  id: string;
  userId: string; 
  name: string;
  description?: string;
  trigger: RoutineTrigger;
  actions: RoutineAction[];
  isEnabled: boolean; 
  createdAt: string; 
  updatedAt: string; 
  lastRun?: string | null; // Can be null if never run
}