// backend/src/controllers/deviceController.ts
import type { Request, Response } from 'express';
import * as deviceService from '../services/deviceService';
import { log } from '../services/logService';
import type { Device } from '../models/device';

const DEFAULT_MOCK_USER_ID_IF_NO_AUTH = 'user1';

// Get all devices for the authenticated user
export const getAllDevices = async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  try {
    const devices = await deviceService.getDevicesByUserId(userId);
    res.status(200).json(devices);
  } catch (error) {
    log('error', `Error fetching devices for user ${userId}: ${(error as Error).message}`, userId, { component: 'DeviceController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get devices.' });
  }
};

// Get a single device by ID
export const getDeviceById = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  try {
    const device = await deviceService.getDeviceByIdAndUserId(deviceId, userId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found or not owned by user.' });
    }
    res.status(200).json(device);
  } catch (error) {
    log('error', `Error fetching device ${deviceId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'DeviceController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get device.' });
  }
};

// Add a new device
export const createDevice = async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  const deviceData: Omit<Device, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = req.body;

  if (!deviceData.name || !deviceData.type) {
    log('warn', 'Missing name or type for new device creation.', userId, { component: 'DeviceController', body: req.body });
    return res.status(400).json({ message: 'Device name and type are required.' });
  }

  try {
    const newDevice = await deviceService.addDevice(userId, deviceData);
    res.status(201).json(newDevice);
  } catch (error) {
    log('error', `Error creating device for user ${userId}: ${(error as Error).message}`, userId, { component: 'DeviceController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to create device.' });
  }
};

// Update an existing device
export const updateDevice = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  const updateData: Partial<Omit<Device, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = req.body;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'No update data provided.' });
  }

  try {
    const updatedDevice = await deviceService.updateDevice(deviceId, userId, updateData);
    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found or not owned by user.' });
    }
    res.status(200).json(updatedDevice);
  } catch (error) {
    log('error', `Error updating device ${deviceId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'DeviceController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to update device.' });
  }
};

// Delete a device
export const deleteDevice = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;
  try {
    const success = await deviceService.deleteDeviceByIdAndUserId(deviceId, userId);
    if (!success) {
      return res.status(404).json({ message: 'Device not found or not owned by user.' });
    }
    res.status(204).send(); 
  } catch (error) {
    log('error', `Error deleting device ${deviceId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'DeviceController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to delete device.' });
  }
};


// Update device status (e.g., on/off, brightness, volume)
export const controlDevice = async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { status, settings } = req.body; 
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH;

  if (status === undefined && settings === undefined) {
    return res.status(400).json({ message: 'No status or settings provided for control.' });
  }

  try {
    let updatePayload: Partial<Omit<Device, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {};
    if (status !== undefined) {
      updatePayload.status = status;
    }
    if (settings !== undefined) {
      const currentDevice = await deviceService.getDeviceByIdAndUserId(deviceId, userId);
      if (!currentDevice) {
        return res.status(404).json({ message: 'Device not found or not owned by user.' });
      }
      updatePayload.settings = { ...currentDevice.settings, ...settings };
    }
    
    const updatedDevice = await deviceService.updateDevice(deviceId, userId, updatePayload);

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found or update failed.' });
    }
    log('info', `Device ${deviceId} controlled by user ${userId}. New status: ${status}, New settings: ${JSON.stringify(settings)}`, userId, { component: 'DeviceController' });
    res.status(200).json(updatedDevice);
  } catch (error) {
    log('error', `Error controlling device ${deviceId} for user ${userId}: ${(error as Error).message}`, userId, { component: 'DeviceController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to control device.' });
  }
};
