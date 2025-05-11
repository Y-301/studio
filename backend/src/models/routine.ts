// backend/src/models/routine.ts
import type { Device } from './device';

export interface RoutineAction {
  deviceId: string;
  // deviceName?: string; // For context, not strictly needed in backend model if deviceId is source of truth
  // deviceType?: Device['type']; // Same as above
  actionType?: string; // e.g., 'turn_on', 'set_brightness', 'set_temperature' (can be derived)
  targetState: string; // Primary way to define action for now e.g. "on", "brightness:70"
  actionData?: any; // More structured data if needed, e.g. { brightness: 70 }
}

export interface RoutineTrigger {
  type: 'time' | 'event' | 'manual' | 'wristband_event' | 'device_state_change';
  details?: any; // Details about the trigger (e.g., time schedule, event type)
}

export interface Routine {
  id: string;
  userId: string; // Link to the user who owns the routine
  name: string;
  description?: string;
  trigger: RoutineTrigger;
  actions: RoutineAction[];
  isEnabled: boolean; // Whether the routine is active or not
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  lastRun?: string; // Optional: ISO Date String of last execution
  // icon?: string; // Icon name for frontend, if stored in backend
  // dataAiHint?: string; // for AI features
}
