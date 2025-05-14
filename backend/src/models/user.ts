
// backend/models/user.ts
import fs from 'fs/promises';
import path from 'path';
import { log } from '../services/logService';

const USERS_DB_FILE = path.join(__dirname, '../../data/users.json');

export interface StoredUser {
  id: string;
  email: string; // Should be unique, used as key in the JSON object
  passwordHash: string;
  name?: string;
  photoURL?: string | null;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

// Type for the structure of users.json (email as key)
export type UsersDb = Record<string, StoredUser>;

export const readUsers = async (): Promise<UsersDb> => {
  try {
    const data = await fs.readFile(USERS_DB_FILE, 'utf-8');
    return JSON.parse(data) as UsersDb;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      log('warn', `users.json not found. Returning empty object. A new file will be created on write.`, undefined, {component: 'UserModel'});
      return {}; // If file doesn't exist, return empty object
    }
    log('error', `Error reading users.json: ${nodeError.message}`, undefined, {component: 'UserModel', stack: nodeError.stack});
    throw error;
  }
};

export const writeUsers = async (users: UsersDb): Promise<void> => {
  try {
    await fs.writeFile(USERS_DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
     const nodeError = error as NodeJS.ErrnoException;
    log('error', `Error writing users.json: ${nodeError.message}`, undefined, {component: 'UserModel', stack: nodeError.stack});
    throw error;
  }
};

// Initialize users.json if it doesn't exist
export const initializeUsersFile = async () => {
  try {
    await fs.access(USERS_DB_FILE);
  } catch (error) { // File does not exist
    log('info', 'users.json not found, creating with empty object.', undefined, { component: 'UserModel'});
    await fs.writeFile(USERS_DB_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
};

initializeUsersFile();
