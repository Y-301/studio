// backend/src/services/deviceService.ts
import type { Device } from '../models/device'; // Assuming this model is in backend/src/models
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
    updatedAt: new Date().toISOString(),
  };
  await upsertItem<Device>(DEVICES_DB_FILE, deviceId, updatedDevice);
  log('info', `Updated device ID: ${deviceId} for user: ${userId}`, userId, { component: 'DeviceService', updates: Object.keys(updateData) });
  return updatedDevice;
};

/**
 * Update device status.
 * @param deviceId The ID of the device.
 * @param userId The ID of the user.
 * @param status The new status.
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
    updatePayload.settings = { ...device.settings, ...settings };
  }

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
  const userDevices = await getDevicesByUserId(userId);
  if (userDevices.length === 0) return;

  const db = await readDbFile<Device>(DEVICES_DB_FILE);
  let changed = false;

  for (const device of userDevices) {
    if (Math.random() < 0.2) { // 20% chance to change status
      if (device.type === 'light' || device.type === 'switch' || device.type === 'fan') {
        const newStatus = db[device.id].status === 'on' ? 'off' : 'on';
        db[device.id].status = newStatus;
        db[device.id].updatedAt = new Date().toISOString();
        if (newStatus === 'on' && device.type === 'light' && db[device.id].settings) {
            db[device.id].settings.brightness = Math.floor(Math.random() * 81) + 20; // brightness 20-100
        }
        changed = true;
        log('debug', `Simulated status change for device ${device.id} to ${newStatus}`, userId, { component: 'DeviceService' });
      } else if (device.type === 'thermostat' && db[device.id].settings) {
        const newTemp = Math.floor(Math.random() * 10) + 18; // temp 18-27
        db[device.id].settings.temperature = newTemp;
        db[device.id].status = newTemp > 0 ? 'on' : 'off'; // Basic status logic
        db[device.id].updatedAt = new Date().toISOString();
        changed = true;
        log('debug', `Simulated temp change for device ${device.id} to ${newTemp}°C`, userId, { component: 'DeviceService' });
      }
    }
  }

  if (changed) {
    await writeDbFile(DEVICES_DB_FILE, db);
    log('info', `Simulated device changes applied for user ${userId}`, userId, { component: 'DeviceService' });
  }
};

// Periodically simulate device changes (e.g., every 10 seconds)
// This is a simple way to create "live" data. For a real app, this would be event-driven from actual devices.
// setInterval(() => {
//   // Assuming a default/demo user ID for global simulation
//   simulateDeviceChanges('user1'); 
// }, 15000); // Simulate every 15 seconds
