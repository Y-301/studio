
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../data');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

interface DbData<T> {
  [key: string]: T;
}

export const readDbFile = async <T>(filename: string): Promise<DbData<T>> => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid JSON, return empty object
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    console.error(`Error reading DB file ${filename}:`, error);
    return {}; // Or throw error depending on desired behavior
  }
};

export const writeDbFile = async <T>(filename: string, data: DbData<T>): Promise<void> => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing DB file ${filename}:`, error);
    throw error; // Re-throw to let caller handle
  }
};

// Example: Get a specific item by ID
export const getItemById = async <T>(filename: string, id: string): Promise<T | undefined> => {
  const db = await readDbFile<T>(filename);
  return db[id];
};

// Example: Add or update an item
export const upsertItem = async <T>(filename: string, id: string, item: T): Promise<T> => {
  const db = await readDbFile<T>(filename);
  db[id] = item;
  await writeDbFile(filename, db);
  return item;
};

// Example: Delete an item by ID
export const deleteItemById = async <T>(filename: string, id: string): Promise<boolean> => {
  const db = await readDbFile<T>(filename);
  if (db[id]) {
    delete db[id];
    await writeDbFile(filename, db);
    return true;
  }
  return false;
};

// Example: Get all items
export const getAllItems = async <T>(filename: string): Promise<T[]> => {
  const db = await readDbFile<T>(filename);
  return Object.values(db);
};
