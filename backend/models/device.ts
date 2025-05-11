// backend/models/user.ts

// Basic User interface
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  // Add more properties as needed (e.g., password hash, roles, etc.)
}

// Example if using Mongoose (install mongoose first: npm install mongoose)
/*
import mongoose, { Schema, Document } from 'mongoose';

export interface UserDocument extends User, Document {}

const userSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  passwordHash: { type: String, required: true }, // Store hashed password
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
*/// backend/models/device.ts

// Basic Device interface
export interface Device { // Make sure 'export' is here
  id: string;
  userId: string; // Link to the user who owns the device
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'speaker' | 'other'; // Example device types
  status: 'on' | 'off' | 'connecting' | 'error';
  settings: any; // Can be a generic object for various settings
  room?: string; // Optional: room the device is in
  createdAt: Date;
  updatedAt: Date;
  // Add more properties relevant to devices
}

// Example if using Mongoose (install mongoose first: npm install mongoose)
/*
import mongoose, { Schema, Document } from 'mongoose';

export interface DeviceDocument extends Device, Document {}

const deviceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, default: 'off' },
  settings: { type: mongoose.Schema.Types.Mixed }, // Allows flexible settings
  room: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DeviceModel = mongoose.model<DeviceDocument>('Device', deviceSchema);

export default UserModel; // Note: This should likely be DeviceModel if using Mongoose
*/

