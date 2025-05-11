// backend/models/routine.ts

// Basic Routine interface
export interface Routine {
  id: string;
  userId: string; // Link to the user who owns the routine
  name: string;
  description?: string;
  trigger: {
    type: 'time' | 'event' | 'manual'; // e.g., 'time', 'wristband_wake_up', 'manual'
    details: any; // Details about the trigger (e.g., time schedule, event type)
  };
  actions: Array<{
    deviceId: string; // ID of the device to control
    actionType: string; // e.g., 'turn_on', 'set_brightness', 'set_temperature'
    actionData: any; // Data for the action (e.g., brightness level, temperature value)
  }>;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Add more properties relevant to routines
}

// Example if using Mongoose
/*
import mongoose, { Schema, Document } from 'mongoose';

export interface RoutineDocument extends Routine, Document {}

const routineSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  trigger: {
    type: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  actions: [{
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    actionType: { type: String, required: true },
    actionData: { type: mongoose.Schema.Types.Mixed },
  }],
  isEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const RoutineModel = mongoose.model<RoutineDocument>('Routine', routineSchema);

export default RoutineModel;
*/
