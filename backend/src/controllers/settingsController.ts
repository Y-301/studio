
import type { Request, Response } from 'express';
import * as settingsService from '../services/settingsService';
import { log } from '../services/logService';
import type { UserSettings } from '../models/settings';

const MOCK_USER_ID = 'user1'; // TODO: Replace with actual user ID from auth middleware

export const getUserSettings = async (req: Request, res: Response) => {
  // For GET /api/settings (no :userId param), we'd use authenticated user ID
  // For GET /api/settings/:userId (if kept), use req.params.userId
  // This example assumes the route might not have :userId and falls back to MOCK_USER_ID.
  // If your route is always /api/settings/:userId, then req.params.userId is primary.
  const userId = req.params.userId || MOCK_USER_ID; // Adjust based on your route structure

  if (!userId) {
    log('warn', 'User ID is required for getUserSettings.', undefined, { params: req.params, component: 'SettingsController' });
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const settings = await settingsService.getUserSettings(userId);
    res.status(200).json(settings);
  } catch (error) {
    console.error(`Error fetching settings for user ${userId}:`, error);
    log('error', `Error fetching settings for user ${userId}: ${(error as Error).message}`, userId, { component: 'SettingsController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to get user settings.' });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  // Similar to getUserSettings, determine userId based on route structure and auth
  const userId = req.params.userId || MOCK_USER_ID;
  const updates = req.body as Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;


  if (!userId) {
    log('warn', 'User ID is required for updateUserSettings.', undefined, { params: req.params, component: 'SettingsController' });
    return res.status(400).json({ message: 'User ID is required.' });
  }
  if (Object.keys(updates).length === 0) {
    log('warn', 'No settings provided to update for user.', userId, { body: req.body, component: 'SettingsController' });
    return res.status(400).json({ message: 'No settings provided to update.' });
  }
  
  // Basic validation example from original controller (can be expanded)
  if (updates.theme && !['light', 'dark', 'system'].includes(updates.theme)) {
      log('warn', `Invalid theme value: ${updates.theme}`, userId, { component: 'SettingsController' });
      return res.status(400).json({ message: 'Invalid theme value. Must be light, dark, or system.' });
  }
  if (updates.notifications) {
      if (updates.notifications.email !== undefined && typeof updates.notifications.email !== 'boolean') {
          return res.status(400).json({message: 'Invalid email notification setting.'});
      }
      if (updates.notifications.push !== undefined && typeof updates.notifications.push !== 'boolean') {
          return res.status(400).json({message: 'Invalid push notification setting.'});
      }
  }

  try {
    const updatedSettings = await settingsService.updateUserSettings(userId, updates);
    if (!updatedSettings) {
        // This might occur if service logic determines an update shouldn't happen, though current service creates if not exists.
        return res.status(404).json({ message: 'Settings not found or update failed.' });
    }
    log('info', `User settings updated successfully for ${userId}`, userId, { component: 'SettingsController', updates: Object.keys(updates) });
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error(`Error updating settings for user ${userId}:`, error);
    log('error', `Error updating settings for user ${userId}: ${(error as Error).message}`, userId, { component: 'SettingsController', stack: (error as Error).stack });
    res.status(500).json({ message: 'Failed to update user settings.' });
  }
};
