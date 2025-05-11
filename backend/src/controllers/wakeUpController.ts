
import type { Request, Response } from 'express';
import { scheduleOneTimeAction } from '../services/schedulerService';

interface WakeUpParams {
  userId: string;
  time: string; // e.g., "2024-07-30T07:00:00.000Z"
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high';
}

export const simulateWakeUp = async (req: Request, res: Response) => {
  try {
    const params = req.body as WakeUpParams;

    // Basic validation
    if (!params.userId || !params.time || !params.duration || !params.intensity) {
      return res.status(400).json({ message: 'Missing required wake-up parameters.' });
    }

    const wakeUpTime = new Date(params.time);
    if (isNaN(wakeUpTime.getTime())) {
      return res.status(400).json({ message: 'Invalid time format.' });
    }

    const now = new Date();
    const delayMs = wakeUpTime.getTime() - now.getTime();

    if (delayMs <= 0) {
      // For immediate or past requests, trigger a quick simulation
      console.log(`[WakeUpController] Simulating immediate wake-up for user ${params.userId}. Duration: ${params.duration}m, Intensity: ${params.intensity}.`);
      // Simulate actions (these would interact with device services)
      console.log('  - Action: Gradually turn on smart lights...');
      console.log('  - Action: Play gentle wake-up soundscape...');
      if (params.intensity === 'high') {
        console.log('  - Action: Start coffee machine...');
      }
      return res.status(200).json({ message: `Immediate wake-up simulation started for user ${params.userId}.` });
    }
    
    // Schedule the wake-up sequence using a simple setTimeout for this example
    // In a real app, this might involve a more robust job queue or scheduler
    scheduleOneTimeAction(delayMs, () => {
      console.log(`[WakeUpController] Executing scheduled wake-up for user ${params.userId} at ${new Date().toISOString()}`);
      console.log(`  - Duration: ${params.duration}m, Intensity: ${params.intensity}`);
      // Simulate actions
      console.log('  - Action: Gradually turn on smart lights...');
      console.log('  - Action: Play gentle wake-up soundscape...');
      if (params.intensity === 'high') {
        console.log('  - Action: Start coffee machine...');
      }
       // TODO: Potentially send a notification to the user via a notification service
    });

    console.log(`[WakeUpController] Wake-up for user ${params.userId} scheduled for ${wakeUpTime.toISOString()}.`);
    res.status(200).json({ 
      message: `Wake-up simulation scheduled successfully for user ${params.userId} at ${wakeUpTime.toLocaleTimeString()}.` 
    });

  } catch (error) {
    console.error('[WakeUpController] Error simulating wake-up:', error);
    res.status(500).json({ message: 'Failed to simulate wake-up.' });
  }
};
