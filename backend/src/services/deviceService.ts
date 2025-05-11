// backend/src/services/deviceService.ts
import type { Device } from '../models/device'; 
import {
  getAllItems,
  getItemById,
  upsertItem,
  deleteItemById,
  readDbFile,
  writeDbFile
} from '../utils/jsonDb';
import { log } from './logService';

const DEVICES_DB_FILE = 'devices.json';

/**
 * Get all devices for a specific user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves with an array of devices.
 */
export const getDevicesByUserId = async (userId: string): Promise<Device[]> => {
  log('info', `Fetching devices for user: ${userId}`, userId, { component: 'DeviceService' });
  const allDevices = await getAllItems<Device>(DEVICES_DB_FILE);
  return allDevices.filter(device => device.userId === userId);
};

/**
 * Get a single device by its ID, ensuring it belongs to the user.
 * @param deviceId - The ID of the device.
 * @param userId - The ID of the user.
 * @returns A promise that resolves with the device, or null if not found or not owned by user.
 */
export const getDeviceByIdAndUserId = async (deviceId: string, userId: string): Promise<Device | null> => {
  log('info', `Fetching device ID: ${deviceId} for user: ${userId}`, userId, { component: 'DeviceService' });
  const device = await getItemById<Device>(DEVICES_DB_FILE, deviceId);
  if (device && device.userId === userId) {
    return device;
  }
  if (device && device.userId !== userId) {
    log('warn', `User ${userId} attempted to access device ${deviceId} owned by ${device.userId}`, userId, { component: 'DeviceService' });
  }
  return null;
};

/**
 * Add a new device for a user.
 * @param userId - The ID of the user.
 * @param deviceData - The data for the new device (excluding id, createdAt, updatedAt).
 * @returns A promise that resolves with the newly added device.
 */
export const addDevice = async (userId: string, deviceData: Omit<Device, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Device> => {
  const newId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newDevice: Device = {
    id: newId,
    userId,
    ...deviceData,
    createdAt: now,
    updatedAt: now,
  };
  await upsertItem<Device>(DEVICES_DB_FILE, newId, newDevice);
  log('info', `Added new device ID: ${newId} for user: ${userId}`, userId, { component: 'DeviceService', deviceName: newDevice.name });
  return newDevice;
};

/**
 * Update an existing device, ensuring it belongs to the user.
 * @param deviceId - The ID of the device to update.
 * @param userId - The ID of the user.
 * @param updateData - The data to update the device with.
 * @returns A promise that resolves with the updated device, or null if not found or not owned by user.
 */
export const updateDevice = async (deviceId: string, userId: string, updateData: Partial<Omit<Device, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Device | null> => {
  const existingDevice = await getItemById<Device>(DEVICES_DB_FILE, deviceId);
  if (!existingDevice || existingDevice.userId !== userId) {
    log('warn', `Update failed for device ID: ${deviceId}. Not found or user ${userId} unauthorized.`, userId, { component: 'DeviceService' });
    return null;
  }
  const updatedDevice: Device = {
    ...existingDevice,
    ...updateData,
    // Ensure settings are merged, not overwritten, if only partial settings are provided
    settings: updateData.settings ? { ...existingDevice.settings, ...updateData.settings } : existingDevice.settings,
    updatedAt: new Date().toISOString(),
  };
  await upsertItem<Device>(DEVICES_DB_FILE, deviceId, updatedDevice);
  log('info', `Updated device ID: ${deviceId} for user: ${userId}`, userId, { component: 'DeviceService', updates: Object.keys(updateData) });
  return updatedDevice;
};

/**
 * Update device status and optionally settings.
 * @param deviceId The ID of the device.
 * @param userId The ID of the user.
 * @param status The new status (can be device specific, e.g. "on", "22", "closed").
 * @param settings Optional settings to update alongside status.
 * @returns The updated device or null.
 */
export const updateDeviceStatus = async (deviceId: string, userId: string, status: Device['status'], settings?: Partial<Device['settings']>): Promise<Device | null> => {
  const device = await getItemById<Device>(DEVICES_DB_FILE, deviceId);
  if (!device || device.userId !== userId) {
    log('warn', `Status update failed for device ID: ${deviceId}. Not found or user ${userId} unauthorized.`, userId, { component: 'DeviceService' });
    return null;
  }

  const updatePayload: Partial<Omit<Device, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = { status };
  if (settings) {
    // Ensure settings are merged correctly, not overwritten if partial settings are passed
    updatePayload.settings = { ...device.settings, ...settings };
  }
  
  log('info', `Updating device status for ${deviceId} to ${status}`, userId, { component: 'DeviceService', settings });
  return updateDevice(deviceId, userId, updatePayload);
};


/**
 * Delete a device, ensuring it belongs to the user.
 * @param deviceId - The ID of the device to delete.
 * @param userId - The ID of the user.
 * @returns A promise that resolves with true if deleted, false otherwise.
 */
export const deleteDeviceByIdAndUserId = async (deviceId: string, userId: string): Promise<boolean> => {
  const existingDevice = await getItemById<Device>(DEVICES_DB_FILE, deviceId);
  if (!existingDevice || existingDevice.userId !== userId) {
    log('warn', `Delete failed for device ID: ${deviceId}. Not found or user ${userId} unauthorized.`, userId, { component: 'DeviceService' });
    return false;
  }
  const deleted = await deleteItemById(DEVICES_DB_FILE, deviceId);
  if (deleted) {
    log('info', `Deleted device ID: ${deviceId} for user: ${userId}`, userId, { component: 'DeviceService' });
  }
  return deleted;
};

/**
 * Simulates random changes to device statuses for a user.
 * This is for demo purposes to show "real-time" fake data.
 */
export const simulateDeviceChanges = async (userId: string): Promise<void> => {
  log('debug', `Starting device change simulation for user ${userId}`, userId, { component: 'DeviceService' });
  const userDevices = await getDevicesByUserId(userId);
  if (userDevices.length === 0) {
    log('debug', `No devices found for user ${userId} to simulate changes.`, userId, { component: 'DeviceService' });
    return;
  }

  const db = await readDbFile<Device>(DEVICES_DB_FILE);
  let changesMade = false;

  for (const device of userDevices) {
    try {
      if (Math.random() < 0.25) { // 25% chance to change status for more noticeable simulation
        let newStatus = db[device.id].status;
        let newSettings = { ...db[device.id].settings };
        let changed = false;

        switch (device.type) {
          case 'light':
            newStatus = db[device.id].status === 'on' ? 'off' : 'on';
            if (newStatus === 'on') {
              newSettings.brightness = Math.floor(Math.random() * 81) + 20; // brightness 20-100
            }
            changed = true;
            break;
          case 'thermostat':
            const currentTemp = db[device.id].settings?.temperature || 20;
            const tempChange = Math.floor(Math.random() * 5) - 2; // -2 to +2 change
            newSettings.temperature = Math.max(15, Math.min(30, currentTemp + tempChange)); // Keep temp between 15-30
            newStatus = newSettings.temperature > 0 ? String(newSettings.temperature) : 'off'; // Reflect temp in status
            changed = true;
            break;
          case 'speaker':
            newStatus = db[device.id].status === 'on' ? 'off' : 'on';
            if (newStatus === 'on') {
              newSettings.volume = Math.floor(Math.random() * 71) + 10; // volume 10-80
            }
            changed = true;
            break;
          case 'blinds':
            newStatus = db[device.id].status === 'open' ? 'closed' : (Math.random() < 0.5 ? 'open' : 'partially_open');
            newSettings.position = newStatus === 'open' ? 100 : newStatus === 'closed' ? 0 : 50;
            changed = true;
            break;
          case 'fan':
          case 'switch':
          case 'tv':
            newStatus = db[device.id].status === 'on' ? 'off' : 'on';
            changed = true;
            break;
          case 'sensor':
            // Example: Temperature sensor
            if (db[device.id].settings?.unit === "C") {
                const currentReading = db[device.id].settings?.last_reading || 21;
                const readingChange = (Math.random() * 2 - 1).toFixed(1); // -1.0 to +1.0
                newSettings.last_reading = parseFloat((currentReading + parseFloat(readingChange)).toFixed(1));
                newStatus = `${newSettings.last_reading}°C`;
                changed = true;
            }
            // Add more sensor types as needed
            break;
          default:
            // For 'other' devices, maybe a generic on/off
            if (Math.random() < 0.5) {
                newStatus = db[device.id].status === 'active' ? 'inactive' : 'active';
                changed = true;
            }
        }

        if (changed) {
          db[device.id].status = newStatus;
          db[device.id].settings = newSettings;
          db[device.id].updatedAt = new Date().toISOString();
          changesMade = true;
          log('info', `Simulated change for device ${device.name} (${device.id}): status=${newStatus}, settings=${JSON.stringify(newSettings)}`, userId, { component: 'DeviceService' });
        }
      }
    } catch(err) {
        log('error', `Error simulating change for device ${device.id}: ${(err as Error).message}`, userId, { component: 'DeviceService', stack: (err as Error).stack });
    }
  }

  if (changesMade) {
    try {
      await writeDbFile(DEVICES_DB_FILE, db);
      log('info', `Successfully wrote simulated device changes for user ${userId} to DB.`, userId, { component: 'DeviceService' });
    } catch (err) {
      log('error', `Error writing simulated device changes to DB for user ${userId}: ${(err as Error).message}`, userId, { component: 'DeviceService', stack: (err as Error).stack });
    }
  } else {
    log('debug', `No device changes simulated in this cycle for user ${userId}.`, userId, { component: 'DeviceService' });
  }
};