
import type { Request, Response } from 'express';
import { scheduleOneTimeAction } from '../services/schedulerService';
import { log } from '../services/logService'; // Assuming a log service for more structured logging

interface WakeUpParams {
  userId: string;
  time: string; // e.g., "2024-07-30T07:00:00.000Z"
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high';
}

// Helper function to simulate device actions
const simulateDeviceAction = (userId: string, actionDescription: string) => {
  console.log(`[WakeUpController][User: ${userId}] Action: ${actionDescription}`);
  log('info', `Wake-up simulation action: ${actionDescription}`, userId, { component: 'WakeUpController' });
  // In a real app, this would call a deviceService to interact with actual devices
};

export const simulateWakeUp = async (req: Request, res: Response) => {
  try {
    const params = req.body as WakeUpParams;

    // Basic validation
    if (!params.userId || !params.time || !params.duration || !params.intensity) {
      log('warn', 'Missing required wake-up parameters.', undefined, { body: req.body });
      return res.status(400).json({ message: 'Missing required wake-up parameters.' });
    }

    const wakeUpTime = new Date(params.time);
    if (isNaN(wakeUpTime.getTime())) {
      log('warn', `Invalid time format for wake-up: ${params.time}`, params.userId);
      return res.status(400).json({ message: 'Invalid time format.' });
    }

    const now = new Date();
    const delayMs = wakeUpTime.getTime() - now.getTime();

    log('info', `Wake-up simulation request received for user ${params.userId}`, params.userId, { params });

    if (delayMs <= 5000) { // Consider times within 5 seconds as "immediate"
      console.log(`[WakeUpController] Simulating immediate wake-up for user ${params.userId}. Duration: ${params.duration}m, Intensity: ${params.intensity}.`);
      await log('info', `Starting immediate wake-up simulation for user ${params.userId}.`, params.userId, { duration: params.duration, intensity: params.intensity });

      // Simulate immediate actions
      simulateDeviceAction(params.userId, 'Gradually turn on smart lights to low.');
      simulateDeviceAction(params.userId, 'Play gentle wake-up soundscape at low volume.');
      
      if (params.intensity === 'medium' || params.intensity === 'high') {
        setTimeout(() => simulateDeviceAction(params.userId, 'Increase light intensity to medium.'), params.duration * 60 * 1000 / 3); // 1/3rd way through
        setTimeout(() => simulateDeviceAction(params.userId, 'Slightly increase soundscape volume.'), params.duration * 60 * 1000 / 3);
      }
      if (params.intensity === 'high') {
        setTimeout(() => simulateDeviceAction(params.userId, 'Start coffee machine sequence.'), params.duration * 60 * 1000 / 2); // Halfway through
        setTimeout(() => simulateDeviceAction(params.userId, 'Gradually open smart blinds.'), params.duration * 60 * 1000 * 2 / 3); // 2/3rd way through
      }
      setTimeout(() => simulateDeviceAction(params.userId, 'Wake-up sequence complete. Lights at target. Soundscape fading.'), params.duration * 60 * 1000);


      return res.status(200).json({ message: `Immediate wake-up simulation initiated for user ${params.userId}.` });
    }
    
    // Schedule the wake-up sequence for the future
    const scheduledJobId = scheduleOneTimeAction(delayMs, () => {
      console.log(`[WakeUpController] Executing scheduled wake-up for user ${params.userId} at ${new Date().toISOString()}`);
      log('info', `Executing scheduled wake-up for user ${params.userId}`, params.userId, { duration: params.duration, intensity: params.intensity });
      
      // Simulate actions for scheduled wake-up
      simulateDeviceAction(params.userId, 'Gradually turn on smart lights to low (scheduled).');
      simulateDeviceAction(params.userId, 'Play gentle wake-up soundscape at low volume (scheduled).');
      
      if (params.intensity === 'medium' || params.intensity === 'high') {
         // These inner setTimeouts are relative to the scheduled wake-up time
        setTimeout(() => simulateDeviceAction(params.userId, 'Increase light intensity to medium (scheduled).'), params.duration * 60 * 1000 / 3);
        setTimeout(() => simulateDeviceAction(params.userId, 'Slightly increase soundscape volume (scheduled).'), params.duration * 60 * 1000 / 3);
      }
      if (params.intensity === 'high') {
        setTimeout(() => simulateDeviceAction(params.userId, 'Start coffee machine sequence (scheduled).'), params.duration * 60 * 1000 / 2);
        setTimeout(() => simulateDeviceAction(params.userId, 'Gradually open smart blinds (scheduled).'), params.duration * 60 * 1000 * 2 / 3);
      }
      setTimeout(() => simulateDeviceAction(params.userId, 'Scheduled wake-up sequence complete. Lights at target. Soundscape fading.'), params.duration * 60 * 1000);

       // TODO: Potentially send a notification to the user via a notification service
    });

    console.log(`[WakeUpController] Wake-up for user ${params.userId} scheduled for ${wakeUpTime.toISOString()}. Job ID: ${scheduledJobId}`);
    await log('info', `Wake-up simulation scheduled for user ${params.userId} at ${wakeUpTime.toISOString()}. Job ID: ${scheduledJobId}`, params.userId);
    
    res.status(200).json({ 
      message: `Wake-up simulation scheduled successfully for user ${params.userId} at ${wakeUpTime.toLocaleTimeString()}.`,
      jobId: scheduledJobId 
    });

  } catch (error) {
    console.error('[WakeUpController] Error simulating wake-up:', error);
    await log('error', `Error simulating wake-up: ${(error as Error).message}`, undefined, { stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to simulate wake-up.' });
  }
};
