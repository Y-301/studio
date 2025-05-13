
import type { Request, Response } from 'express';
import { scheduleOneTimeAction } from '../services/schedulerService';
import { log } from '../services/logService';
import * as deviceService from '../services/deviceService'; 
import type { Device } from '../models/device';

interface WakeUpParams {
  userId?: string; // Made optional, will use header or default
  time: string; 
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high';
}

const DEFAULT_MOCK_USER_ID_IF_NO_AUTH = 'user1'; 

// Helper function to simulate device actions
const simulateDeviceAction = async (userId: string, actionDescription: string, deviceType?: Device['type'], targetStatus?: string, targetSettings?: any) => {
  console.log(`[WakeUpController][User: ${userId}] Action: ${actionDescription}`);
  log('info', `Wake-up simulation action: ${actionDescription}`, userId, { component: 'WakeUpController' });

  if (deviceType) {
    const userDevices = await deviceService.getDevicesByUserId(userId);
    const targetDevices = userDevices.filter(d => d.type === deviceType);

    for (const device of targetDevices) {
      let updatePayload: Partial<Omit<Device, 'id'|'userId'|'createdAt'|'updatedAt'>> = {};
      if (targetStatus) {
        updatePayload.status = targetStatus;
      }
      if (targetSettings) {
        updatePayload.settings = { ...device.settings, ...targetSettings };
      }
      if (Object.keys(updatePayload).length > 0) {
        await deviceService.updateDevice(device.id, userId, updatePayload);
        log('info', `Wake-up sim: Device ${device.name} (${device.id}) updated.`, userId, { component: 'WakeUpController', deviceId: device.id, ...updatePayload});
      }
    }
  }
};

export const simulateWakeUp = async (req: Request, res: Response) => {
  try {
    const params = req.body as WakeUpParams;
    const userId = params.userId || (req.headers['x-user-id'] as string) || DEFAULT_MOCK_USER_ID_IF_NO_AUTH; 

    if (!params.time || !params.duration || !params.intensity) {
      log('warn', 'Missing required wake-up parameters.', userId, { body: req.body });
      return res.status(400).json({ message: 'Missing required wake-up parameters: time, duration, and intensity.' });
    }
    if (!['low', 'medium', 'high'].includes(params.intensity)) {
        return res.status(400).json({ message: 'Invalid intensity value. Must be low, medium, or high.' });
    }
    if (params.duration <=0 || params.duration > 120) {
        return res.status(400).json({ message: 'Invalid duration. Must be between 1 and 120 minutes.' });
    }


    const wakeUpTime = new Date(params.time);
    if (isNaN(wakeUpTime.getTime())) {
      log('warn', `Invalid time format for wake-up: ${params.time}`, userId);
      return res.status(400).json({ message: 'Invalid time format. Please use ISO 8601 format.' });
    }

    const now = new Date();
    const delayMs = wakeUpTime.getTime() - now.getTime();

    log('info', `Wake-up simulation request received for user ${userId}`, userId, { params });

    const performWakeUpActions = async () => {
      console.log(`[WakeUpController] Executing wake-up sequence for user ${userId} at ${new Date().toISOString()}`);
      log('info', `Executing wake-up for user ${userId}`, userId, { duration: params.duration, intensity: params.intensity });

      await simulateDeviceAction(userId, 'Gradually turn on smart lights to low.', 'light', 'on', { brightness: params.intensity === 'low' ? 30 : (params.intensity === 'medium' ? 40 : 20) });
      await simulateDeviceAction(userId, 'Play gentle wake-up soundscape at low volume.', 'speaker', 'on', { volume: params.intensity === 'low' ? 20 : 30 });
      
      const thirdDurationMs = params.duration * 60 * 1000 / 3;
      const halfDurationMs = params.duration * 60 * 1000 / 2;
      const twoThirdsDurationMs = params.duration * 60 * 1000 * 2 / 3;
      const fullDurationMs = params.duration * 60 * 1000;

      if (params.intensity === 'medium' || params.intensity === 'high') {
        setTimeout(async () => {
          await simulateDeviceAction(userId, 'Increase light intensity to medium.', 'light', 'on', { brightness: params.intensity === 'medium' ? 60 : 50 });
          await simulateDeviceAction(userId, 'Slightly increase soundscape volume.', 'speaker', 'on', { volume: params.intensity === 'medium' ? 40 : 50});
        }, thirdDurationMs);
      }
      if (params.intensity === 'high') {
         setTimeout(async () => {
            await simulateDeviceAction(userId, 'Start coffee machine sequence (simulated via a smart switch).', 'switch', 'on'); 
         }, halfDurationMs);
        setTimeout(async () => {
            await simulateDeviceAction(userId, 'Gradually open smart blinds.', 'blinds', 'partially_open', { position: 50 }); 
            await simulateDeviceAction(userId, 'Set thermostat to comfortable temperature.', 'thermostat', 'on', { temperature: 21 });
        }, twoThirdsDurationMs);
      }
      
      setTimeout(async () => {
        await simulateDeviceAction(userId, 'Wake-up sequence complete. Lights at target. Soundscape fading.', 'light', 'on', { brightness: params.intensity === 'low' ? 50 : (params.intensity === 'medium' ? 70 : 90) });
        await simulateDeviceAction(userId, 'Fade out soundscape.', 'speaker', 'off', { volume: 0 });
        if (params.intensity === 'high') {
            await simulateDeviceAction(userId, 'Fully open smart blinds.', 'blinds', 'open', { position: 100 });
        }
        log('info', `Wake-up sequence completed for user ${userId}`, userId);
      }, fullDurationMs);
    };


    if (delayMs <= 5000) { 
      console.log(`[WakeUpController] Simulating immediate wake-up for user ${userId}. Duration: ${params.duration}m, Intensity: ${params.intensity}.`);
      await log('info', `Starting immediate wake-up simulation for user ${userId}.`, userId, { duration: params.duration, intensity: params.intensity });
      
      performWakeUpActions(); 

      return res.status(200).json({ message: `Immediate wake-up simulation initiated for user ${userId}.` });
    }
    
    const scheduledJobId = scheduleOneTimeAction(delayMs, performWakeUpActions);

    console.log(`[WakeUpController] Wake-up for user ${userId} scheduled for ${wakeUpTime.toISOString()}. Job ID: ${scheduledJobId}`);
    await log('info', `Wake-up simulation scheduled for user ${userId} at ${wakeUpTime.toISOString()}. Job ID: ${scheduledJobId}`, userId);
    
    res.status(200).json({ 
      message: `Wake-up simulation scheduled successfully for user ${userId} at ${wakeUpTime.toLocaleTimeString()}.`,
      jobId: scheduledJobId 
    });

  } catch (error) {
    console.error('[WakeUpController] Error simulating wake-up:', error);
    await log('error', `Error simulating wake-up: ${(error as Error).message}`, undefined, { stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to simulate wake-up.' });
  }
};
