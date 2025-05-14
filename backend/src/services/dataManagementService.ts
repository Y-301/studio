
// backend/src/services/dataManagementService.ts
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { Parser } from 'json2csv';
import { log } from './logService';
import { Device } from '../models/device';
import { readDbFile, writeDbFile } from '../utils/jsonDb';

const DEVICES_DB_FILE = 'devices.json';
const STATUS_DB_FILE = 'status.json'; // To store app status like isSeededByCsv

interface AppStatus {
  isSeededByCsv: boolean;
  hasUsers?: boolean; // Optional, might be determined differently
}

/**
 * Processes an uploaded CSV file to update devices.
 * Assumes CSV structure: id,name,type,status,room,connectionDetails,dataAiHint,settings_brightness,settings_temperature,settings_volume
 * This is a simplified example and might need more robust error handling and type conversion.
 */
export const processDeviceCsv = async (filePath: string): Promise<{ success: boolean; message: string; deviceCount?: number }> => {
  return new Promise((resolve, reject) => {
    const newDevices: Record<string, Device> = {};
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: any) => {
        rowCount++;
        if (!row.id || !row.name || !row.type) {
          log('warn', `Skipping CSV row due to missing id, name, or type: ${JSON.stringify(row)}`, undefined, { component: 'DataManagementService' });
          return;
        }
        const device: Device = {
          id: row.id,
          userId: row.userId || 'user1', // Default to user1 if not specified in CSV
          name: row.name,
          type: row.type as Device['type'],
          status: row.status || 'off',
          room: row.room || 'Unassigned',
          connectionDetails: row.connectionDetails || '',
          dataAiHint: row.dataAiHint || '',
          settings: {
            brightness: row.settings_brightness ? parseInt(row.settings_brightness, 10) : undefined,
            temperature: row.settings_temperature ? parseInt(row.settings_temperature, 10) : undefined,
            volume: row.settings_volume ? parseInt(row.settings_volume, 10) : undefined,
            // Add other settings as needed based on CSV columns
          },
          createdAt: row.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // Filter out undefined settings
        Object.keys(device.settings).forEach(key => device.settings[key] === undefined && delete device.settings[key]);
        newDevices[device.id] = device;
      })
      .on('end', async () => {
        try {
          await writeDbFile(DEVICES_DB_FILE, newDevices);
          await updateAppStatus({ isSeededByCsv: true });
          log('info', `Successfully processed ${Object.keys(newDevices).length} devices from CSV. ${rowCount} rows read.`, undefined, { component: 'DataManagementService' });
          resolve({ success: true, message: `Successfully imported ${Object.keys(newDevices).length} devices from CSV.`, deviceCount: Object.keys(newDevices).length });
        } catch (error) {
          log('error', 'Error writing processed CSV data to devices.json', undefined, { component: 'DataManagementService', error });
          reject({ success: false, message: 'Failed to save processed CSV data.' });
        } finally {
          fs.unlinkSync(filePath); // Clean up uploaded file
        }
      })
      .on('error', (error: Error) => {
        log('error', 'Error processing CSV file', undefined, { component: 'DataManagementService', error });
        fs.unlinkSync(filePath); // Clean up uploaded file
        reject({ success: false, message: `Error processing CSV file: ${error.message}` });
      });
  });
};

/**
 * Exports current devices to a CSV string.
 */
export const exportDevicesToCsv = async (): Promise<string> => {
  try {
    const devicesData = await readDbFile<Device>(DEVICES_DB_FILE);
    const devicesArray = Object.values(devicesData);

    if (devicesArray.length === 0) {
      return ''; // Return empty string or header if no devices
    }

    // Flatten settings for CSV
    const flattenedDevices = devicesArray.map(device => ({
      id: device.id,
      userId: device.userId,
      name: device.name,
      type: device.type,
      status: device.status,
      room: device.room,
      connectionDetails: device.connectionDetails,
      dataAiHint: device.dataAiHint,
      settings_brightness: device.settings?.brightness,
      settings_temperature: device.settings?.temperature,
      settings_volume: device.settings?.volume,
      // Add other settings as needed
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    }));

    const fields = [
      'id', 'userId', 'name', 'type', 'status', 'room',
      'connectionDetails', 'dataAiHint',
      'settings_brightness', 'settings_temperature', 'settings_volume',
      'createdAt', 'updatedAt'
    ];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(flattenedDevices);
    return csv;
  } catch (error) {
    log('error', 'Failed to export devices to CSV', undefined, { component: 'DataManagementService', error });
    throw new Error('Failed to export devices to CSV');
  }
};

/**
 * Gets the current application status.
 */
export const getAppStatus = async (): Promise<AppStatus> => {
  try {
    const status = await readDbFile<AppStatus>(STATUS_DB_FILE);
    // Check if users.json exists and has users
    const usersFilePath = path.join(__dirname, '../../data/users.json');
    let hasUsers = false;
    try {
      if (fs.existsSync(usersFilePath)) {
        const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
        hasUsers = Object.keys(usersData).length > 0;
      }
    } catch (userError) {
      log('warn', 'Could not read users.json for app status check', undefined, { component: 'DataManagementService', userError });
    }

    return {
      isSeededByCsv: status.isSeededByCsv || false,
      hasUsers: hasUsers,
    };
  } catch (error) {
    log('warn', 'status.json not found or unreadable, returning default status.', undefined, { component: 'DataManagementService', error });
    // Default status if file doesn't exist
    return { isSeededByCsv: false, hasUsers: false };
  }
};

/**
 * Updates the application status.
 */
export const updateAppStatus = async (updates: Partial<AppStatus>): Promise<void> => {
  try {
    let currentStatus = await getAppStatus(); // This will create default if not exists via its error handling
    currentStatus = { ...currentStatus, ...updates };
    // Since writeDbFile expects a Record<string, T>, and status.json is not keyed,
    // we might need a specific writer for single object JSON files or adapt writeDbFile.
    // For now, assuming writeDbFile can handle this structure or creating a specific one.
    const statusFilePath = path.join(__dirname, '../../data', STATUS_DB_FILE);
    await fs.promises.writeFile(statusFilePath, JSON.stringify(currentStatus, null, 2), 'utf-8');

  } catch (error) {
    log('error', 'Failed to update app status in status.json', undefined, { component: 'DataManagementService', error });
    throw new Error('Failed to update app status');
  }
};

// Initialize status.json if it doesn't exist
export const initializeAppStatusFile = async () => {
  const statusFilePath = path.join(__dirname, '../../data', STATUS_DB_FILE);
  try {
    await fs.promises.access(statusFilePath);
  } catch (error) { // File does not exist
    log('info', 'status.json not found, creating with default values.', undefined, { component: 'DataManagementService'});
    await fs.promises.writeFile(statusFilePath, JSON.stringify({ isSeededByCsv: false }, null, 2), 'utf-8');
  }
};

initializeAppStatusFile();
