
import fs from 'fs/promises';
import path from 'path';
import { log } from '../services/logService'; // Assuming logService is one level up

const DATA_DIR = path.resolve(__dirname, '../../data');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      console.log(`Data directory ${DATA_DIR} not found. Creating it.`);
      await fs.mkdir(DATA_DIR, { recursive: true });
    } else {
      throw error; // Re-throw other errors
    }
  }
};

// Initialize by ensuring data directory exists
ensureDataDir().catch(err => console.error("Failed to ensure data directory:", err));


interface DbData<T> {
  [key: string]: T;
}

export const readDbFile = async <T>(filename: string): Promise<DbData<T>> => {
  await ensureDataDir(); 
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as DbData<T>;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      log('warn',`DB file ${filename} not found. Returning empty object. A new file will be created on write.`, undefined, {component: 'JsonDb'});
      return {} as DbData<T>;
    }
    log('error',`Error reading DB file ${filename}: ${nodeError.message}`, undefined, {component: 'JsonDb', stack: nodeError.stack});
    return {} as DbData<T>; 
  }
};

export const writeDbFile = async <T>(filename: string, data: DbData<T>): Promise<void> => {
  await ensureDataDir(); 
  const filePath = path.join(DATA_DIR, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    log('error', `Error writing DB file ${filename}: ${nodeError.message}`, undefined, {component: 'JsonDb', stack: nodeError.stack});
    throw error; 
  }
};

export const getItemById = async <T>(filename: string, id: string): Promise<T | undefined> => {
  const db = await readDbFile<T>(filename);
  return db[id];
};

export const upsertItem = async <T>(filename: string, id: string, item: T): Promise<T> => {
  const db = await readDbFile<T>(filename);
  db[id] = item;
  await writeDbFile(filename, db);
  return item;
};

export const deleteItemById = async <T>(filename: string, id: string): Promise<boolean> => {
  const db = await readDbFile<T>(filename);
  if (db[id]) {
    delete db[id];
    await writeDbFile(filename, db);
    return true;
  }
  return false;
};

export const getAllItems = async <T>(filename: string): Promise<T[]> => {
  const db = await readDbFile<T>(filename);
  return Object.values(db);
};
