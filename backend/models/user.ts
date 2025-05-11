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
*/
